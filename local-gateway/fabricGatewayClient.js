const grpc = require("@grpc/grpc-js");
const fabricGateway = require("@hyperledger/fabric-gateway");
// import { connect, Contract, Identity, Signer, signers } from "@hyperledger/fabric-gateway";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { TextDecoder } = require("util");

const channelName = "mychannel";
const chaincodeName = "ipfscc";
const mspId = "Org1MSP";

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

// Gateway peer endpoint.
const peerEndpoint = "localhost:7051";

// Gateway peer SSL host name override.
const peerHostAlias = "peer0.org1.fabrictest.com";

const utf8Decoder = new TextDecoder();
const assetId = `asset${Date.now()}`;

async function gatewayAPI() {
  // The gRPC client connection should be shared by all Gateway connections to this endpoint.
  const client = await newGrpcConnection();

  const gateway = fabricGateway.connect({
    client,
    identity: await newIdentity(),
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

  try {
    // Get a network instance representing the channel where the smart contract is deployed.
    const network = gateway.getNetwork(channelName);

    // Get the smart contract from the network.
    const contract = network.getContract(chaincodeName);
  } catch (error) {
    console.error("******** FAILED to run the application:", error);
    process.exitCode = 1;
  } finally {
    gateway.close();
    client.close();
  }
}

async function newGrpcConnection() {
  const tlsRootCert = await fs.promises.readFile(tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": peerHostAlias,
  });
}
async function newIdentity() {
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

/**
 * Submit transaction asynchronously, allowing the application to process the smart contract response (e.g. update a UI)
 * while waiting for the commit notification.
 */
async function transferAssetAsync(contract) {
  console.log("\n--> Async Submit Transaction: TransferAsset, updates existing asset owner");
  const commit = await contract.submitAsync("TransferAsset", {
    arguments: [assetId, "Saptha"],
  });
  const oldOwner = utf8Decoder.decode(commit.getResult());
  console.log(
    `*** Successfully submitted transaction to transfer ownership from ${oldOwner} to Saptha`
  );
  console.log("*** Waiting for transaction commit");
  const status = await commit.getStatus();
  if (!status.successful) {
    throw new Error(
      `Transaction ${status.transactionId} failed to commit with status code ${status.code}`
    );
  }
  console.log("*** Transaction committed successfully");
}

async function readAssetByID(contract) {
  console.log("\n--> Evaluate Transaction: ReadAsset, function returns asset attributes");
  const resultBytes = await contract.evaluateTransaction("ReadAsset", assetId);
  const resultJson = utf8Decoder.decode(resultBytes);
  const result = JSON.parse(resultJson);
  console.log("*** Result:", result);
}
/**
 * submitTransaction() will throw an error containing details of any error responses from the smart contract.
 */
async function updateNonExistentAsset(contract) {
  console.log(
    "\n--> Submit Transaction: UpdateAsset asset70, asset70 does not exist and should return an error"
  );
  try {
    await contract.submitTransaction("UpdateAsset", "asset70", "blue", "5", "Tomoko", "300");
    console.log("******** FAILED to return an error");
  } catch (error) {
    console.log("*** Successfully caught the error: \n", error);
  }
}

const fabricGatewayClient = { gatewayAPI, getAllAssets, getAssetByID, uploadDataAsAsset };

module.exports = fabricGatewayClient;
