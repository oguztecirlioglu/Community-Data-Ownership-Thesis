const axios = require("axios");
const express = require("express");
const utils = require("./utils");

/** @global */
const apiEndpoint = utils.envOrDefault("VIRTUAL_DEVICE_API_ENDPOINT", "/api/post");

/** @global */
const intervalSeconds = utils.envOrDefault("VIRTUAL_DEVICE_INTERVAL_SECONDS", 10);

/** @global */
const port = utils.envOrDefault("VIRTUAL_DEVICE_PORT", 3000);

/** @global */
const randomnessAmount = utils.envOrDefault("VIRTUAL_DEVICE_RANDOMNESS_AMOUNT", 0);

let lastJSONArray = [];

const app = express();
app.use(express.json());

/**
 * Async method that sends randomly generated data to the API endpoint which was configured by reading environment variables.
 */
async function sendData() {
  const data = utils.generateRandomData(randomnessAmount);

  try {
    await axios.post(apiEndpoint, data, {
      baseURL: `http://localhost:${port}`,
    });
    console.log("Data sent:", data);
  } catch (error) {
    console.error("Error sending data:", error);
  }
}

setInterval(sendData, intervalSeconds * 250);

// Created for testing purposes, the virtual device makes a http post request to itself
// which gets appended to an array.
app.post(apiEndpoint, (req, res) => {
  lastJSONArray.push(req.body);
  res.status(200).send("Data recieved succesfully");
});

app.get("/api/allData", (req, res) => {
  res.send(lastJSONArray);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
