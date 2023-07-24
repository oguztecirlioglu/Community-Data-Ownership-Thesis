const axios = require("axios");
const crypto = require("crypto");
const utils = require("./utils");

require("./jsDocTypes");

/**
 *
 * @param {Aggregated_IoT_Data} dataToUpload
 */
async function uploadToIPFS(dataToUpload, ipfsClusterApiPort) {
  // ipfs-cluster-ctl pin add --wait ... waits until the IPFS-pinning process is complete in at least 1 peer.
  // --replication-min , max flag in ipfs-cluster-ctl
  if (Object.keys(dataToUpload).length !== 3)
    return { status: 3, cid: "Data passed to function is malformed!" };

  console.log(`\n\nUploading data for IoT Device ${Object.keys(dataToUpload)[0]}`);

  console.log(`Compress data`);

  const symmetricKey = generateSymmetricKey();
  const cipherText = encryptPlainText(JSON.stringify(dataToUpload), symmetricKey);
  const assetName = `${dataToUpload?.device_name}_${dataToUpload?.date}`;

  const data = new FormData();
  data.append("json", cipherText);

  try {
    const response = await axios.post(`http://localhost:${ipfsClusterApiPort}/add`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    cid = response?.data?.cid || "error";
  } catch (error) {
    console.error("Error sending image:", error.message);
    cid = "error";
    return { status: 1, cid: error.message };
  }

  if (cid != "error") {
    // All is succesful, save CID, Asset Name, Encryption Key to local machine.
    utils.saveToLocalKeyMap(cid, assetName, symmetricKey);
    return { status: 0, cid: cid };
  } else {
    return { status: 2, cid: "Uncaught error ocurred uploading data to IPFS and IPFS Cluster." };
  }
}

function generateSymmetricKey() {
  const keyLengthInBytes = 32; // 256 bits
  return crypto.randomBytes(keyLengthInBytes);
}

// Could also make these use initialization vectors, decide with Prof.
/**
 *
 * @param {String} plaintext
 * @param {*} key
 * @returns {String} ciphertext
 */
function encryptPlainText(plaintext, key) {
  const cipher = crypto.createCipheriv("aes-256-ecb", key, null);
  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");

  return ciphertext;
}

/**
 *
 * @param {String} ciphertext
 * @param {*} key
 * @returns {Object} plainText
 */
function decryptToPlainText(ciphertext, key) {
  const decipher = crypto.createDecipheriv("aes-256-ecb", key, null);

  let plaintext = decipher.update(ciphertext, "base64", "utf8");
  plaintext += decipher.final("utf8");

  return JSON.parse(plaintext);
}

const ipfsUtils = { uploadToIPFS };

module.exports = ipfsUtils;
