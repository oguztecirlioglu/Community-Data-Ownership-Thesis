/*
Aspects of this script were inspired from the office samples provided by the Hyperledger Fabric community from their TypeScript based
Application Gateway component that connects to a Peer service and invokes chaincode.
This sample is made available below:
https://github.com/hyperledger/fabric-samples/tree/main/asset-transfer-basic/application-gateway-typescript 

In particular, creating the connection to the Gateway API, invoking and evaluating smart contracts were 
aspects of the sample implemention referenced when developing this script
*/

const grpc = require("@grpc/grpc-js");
const fabricGateway = require("@hyperledger/fabric-gateway");
// import { connect, Contract, Identity, Signer, signers } from "@hyperledger/fabric-gateway";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { TextDecoder } = require("util");

// Path to crypto materials.
const cryptoPath = path.resolve(__dirname, "..", "hyperledger-fabric-setup", "organizations");

// Path to user private key directory.
const keyDirectoryPath = path.resolve(
  cryptoPath,
  "users",
  "User1@org1.fabrictest.com",
  "msp",
  "keystore"
);
// Path to user certificate.
const certPath = path.resolve(
  cryptoPath,
  "users",
  "User1@org1.fabrictest.com",
  "msp",
  "signcerts",
  "User1@org1.fabrictest.com-cert.pem"
);
// Path to peer tls certificate.
const tlsCertPath = path.resolve(cryptoPath, "peers", "peer0.org1.fabrictest.com", "tls", "ca.crt");

const utf8Decoder = new TextDecoder();

/**
 * Creates a gRPC client connection to the local organisation peer running the Fabric Gateway.
 * @param {Number} gatewayPort
 * @param {String} peerHostAlias
 * @param {String} mspId
 * @returns {{gateway: Object, client: Object}} Object that has two fields: gateway and client. The client is the gRPC connection client.
 * The gateway is the gateway object used to interact with the Fabric network.
 */
async function gatewayAPI(
  gatewayPort,
  peerHostAlias,
  mspId,
  tlsCertPath,
  certPath,
  keyDirectoryPath
) {
  // The gRPC client connection should be shared by all Gateway connections to this endpoint.
  const client = await newGrpcConnection(gatewayPort, peerHostAlias, tlsCertPath);

  const gateway = fabricGateway.connect({
    client,
    identity: await newIdentity(mspId, certPath),
    signer: await newSigner(keyDirectoryPath),
    // Default timeouts for different gRPC calls
    evaluateOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    endorseOptions: () => {
      return { deadline: Date.now() + 15000 }; // 15 seconds
    },
    submitOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    commitStatusOptions: () => {
      return { deadline: Date.now() + 60000 }; // 1 minute
    },
  });

  return { gateway, client };
}
/**
 *
 * @param {Number} gatewayPort
 * @param {String} peerHostAlias
 * @param {String} tlsCertPath
 * @returns {grpc.Client}
 */
async function newGrpcConnection(gatewayPort, peerHostAlias, tlsCertPath) {
  const peerEndpoint = `localhost:${gatewayPort}`;
  const tlsRootCert = await fs.promises.readFile(tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": peerHostAlias,
  });
}
/**
 *
 * @param {String} mspId
 * @param {String} certPath
 * @returns {Object}
 */
async function newIdentity(mspId, certPath) {
  const credentials = await fs.promises.readFile(certPath);
  return { mspId, credentials };
}
/**
 *
 * @param {String} keyDirectoryPath
 * @returns {fabricGateway.Signer}
 */
async function newSigner(keyDirectoryPath) {
  const files = await fs.promises.readdir(keyDirectoryPath);
  const keyPath = path.resolve(keyDirectoryPath, files[0]);
  const privateKeyPem = await fs.promises.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return fabricGateway.signers.newPrivateKeySigner(privateKey);
}

async function getAllDataAssets(contract) {
  console.log(
    "\n--> Evaluate Transaction: GetAllDataAssets, function returns all the current assets on the ledger"
  );
  const resultBytes = await contract.evaluateTransaction("GetAllDataAssets");
  const resultJson = utf8Decoder.decode(resultBytes);

  if (!resultJson) {
    console.log("*** No assets found on the ledger.");
    return { message: "No assets found on the ledger" };
  }

  const result = JSON.parse(resultJson);
  console.log("*** Result:", result);
  return result;
}

async function getMyOrgsDataAssets(contract) {
  console.log(
    "\n--> Evaluate Transaction: GetMyOrgsDataAssets, function returns all the current assets on the ledger"
  );
  const resultBytes = await contract.evaluateTransaction("GetMyOrgsDataAssets");
  const resultJson = utf8Decoder.decode(resultBytes);

  if (!resultJson) {
    console.log("*** No assets found on the ledger.");
    return { message: "No assets found on the ledger" };
  }

  const result = JSON.parse(resultJson);
  console.log("*** Result:", result);
  return result;
}

async function getOtherOrgsDataAssets(contract) {
  console.log(
    "\n--> Evaluate Transaction: GetOtherOrgsDataAssets, function returns all the current assets on the ledger"
  );
  const resultBytes = await contract.evaluateTransaction("GetOtherOrgsDataAssets");
  const resultJson = utf8Decoder.decode(resultBytes);

  if (!resultJson) {
    console.log("*** No assets found on the ledger.");
    return { message: "No assets found on the ledger" };
  }

  const result = JSON.parse(resultJson);
  console.log("*** Result:", result);
  return result;
}

/**
 * Submits a blocking synchronous transaction
 * @param {*} deviceName
 * @param {*} cid
 * @param {*} date
 */
async function uploadDataAsAsset(contract, deviceName, cid, date) {
  console.log(
    "\n--> Submit Transaction: UploadDataAsAsset, creates a new asset with ID: cid+_+date, deviceName, cid, date"
  );
  try {
    await contract.submitTransaction("UploadDataAsAsset", deviceName, cid, date);
    console.log("*** Transaction committed successfully");
  } catch (error) {
    console.log("*** Error during UploadDataAsAsset: \n", error);
  }
}

// UploadKeyPrivateData(ctx contractapi.TransactionContextInterface, assetName string, IPFS_CID string, date string, symmetricKey string)
async function uploadKeyPrivateData(contract, deviceName, IPFS_CID, date, symmetricKey) {
  try {
    // Need to do something with transient here.
    await contract.submit("UploadKeyPrivateData", {
      arguments: [deviceName, IPFS_CID, date],
      transientData: { symmetricKey: symmetricKey },
    });

    console.log("*** Data uploaded to private implicit collection successfully!");
  } catch (error) {
    console.error("*** Error ocurred uploading Private Data to implicit data collection:", error);
  }
}

// GetKeyPrivateData(ctx contractapi.TransactionContextInterface, assetId string)
async function getKeyPrivateData(contract, assetId) {
  try {
    const resultBytes = await contract.evaluateTransaction("GetKeyPrivateData", assetId);
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log("*** Data successfully fetched from private implicit collection!");
    return result;
  } catch (error) {
    console.error("*** Error fetching Private Data from implicit data collection:", error);
  }
}

//newOwnerOrg string, deviceName string, date string, symmetricKey string
async function transferEncKey(contract, clientOrg, newOwnerOrg, deviceName, date, symmetricKey) {
  const endorsingOrgs = [newOwnerOrg, clientOrg];
  try {
    await contract.submit("TransferEncKey", {
      arguments: [newOwnerOrg, deviceName, date],
      transientData: { symmetricKey: symmetricKey },
      endorsingOrganizations: endorsingOrgs,
    });
    console.log("*** Data successfully transferred between private collections!");
  } catch (error) {
    console.error("*** Error transferring private data from implicit data collection:", error);
  }
}

async function getAssetByID(contract, assetId) {
  try {
    const resultBytes = await contract.evaluateTransaction("GetAssetByID", assetId);
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log("*** Asset Received succesfully");
    return result;
  } catch (error) {
    console.error("***Error during GetAssetById: \n", error);
  }
}

async function getBidsForMyOrg(contract) {
  try {
    const resultBytes = await contract.evaluateTransaction("GetBidsForMyOrg");
    const resultJson = utf8Decoder.decode(resultBytes);
    if (!resultJson) {
      console.log("*** No bids found on the ledger for this org.");
      return { message: "No bids found on the ledger for this org." }; // Return an empty array to indicate no data found
    }
    const result = JSON.parse(resultJson);
    console.log("*** Bids For My Org Received succesfully");
    return result;
  } catch (error) {
    console.error("***Error getting bids for my org: \n", error);
  }
}

async function bidForData(contract, deviceName, date, price, additionalCommitments) {
  try {
    await contract.submitTransaction("BidForData", deviceName, date, price, additionalCommitments);
    console.log("*** Bid submitted succesfully");
  } catch (error) {
    console.error(`***Error bidding for device ${deviceName}s data:`, error);
  }
}

async function acceptBid(contract, biddingOrg, deviceName, date, price) {
  try {
    await contract.submitTransaction("AcceptBid", biddingOrg, deviceName, date, price);
  } catch (error) {
    console.error(`***Error accepting bid from ${biddingOrg}, error is:`, error);
  }
}

//ownerOrg string, buyingOrg, string, deviceName string, date string
async function getDataBidDetails(contract, ownerOrg, buyingOrg, deviceName, date) {
  try {
    const resultBytes = await contract.submitTransaction(
      "GetDataBidDetails",
      ownerOrg,
      buyingOrg,
      deviceName,
      date
    );
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log("*** Asset Received succesfully");
    return result;
  } catch (error) {
    console.error(`***Error getting bid details error is:`, error);
  }
}

const fabricGatewayClient = {
  gatewayAPI,
  getAllDataAssets,
  getMyOrgsDataAssets,
  getOtherOrgsDataAssets,
  getAssetByID,
  getBidsForMyOrg,
  bidForData,
  acceptBid,
  getDataBidDetails,
  uploadDataAsAsset,
  uploadKeyPrivateData,
  getKeyPrivateData,
  transferEncKey,
};

module.exports = fabricGatewayClient;
