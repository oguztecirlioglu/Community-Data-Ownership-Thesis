const express = require("express");
require("./jsDocTypes");
const utils = require("./utils");
const ipfsUtils = require("./ipfsUtils");
const crypto = require("crypto");
const { default: axios } = require("axios");

const app = express();
app.use(express.json());

const UPDATE_POLL_FREQUENCY = utils.envOrDefault("LOCAL_GATEWAY_UPDATE_POLL_FREQUENCY", 10);
const PORT = utils.envOrDefault("LOCAL_GATEWAY_PORT", 7500);
const JSON_PATH = utils.envOrDefault("LOCAL_GATEWAY_JSON_PATH", "./localStorage.json");
const IPFS_API_PORT = utils.envOrDefault("IPFS_API_PORT", 5001);
const IPFS_HTTP_GATEWAY_PORT = utils.envOrDefault("IPFS_HTTP_GATEWAY_PORT", 8080);
const IPFSCLUSTER_API_PORT = utils.envOrDefault("IPFSCLUSTER_API_PORT", 9094);

/* 
The previouslySavedData is only to be saved when the app closes or crashes. Once it's loaded, we only use the in memory object.
Check if any of the keys have values older than today. If so, upload that entire key-value pair to IPFS and delete it from the object.
If Object is from today, save it to dailyStorage in memory JavaScript object.
This relies on the assumption that the key-value pair doesn't have any data from today if the oldest data it has is from a previous day, because on every new day the code automatically uploads the data and purges old records.

To prevent duplicating data, delete current saved file so that if an unhandleable crash occurs the same data isn't uploaded twice. 
*/

const previouslySavedData = utils.loadFileAsObject(JSON_PATH);
const { keep: dataToKeep, upload: dataToUpload } = utils.filterData(previouslySavedData);
const dailyStorage = dataToKeep;

utils.deleteFile(JSON_PATH);

(async () => {
  for (const [key, value] of Object.entries(dataToUpload)) {
    const dataDate = value[0]?.time.substring(0, 10);
    const deviceName = key;

    const dataEntry = {
      device_name: deviceName,
      date: dataDate,
      data: value,
    };

    const { status, cid } = await ipfsUtils.uploadToIPFS(
      dataEntry,
      IPFSCLUSTER_API_PORT,
      IPFS_HTTP_GATEWAY_PORT
    );

    if (status === 0) {
      console.log(`Data successfully uploaded to IPFS, CID is: ${cid}`);
    } else if (status !== 0) {
      console.log(`Error uploading data to IPFS, error is:${cid}`);
    }
  }
})();

async function dataUploadLifecycle(dailyStorage) {
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

    const { status, cid } = await ipfsUtils.uploadToIPFS(
      dataEntry,
      IPFSCLUSTER_API_PORT,
      IPFS_HTTP_GATEWAY_PORT
    );

    if (status === 0) {
      console.log(`Data successfully uploaded to IPFS for device ${deviceName}, CID is: ${cid}`);
    } else if (status !== 0) {
      console.log(`Error uploading data to IPFS, error is:${cid}`);
    }

    delete dailyStorage[key];

    // upload cid to hf as org asset.
  }
}

// NodeJS equivalent of creating a "main" method.
if (require.main == module) {
  const poller = setInterval(() => dataUploadLifecycle(dailyStorage), UPDATE_POLL_FREQUENCY * 1000);

  app.post("/api/dataInput", (req, res) => {
    let { status_code, message } = utils.processDataInput(req.body, dailyStorage);

    if (status_code != 0)
      return res.status(406).send("Error comitting IoT Data, error is:" + message);

    res.status(200).send("Data submitted successfully");
  });

  // test path with hardcoded values.
  app.get("/api/getCID", async (req, res) => {
    const encryptionKey = "FOPoVJhUUf17kxTT0D2gDB9pxZWCS3K/1FY7YqfKtjA=";
    const cid = "QmWAE9oFbKofDEjeYdoEjk5TCzpu7cPUzdzAaLahq38RB8";

    const response = await axios.get(`http://localhost:8080/ipfs/${cid}`);
    const ciphertext = response.data;
    console.log(ciphertext);
    const decipher = crypto.createDecipheriv(
      "aes-256-ecb",
      Buffer.from(encryptionKey, "base64"),
      null
    );
    let plaintext = decipher.update(ciphertext, "base64", "utf8");
    plaintext += decipher.final("utf8");

    res.status(200).send(JSON.parse(plaintext));
  });

  app.listen(PORT, () => {
    console.log(`Local Gateway running on ${PORT}`);
    console.log(`Local Gateway configuration variables are: \nPORT=${PORT}`);
  });
}

function cleanUpServer(eventType) {
  console.log(
    `${eventType} Message received. Closing application, saving aggregated IoT data to ${process.env.PWD}/${JSON_PATH}`
  );
  utils.locallyStoreJSON(dailyStorage, JSON_PATH);
  process.exit();
}

// Handle all crashes that we can, to persist data in local storage.
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, cleanUpServer.bind(null, eventType));
});
