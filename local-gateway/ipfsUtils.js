require("./jsDocTypes");

/**
 *
 * @param {Aggregated_IoT_Data} dataToUpload
 */
function uploadToIPFS(dataToUpload) {
  for (const [key, value] of Object.entries(dataToUpload)) {
    console.log(`\n\nUploading data for IoT Device ${key}`);
    console.log(`Compress data`);
    console.log(
      `Encrpyt data so that this organisation can see it, and may also allow others to see it.`
    );

    const dataHash = Math.random().toString(36).substr(2, 5);
    console.log(`Uploaded Data to IPFS, hash is: ${dataHash}`);

    console.log(`Commit transaction to HF network with ${dataHash} as Asset of Org.`);
  }
}

const ipfsUtils = { uploadToIPFS };

module.exports = ipfsUtils;
