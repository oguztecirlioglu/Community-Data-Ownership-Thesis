require("./jsDocTypes");
const fs = require("fs");

/**
 * Processes the JSON object recieved in exposed POST endpoint.
 * @param {Object} data The new IoT data that just got pushed to the local gateway server.
 * @param {Aggregated_IoT_Data} dailyStorage JavaScript Object that is used to aggregate daily data of the various IoT devices on the local network.
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
        message: `ERROR: Missing value for key:${key} in the data recieved, returning original dailyStorage object.`,
      };
  }

  //CREATE ERROR FOR NOT FINDING DEVICE NAME
  const nameOfDevice = data?.deviceName;

  delete data.deviceName; // Delete deviceName field as we don't want to commit this to daily data, it is superflous & would take up storage.

  if (nameOfDevice in dailyStorage && Array.isArray(dailyStorage[nameOfDevice])) {
    dailyStorage[nameOfDevice].push(data);
  } else {
    dailyStorage[nameOfDevice] = [data];
  }

  // CREATE CASE WHERE DATA WOULD BE ADDED, BUT IT IS A NEW DAY NOW SO WE NEED TO UPLOAD THE DATA.
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

/**
 *
 * @param {String} fileName
 * @returns {Aggregated_IoT_Data}
 */
function loadFileAsObject(fileName) {
  try {
    const fileContent = fs.readFileSync(fileName);
    const savedData = JSON.parse(fileContent);
    return savedData;
  } catch (err) {
    console.log(
      `Error reading file ${fileName}.\nError is: ${err}\nActing like there is no saved data.`
    );
    return {};
  }
}

/**
 * Deletes file with the given filename.
 * @param {String} fileName Name of file to delete.
 */
function deleteFile(fileName) {
  fs.unlink(fileName, (err) => {
    if (err) {
      console.log(`Error deleting file '${fileName}':`, err.message);
    } else {
      console.log(`File '${fileName}' has been successfully deleted.`);
    }
  });
}

/**
 * Decides whether to keep previous data loaded from filesystem.
 * If the oldest date for ANY IoT device on the stored file is todays date (according to the ISO 8061 date spec), returns True.
 * Otherwise, returns false.
 * @param {Aggregated_IoT_Data} data
 * @returns {Boolean}
 */
function keepPreviousData(data) {
  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      const oldestSavedDate = new Date(val[0]?.time).toISOString().slice(0, 10);
      if (isTodaysDate(oldestSavedDate)) {
        console.log(
          "Found saved file that has a data entry where the oldest date is today, so keeping this file!"
        );
        return true;
      }
    }
  }

  console.log(
    "Saved file found is too old, discarding it and starting from a clean slate for todays data."
  );
  return false;
}

/**
 *
 * @param {Aggregated_IoT_Data} originalSavedData
 * @returns {{keep: Aggregated_IoT_Data, upload: Aggregated_IoT_Data}} filteredData Object with two entries, keep and upload, where keep is the Object to keep and Upload contains the JSON that should be uploaded to IPFS to persist, as it is old data.
 */
function filterData(originalSavedData) {
  const keep = {};
  const upload = {};
  for (const [key, val] of Object.entries(originalSavedData)) {
    if (Array.isArray(val) && isTodaysDate(new Date(val[0]?.time).toISOString().slice(0, 10)))
      keep[key] = val;
    else upload[key] = val;
  }
  return { keep, upload };
}

/**
 * Returns true if the given ISO date is todays date.
 * @param {Date} date
 * @returns {Boolean}
 */
function isTodaysDate(date) {
  const todaysDate = new Date().toISOString().slice(0, 10);
  return date === todaysDate;
}

const utils = {
  processDataInput,
  envOrDefault,
  locallyStoreJSON,
  loadFileAsObject,
  deleteFile,
  keepPreviousData,
  filterData,
};

module.exports = utils;
