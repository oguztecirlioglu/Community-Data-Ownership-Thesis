const express = require("express");
require("./jsDocTypes");
const utils = require("./utils");
const ipfsUtils = require("./ipfsUtils");

const app = express();
app.use(express.json());

/** @global */
const PORT = utils.envOrDefault("LOCAL_GATEWAY_PORT", 7500);
const JSON_PATH = utils.envOrDefault("LOCAL_GATEWAY_JSON_PATH", "./localStorage.json");

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

ipfsUtils.uploadToIPFS(dataToUpload);
//call method to upload remaining data here.

// NodeJS equivalent of creating a "main" method.
if (require.main == module) {
  app.post("/api/dataInput", (req, res) => {
    let { status_code, message } = utils.processDataInput(req.body, dailyStorage);

    if (status_code != 0) res.status(406).send("Error comitting IoT Data, error is:" + message);

    res.status(200).send("Data submitted successfully");
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
