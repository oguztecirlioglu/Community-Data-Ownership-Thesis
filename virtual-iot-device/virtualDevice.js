const axios = require("axios");
const utils = require("./utils");

/** @global */
const API_ENDPOINT = utils.envOrDefault("VIRTUAL_DEVICE_API_ENDPOINT", "/api/dataInput");

/** @global */
const API_PORT = utils.envOrDefault("LOCAL_GATEWAY_PORT", 7500);

/** @global */
const INTERVAL_SECONDS = utils.envOrDefault("VIRTUAL_DEVICE_INTERVAL_SECONDS", 5);

/** @global */
const PORT = utils.envOrDefault("VIRTUAL_DEVICE_PORT", 3003);

/** @global */
const RANDOMNESS_AMOUNT = utils.envOrDefault("VIRTUAL_DEVICE_RANDOMNESS_AMOUNT", 0);

/** @global */
const DEVICE_NAME = utils.envOrDefault(
  "VIRTUAL_DEVICE_NAME",
  `Virtual_IoT_Device_${Math.floor(Math.random() * 9000) + 1000}` // Generate random 4 digit number to be reasonably sure the name is unique if we don't provide it in the config.
);

let lastJSONArray = [];

/**
 * Async method that sends randomly generated data to the API endpoint which was configured by reading environment variables.
 */
async function sendData(API_ENDPOINT, API_PORT, data) {
  try {
    const response = await axios.post(API_ENDPOINT, data, {
      baseURL: `http://localhost:${API_PORT}`,
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending data:", error);
    return null;
  }
}

// NodeJS equivalent of creating a "main" method.
if (require.main === module) {
  setInterval(() => {
    const randomData = utils.generateRandomData(RANDOMNESS_AMOUNT, DEVICE_NAME);
    sendData(API_ENDPOINT, API_PORT, randomData);
  }, INTERVAL_SECONDS * 1000);
}

const virtualDevice = { sendData };

module.exports = virtualDevice;
