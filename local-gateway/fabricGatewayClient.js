const grpc = require("@grpc/grpc-js");
const fabricGateway = require("@hyperledger/fabric-gateway");
// import { connect, Contract, Identity, Signer, signers } from "@hyperledger/fabric-gateway";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { TextDecoder } = require("util");

// Path to crypto materials.
const cryptoPath = path.resolve(
  __dirname,
  "..",
  "hyperledger-fabric-setup",
  "organizations",
  "peerOrganizations",
  "org1.fabrictest.com"
);
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
async function gatewayAPI(gatewayPort, peerHostAlias, mspId) {
  // The gRPC client connection should be shared by all Gateway connections to this endpoint.
  const client = await newGrpcConnection(gatewayPort, peerHostAlias);

  const gateway = fabricGateway.connect({
    client,
    identity: await newIdentity(mspId),
    signer: await newSigner(),
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

async function newGrpcConnection(gatewayPort, peerHostAlias) {
  const peerEndpoint = `localhost:${gatewayPort}`;
  const tlsRootCert = await fs.promises.readFile(tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": peerHostAlias,
  });
}
async function newIdentity(mspId) {
  const credentials = await fs.promises.readFile(certPath);
  return { mspId, credentials };
}
async function newSigner() {
  const files = await fs.promises.readdir(keyDirectoryPath);
  const keyPath = path.resolve(keyDirectoryPath, files[0]);
  const privateKeyPem = await fs.promises.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return fabricGateway.signers.newPrivateKeySigner(privateKey);
}

async function getAllAssets(contract) {
  console.log(
    "\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger"
  );
  const resultBytes = await contract.evaluateTransaction("GetAllAssets");
  const resultJson = utf8Decoder.decode(resultBytes);

  // Check if the resultJson is empty (no data on the ledger)
  if (!resultJson) {
    console.log("*** No assets found on the ledger.");
    return { message: "No assets found on the ledger" }; // Return an empty array to indicate no data found
  }

  const result = JSON.parse(resultJson);
  console.log("*** Result:", result);
  return result;
}

async function getMyOrgsAssets(contract) {
  console.log(
    "\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger"
  );
  const resultBytes = await contract.evaluateTransaction("GetMyOrgsAssets");
  const resultJson = utf8Decoder.decode(resultBytes);

  // Check if the resultJson is empty (no data on the ledger)
  if (!resultJson) {
    console.log("*** No assets found on the ledger.");
    return { message: "No assets found on the ledger" }; // Return an empty array to indicate no data found
  }

  const result = JSON.parse(resultJson);
  console.log("*** Result:", result);
  return result;
}

// Need to think about encryption keys as well
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
    await contract.submitTransaction(
      "UploadKeyPrivateData",
      deviceName,
      IPFS_CID,
      date,
      symmetricKey
    );
    console.log("*** Data uploaded to private implicit collection successfully!");
  } catch (error) {
    console.error("*** Error ocurred uploading Private Data to implicit data collection:", error);
  }
}

// GetKeyPrivateData(ctx contractapi.TransactionContextInterface, assetId string)
async function getKeyPrivateData(contract, assetId) {
  try {
    // Need to do something with transient here.
    const resultBytes = await contract.submitTransaction("GetKeyPrivateData", assetId);
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log("*** Data successfully fetched from private implicit collection!");
    return result;
  } catch (error) {
    console.error("*** Error fetching Private Data from implicit data collection:", error);
  }
}

async function getAssetByID(contract, assetId) {
  console.log(
    "\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger"
  );
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

const fabricGatewayClient = {
  gatewayAPI,
  getAllAssets,
  getMyOrgsAssets,
  getAssetByID,
  uploadDataAsAsset,
  uploadKeyPrivateData,
  getKeyPrivateData,
};

module.exports = fabricGatewayClient;
