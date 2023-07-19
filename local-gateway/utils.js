const fs = require("fs");

/** Define JSON @typedef {string} JSON */

/**
 * Processes the JSON object recieved in exposed POST endpoint.
 * @param {JSON} data The new IoT data that just got pushed to the local gateway server.
 * @param {Object} dailyStorage JavaScript Object that is used to aggregate daily data of the various IoT devices on the local network.
 * @returns {Object} Object with status_code, and message, indicating the status of the processing, a message if an error occurred.
 */
function processDataInput(data, dailyStorage) {
  // get name of iot device from field in data
  // strip name field from the data json as it is superflous and will use extra storage
  // check if this device has data for the day, if so, append the new data to the array
  // if not, create new key value pair where key is name of the iot device, and the value will be an array of size 1 with the data.
  // return an object with the status_code (0 for success, != 0 for fail), message ("Success" for 0, <reason> for != 0), and a newDailyStorage object where the processed data is appended.

  // Check for errors in JSON.
  for (const [key, value] of Object.entries(data)) {
    if (value == null)
      return {
        status_code: 1,
        message: `ERROR: Missing value for key:${key}, returning original dailyStorage object.`,
        newDailyStorage: data,
      };
  }

  const nameOfDevice = data?.deviceName;

  delete data.deviceName; // Delete deviceName field as we don't want to commit this to daily data, it is superflous & would take up storage.

  if (nameOfDevice in dailyStorage && Array.isArray(dailyStorage[nameOfDevice])) {
    dailyStorage[nameOfDevice].push(data);
  } else {
    dailyStorage[nameOfDevice] = [data];
  }

  return { status_code: 0, message: "Data processed succesfully" };
}

function envOrDefault(KEY, defaultValue) {
  return process.env?.[KEY] || defaultValue;
}

/**
 * Stores a JavaScript Object, jsonData, to the local filesystem by converting it to "Stringified" JSON, saving it at the path designated by fileName.
 * @param {Object} jsonData The JavaScript object that you want to save to the local file system.
 * @param {String} fileName Path and/or filename to save the stringifed JSON to the file system with.
 */
function locallyStoreJSON(jsonData, fileName) {
  let dailyDataString = JSON.stringify(jsonData);

  fs.writeFileSync(fileName, dailyDataString);
}

function loadFileAsObject(fileName) {
    fs.readFileSync(fileName)
}

const utils = {
  processDataInput,
  envOrDefault,
  locallyStoreJSON,
};

module.exports = utils;
