const axios = require("axios");
const crypto = require("crypto");
const zlib = require("zlib");

require("./jsDocTypes");

/**
 *
 * @param {Aggregated_IoT_Data} dataToUpload
 * @param {String} ipfsClusterApiPort
 * @returns {{status: Number, cid: string, symmetricKey: Buffer}}
 */
async function uploadToIPFS(dataToUpload, ipfsClusterApiPort) {
  // ipfs-cluster-ctl pin add --wait ... waits until the IPFS-pinning process is complete in at least 1 peer.
  // --replication-min , max flag in ipfs-cluster-ctl
  if (Object.keys(dataToUpload).length !== 3)
    return { status: 3, cid: "Data passed to function is malformed!", symmetricKey: null };

  console.log(`\n\nUploading data for IoT Device ${Object.values(dataToUpload)[0]}`);

  const symmetricKey = generateSymmetricKey();
  const compressedData = zlib.deflateSync(JSON.stringify(dataToUpload)).toString("base64");
  const cipherText = encryptPlainText(compressedData, symmetricKey);

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
    cid = "error";
    return { status: 1, cid: error.message, symmetricKey: null };
  }

  if (cid != "error") {
    // Success
    return { status: 0, cid: cid, symmetricKey: symmetricKey };
  } else {
    return {
      status: 2,
      cid: "Uncaught error ocurred uploading data to IPFS and IPFS Cluster.",
      symmetricKey: null,
    };
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
 * @returns {String} plainText
 */
function decryptToPlainText(ciphertext, key) {
  const decipher = crypto.createDecipheriv("aes-256-ecb", key, null);

  let plaintext = decipher.update(ciphertext, "base64", "utf8");
  plaintext += decipher.final("utf8");

  return plaintext;
}

const ipfsUtils = { uploadToIPFS, decryptToPlainText };

module.exports = ipfsUtils;
