const axios = require("axios");
const express = require("express");
const utils = require("./utils");

const apiEndpoint = utils.envOrDefault(
  "VIRTUAL_DEVICE_API_ENDPOINT",
  "/api/post"
); // Replace with your API endpoint URL
const intervalSeconds = utils.envOrDefault(
  "VIRTUAL_DEVICE_INTERVAL_SECONDS",
  10
); // Adjust the interval as per your requirements
const port = utils.envOrDefault("VIRTUAL_DEVICE_PORT", 3000);
const app = express();
app.use(express.json());
let lastJSONArray = [];

async function sendData() {
  const data = utils.generateRandomData();

  try {
    await axios.post(apiEndpoint, data, {
      baseURL: `http://localhost:${port}`, // Dynamically determine the base URL using req.protocol, req.hostname, and port
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
