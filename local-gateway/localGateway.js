const express = require("express");
const cors = require("cors");
require("./jsDocTypes");
const utils = require("./utils");
const ipfsUtils = require("./ipfsUtils");
const fabricGatewayClient = require("./fabricGatewayClient");
const crypto = require("crypto");
const { default: axios } = require("axios");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

const UPDATE_POLL_FREQUENCY = utils.envOrDefault("LOCAL_GATEWAY_UPDATE_POLL_FREQUENCY", 10);
const PORT = utils.envOrDefault("LOCAL_GATEWAY_PORT", 7500);
const JSON_PATH = utils.envOrDefault("LOCAL_GATEWAY_JSON_PATH", "./localStorage.json");
const IPFS_API_PORT = utils.envOrDefault("IPFS_API_PORT", 5001);
const IPFS_HTTP_GATEWAY_PORT = utils.envOrDefault("IPFS_HTTP_GATEWAY_PORT", 8080);
const IPFSCLUSTER_API_PORT = utils.envOrDefault("IPFSCLUSTER_API_PORT", 9094);
const CHANNEL_NAME = utils.envOrDefault("FABRIC_CHANNEL_NAME", "mychannel");
const CHAINCODE_NAME = utils.envOrDefault("FABRIC_CHAINCODE_NAME", "ipfscc");
const FABRIC_GATEWAY_PORT = utils.envOrDefault("FABRIC_GATEWAY_PORT", 7051);
const FABRIC_PEER_ALIAS = utils.envOrDefault("FABRIC_PEER_ALIAS", "peer0.org1.fabrictest.com");
const FABRIC_MSPID = utils.envOrDefault("FABRIC_MSPID", "Org1MSP");
const ORG_NUMBER = utils.envOrDefault("ORG_NUMBER", 1);

const CRYPTO_MATERIAL_PATH = path.resolve(
  __dirname,
  "..",
  "hyperledger-fabric-setup",
  "organizations"
);

const FABRIC_TLS_CERT_PATH = utils.envOrDefault(
  "FABRIC_TLS_CERT_PATH",
  path.resolve(
    CRYPTO_MATERIAL_PATH,
    "peerOrganizations",
    `org${ORG_NUMBER}.fabrictest.com`,
    "peers",
    `peer0.org${ORG_NUMBER}.fabrictest.com`,
    "tls",
    "ca.crt"
  )
);
const FABRIC_CERT_PATH = utils.envOrDefault(
  "FABRIC_CERT_PATH",
  path.resolve(
    CRYPTO_MATERIAL_PATH,
    "peerOrganizations",
    `org${ORG_NUMBER}.fabrictest.com`,
    "users",
    `User1@org${ORG_NUMBER}.fabrictest.com`,
    "msp",
    "signcerts",
    `User1@org${ORG_NUMBER}.fabrictest.com-cert.pem`
  )
);
const FABRIC_KEY_PATH = utils.envOrDefault(
  "FABRIC_KEY_PATH",
  path.resolve(
    CRYPTO_MATERIAL_PATH,
    "peerOrganizations",
    `org${ORG_NUMBER}.fabrictest.com`,
    "users",
    `User1@org${ORG_NUMBER}.fabrictest.com`,
    "msp",
    "keystore"
  )
);
/* 
The previouslySavedData is only to be saved when the app closes or crashes. Once it's loaded, we only use the in memory object.
Check if any of the keys have values older than today. If so, upload that entire key-value pair to IPFS and delete it from the object.
If Object is from today, save it to dailyStorage in memory JavaScript object.
This relies on the assumption that the key-value pair doesn't have any data from today if the oldest data it has is from a previous day, because on every new day the code automatically uploads the data and purges old records.
*/
const previouslySavedData = utils.loadFileAsObject(JSON_PATH);
const dailyStorage = previouslySavedData;
// To prevent duplicating data, delete current saved file so that if an unhandleable crash occurs the same data isn't uploaded twice.
utils.deleteFile(JSON_PATH);

// Create global gateway and client variables that will be initialised later.
let gateway;
let client;

let uploadingDataInProgress = false;

async function dataUploadLifecycle(dailyStorage) {
  try {
    if (uploadingDataInProgress) {
      console.log(
        "Previous call to dataUploadLifecycle is in progress, waiting for that to finish."
      );
      return;
    }
    uploadingDataInProgress = true;

    console.log(
      "Polling for updates to the stored data, will push yesterdays data to the IPFS and Hyperledger Network."
    );

    const { keep: _, upload: dataToUpload } = utils.filterData(dailyStorage);

    for (const [key, value] of Object.entries(dataToUpload)) {
      const dataDate = value[0]?.time.substring(0, 10);
      const deviceName = key;

      const dataEntry = {
        device_name: deviceName,
        date: dataDate,
        data: value,
      };

      const { status, cid, symmetricKey } = await ipfsUtils.uploadToIPFS(
        dataEntry,
        IPFSCLUSTER_API_PORT
      );

      const symmetricKeyBase64 = symmetricKey.toString("base64");

      if (status !== 0) throw new Error(`Error uploading data to IPFS, error is:${cid}`);

      console.log(`Data successfully uploaded to IPFS for device ${deviceName}, CID is: ${cid}`);

      const network = gateway.getNetwork(CHANNEL_NAME);
      const contract = network.getContract(CHAINCODE_NAME);
      await Promise.all([
        fabricGatewayClient.uploadDataAsAsset(contract, deviceName, cid, dataDate),
        fabricGatewayClient.uploadKeyPrivateData(
          contract,
          deviceName,
          cid,
          dataDate,
          symmetricKeyBase64
        ),
      ]);
      delete dailyStorage[key];
      console.log(`Data successfully uploaded to Fabric Ledger for device ${deviceName}`);
    }
  } catch (error) {
    console.error(
      `Error while uploading data to the IPFS and Hyperledger Fabric Framework, the error is: ${error}`
    );
    uploadingDataInProgress = false;
  }
  uploadingDataInProgress = false;
}

async function main() {
  // NodeJS equivalent of creating a "main" method.
  if (require.main == module) {
    // Initialise Fabric Gateway API.
    try {
      const { gateway: gtwy, client: clnt } = await fabricGatewayClient.gatewayAPI(
        FABRIC_GATEWAY_PORT,
        FABRIC_PEER_ALIAS,
        FABRIC_MSPID,
        FABRIC_TLS_CERT_PATH,
        FABRIC_CERT_PATH,
        FABRIC_KEY_PATH
      );
      gateway = gtwy;
      client = clnt;
    } catch (error) {
      console.error("Error connection to Fabric API Gateway", error);
    }

    const poller = setInterval(
      () => dataUploadLifecycle(dailyStorage),
      UPDATE_POLL_FREQUENCY * 1000
    );

    app.post("/api/dataInput", (req, res) => {
      let { status_code, message } = utils.processDataInput(req.body, dailyStorage);

      if (status_code != 0)
        return res.status(406).send("Error comitting IoT Data, error is:" + message);

      res.status(200).send("Data submitted successfully");
    });

    app.get("/fabric/getAssetData/:assetId", async (req, res) => {
      const assetId = req.params.assetId;
      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        //Use promise all to execute the two async methods in parallel.
        const [asset, privateKeyCIDAsset] = await Promise.all([
          await fabricGatewayClient.getAssetByID(contract, assetId),
          await fabricGatewayClient.getKeyPrivateData(contract, assetId),
        ]);

        const dataCid = asset?.IPFS_CID;
        const response = await axios.get(`http://localhost:8080/ipfs/${dataCid}`);
        const ciphertext = response.data;
        const symmetricKeyBase64 = privateKeyCIDAsset?.symmetricKey;

        const decipher = crypto.createDecipheriv(
          "aes-256-ecb",
          Buffer.from(symmetricKeyBase64, "base64"),
          null
        );
        let plaintext = decipher.update(ciphertext, "base64", "utf8");
        plaintext += decipher.final("utf8");

        res.status(200).send(JSON.parse(plaintext));
      } catch (error) {
        console.error("***Error getting asset data: ", error.message);
        res.status(500).send(`Errro getting asset data: ${error.message}`);
      }
    });

    app.get("/fabric/getAsset/:assetId", async (req, res) => {
      const assetId = req.params.assetId;
      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const asset = await fabricGatewayClient.getAssetByID(contract, assetId);

        res.status(200).send(asset);
      } catch (error) {
        console.error("***Error getting asset: ", error.message);
        res.status(500).send(`Errro getting asset: ${error.message}`);
      }
    });

    // Get all assets on the ledger that belong to the Org of the connected gateway.
    app.get("/fabric/getMyOrgsDataAssets", async (req, res) => {
      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const result = await fabricGatewayClient.getMyOrgsDataAssets(contract);
        res.status(200).send(result);
      } catch (error) {
        console.error("******** FAILED to get all assets:", error);
        res.status(500).send(`ERROR: ${error.message}`);
      }
    });

    // Get all assets on the ledger that belong to Orgs that aren't of the client connected to the gateway.
    app.get("/fabric/getOtherOrgsDataAssets", async (req, res) => {
      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const result = await fabricGatewayClient.getOtherOrgsDataAssets(contract);
        res.status(200).send(result);
      } catch (error) {
        console.error("******** FAILED to get all assets:", error);
        res.status(500).send(`ERROR: ${error.message}`);
      }
    });

    // Gets all assets on the ledger, but doesn't decrypt and show actual IPFS content, just entries on the ledger (pointers to data, which device etc.).
    app.get("/fabric/getAllDataAssets", async (req, res) => {
      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const result = await fabricGatewayClient.getAllDataAssets(contract);
        res.status(200).send(result);
      } catch (error) {
        console.error("******** FAILED to get all assets:", error);
        res.status(500).send(`ERROR: ${error.message}`);
      }
    });

    app.get("/fabric/getAllAssets", async (req, res) => {
      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const result = await fabricGatewayClient.getAllAssets(contract);
        res.status(200).send(result);
      } catch (error) {
        console.error("******** FAILED to get all assets:", error);
        res.status(500).send(`ERROR: ${error.message}`);
      }
    });

    app.get("/fabric/getMyOrg", async (req, res) => {
      try {
        const result = gateway.getIdentity()?.mspId;
        res.status(200).send({ mspid: result });
      } catch (error) {
        console.error("******** FAILED to get all assets:", error);
        res.status(500).send(`ERROR: ${error.message}`);
      }
    });

    app.get("/fabric/getBidsForMyOrg", async (req, res) => {
      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const result = await fabricGatewayClient.getBidsForMyOrg(contract);
        res.status(200).send(result);
      } catch (error) {
        console.error("******** FAILED to get bids for this org:", error);
        res.status(500).send(`ERROR: ${error.message}`);
      }
    });

    //deviceName date, price
    app.post("/fabric/bidForData", async (req, res) => {
      const deviceName = req.body?.deviceName;
      const date = req.body?.date;
      const price = req.body?.price;
      const additionalCommitments = req.body?.additionalCommitments;
      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const result = await fabricGatewayClient.bidForData(
          contract,
          deviceName,
          date,
          price,
          additionalCommitments
        );
        res.status(200).send(result);
      } catch (error) {
        console.error("******** FAILED to bid for data:", error);
        res.status(500).send(`ERROR: ${error.message}`);
      }
    });

    app.post("/fabric/acceptBid", async (req, res) => {
      const biddingOrg = req.body?.biddingOrg;
      const deviceName = req.body?.deviceName;
      const date = req.body?.date;
      const price = req.body?.price;
      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const clientOrg = await gateway.getIdentity()?.mspId;
        let result = await fabricGatewayClient.acceptBid(
          contract,
          biddingOrg,
          deviceName,
          date,
          price
        );
        const privateKeyCIDAsset = await fabricGatewayClient.getKeyPrivateData(
          contract,
          deviceName + "_" + date
        );
        const symmetricKeyBase64 = privateKeyCIDAsset?.symmetricKey;
        result = await fabricGatewayClient.transferEncKey(
          contract,
          clientOrg,
          biddingOrg,
          deviceName,
          date,
          symmetricKeyBase64
        );
        res.status(200).send("Bid accepted succesfully");
      } catch (error) {
        console.error("******** FAILED to accept bid:", error);
        res.status(500).send(`ERROR: ${error.message}`);
      }
    });

    app.get("/fabric/getEvents", async (req, res) => {
      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const events = await network.getChaincodeEvents(CHAINCODE_NAME, { startBlock: BigInt(0) });
        for await (const event of events) {
          console.log(event);
          // if prefix is "bidApproval_myMspid"
          // you know that you have to process this, check if bidTransferCompleted in state
          // if not, process it, then set transferCompleted in
        }
      } catch (error) {
        console.error("Error iterating through events, error is:", error);
      } finally {
        events.close();
      }
    });

    app.listen(PORT, () => {
      console.log(`Local Gateway running on ${PORT}`);
    });
  }
}

function cleanUpServer(eventType) {
  console.log(
    `${eventType} Message received. Closing application, saving aggregated IoT data to ${process.env.PWD}/${JSON_PATH}`
  );
  utils.locallyStoreJSON(dailyStorage, JSON_PATH);
  gateway.close();
  client.close();
  process.exit();
}

// Handle all crashes that we can, to persist data in local storage.
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, cleanUpServer.bind(null, eventType));
});

main();
