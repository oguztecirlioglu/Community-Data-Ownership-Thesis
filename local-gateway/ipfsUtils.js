const axios = require("axios");
const fs = require("fs");
require("./jsDocTypes");

/**
 *
 * @param {Aggregated_IoT_Data} dataToUpload
 */
async function uploadToIPFS(dataToUpload, ipfsClusterApiPort, ipfsGatewayPort) {
  // ipfs-cluster-ctl pin add --wait ... waits until the IPFS-pinning process is complete in at least 1 peer.
  // --replication-min , max flag in ipfs-cluster-ctl
  if (Object.keys(dataToUpload).length !== 3)
    return { status: 3, cid: "Data passed to function is malformed!" };

  console.log(`\n\nUploading data for IoT Device ${Object.keys(dataToUpload)[0]}`);

  console.log(`Compress data`);
  console.log(
    `Encrpyt data so that this organisation can see it, and may also allow others to see it.`
  );

  const data = new FormData();
  data.append("json", JSON.stringify(dataToUpload));

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
    return { status: 0, cid: cid };
  } else {
    return { status: 2, cid: "Uncaught error ocurred uploading data to IPFS and IPFS Cluster." };
  }
}

const ipfsUtils = { uploadToIPFS };

module.exports = ipfsUtils;
