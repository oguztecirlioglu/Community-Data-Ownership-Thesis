const axios = require("axios");
const express = require("express");
const utils = require("./utils");

/** @global */
const API_ENDPOINT = utils.envOrDefault("VIRTUAL_DEVICE_API_ENDPOINT", "/api/dataInput");

/** @global */
const API_PORT = utils.envOrDefault("LOCAL_GATEWAY_PORT", 7500);

/** @global */
const INTERVAL_SECONDS = utils.envOrDefault("VIRTUAL_DEVICE_INTERVAL_SECONDS", 5);

/** @global */
const PORT = utils.envOrDefault("VIRTUAL_DEVICE_PORT", 3000);

/** @global */
const RANDOMNESS_AMOUNT = utils.envOrDefault("VIRTUAL_DEVICE_RANDOMNESS_AMOUNT", 0);

/** @global */
const DEVICE_NAME = utils.envOrDefault(
  "VIRTUAL_DEVICE_NAME",
  `Virtual_IoT_Device_${Math.floor(Math.random() * 9000) + 1000}` // Generate random 4 digit number to be reasonably sure the name is unique if we don't provide it in the config.
);

let lastJSONArray = [];

const app = express();
app.use(express.json());

/**
 * Async method that sends randomly generated data to the API endpoint which was configured by reading environment variables.
 */
async function sendData() {
  const data = utils.generateRandomData(RANDOMNESS_AMOUNT, DEVICE_NAME);

  try {
    await axios.post(API_ENDPOINT, data, {
      baseURL: `http://localhost:${API_PORT}`,
    });
    // console.log("Data sent:", data);
  } catch (error) {
    console.error("Error sending data:", error);
  }
}

// NodeJS equivalent of creating a "main" method.
if (require.main === module) {
  setInterval(sendData, INTERVAL_SECONDS * 1000);

  // Created for testing purposes, the virtual device makes a http post request to itself
  // which gets appended to an array.
  app.post(API_ENDPOINT, (req, res) => {
    lastJSONArray.push(req.body);
    res.status(200).send("Data recieved succesfully");
  });

  app.get("/api/allData", (req, res) => {
    res.send(lastJSONArray);
  });

  app.listen(PORT, () => {
    console.log(`Virtual IoT Device running on port ${PORT}`);
    console.log(
      `Virtual IoT Device configuration variables are: \nAPI_ENDPOINT=${API_ENDPOINT}, INTERVAL_SECONDS=${INTERVAL_SECONDS}, PORT=${PORT}, RANDOMNESS_AMOUNT=${RANDOMNESS_AMOUNT}, DEVICE_NAME=${DEVICE_NAME}`
    );
  });
}
