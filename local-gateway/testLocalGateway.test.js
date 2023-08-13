const fs = require("fs");
const path = require("path");

const {
  filterData,
  envOrDefault,
  locallyStoreJSON,
  loadFileAsObject,
  deleteFile,
} = require("./utils");
const {
  mockLocalStorage,
  mockDataToKeep,
  mockDataToUpload,
  mockDataEntry,
} = require("./mocks/_mocks");

const {
  gatewayAPI,
  getAllDataAssets,
  getMyOrgsDataAssets,
  getOtherOrgsDataAssets,
  getAssetByID,
  getBidsForMyOrg,
  bidForData,
  acceptBid,
  getDataBidDetails,
  uploadDataAsAsset,
  uploadKeyPrivateData,
  getKeyPrivateData,
  transferEncKey,
} = require("./fabricGatewayClient");

const { uploadToIPFS } = require("./ipfsUtils");
const { rest } = require("msw");
const { setupServer } = require("msw/node");

const IPFSCLUSTER_API_PORT = "7094";

const server = setupServer(
  // For uploadToIPFS test
  rest.post(`http://localhost:${IPFSCLUSTER_API_PORT}/add`, (req, res, ctx) => {
    const mockResponse = {
      cid: "1000",
    };
    return res(ctx.status(200), ctx.json(mockResponse));
  })
);

// Start the mock server before running tests
beforeAll(() => server.listen());

// Clean up the mock server after tests
afterAll(() => server.close());

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  unlink: jest.fn(),
}));

describe("filterData, a utility function, works", () => {
  it("splits data into two streams, to keep and not to keep, correctly", () => {
    const { keep, upload } = filterData(mockLocalStorage);
    expect(keep).toEqual(mockDataToKeep);
    expect(upload).toEqual(mockDataToUpload);
  });
});

describe("uploadToIpfs works well", () => {
  it("runs", async () => {
    for (const [key, value] of Object.entries(mockDataEntry)) {
      const dataDate = value[0]?.time.substring(0, 10);
      const deviceName = key;

      const dataEntry = {
        device_name: deviceName,
        date: dataDate,
        data: value,
      };

      const { status, cid, symmetricKey } = await uploadToIPFS(dataEntry, IPFSCLUSTER_API_PORT);
      expect(cid).toEqual("1000");
      expect(status).toEqual(0);
    }
  });
});

// Same function used in virtualDevice.js, so use the same tests.
describe("envOrDefault works well", () => {
  it("returns the value from process.env when available", () => {
    const mockEnv = { SOME_KEY: "mocked-value" };
    const originalEnv = process.env;
    process.env = { ...mockEnv };
    const result = envOrDefault("SOME_KEY", "default-value");
    process.env = originalEnv;
    expect(result).toBe("mocked-value");
  });

  it("returns the default value when process.env is not available", () => {
    const originalEnv = process.env;
    process.env = undefined;
    const result = envOrDefault("SOME_KEY", "default-value");
    process.env = originalEnv;
    expect(result).toBe("default-value");
  });
});

describe("deleteFile, locallyStoreJSON and loadFileAsObject", () => {
  beforeEach(() => {
    fs.writeFileSync.mockClear();
    fs.readFileSync.mockClear();
  });

  it("should store JSON data", async () => {
    const jsonData = { key: "value" };
    const fileName = "test.json";
    const filePath = path.join(__dirname, fileName);

    await locallyStoreJSON(jsonData, fileName);

    expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, JSON.stringify(jsonData));
  });

  it("should load JSON data from file", async () => {
    const jsonData = { key: "value" };
    const fileName = "test.json";
    const filePath = path.join(__dirname, fileName);

    fs.readFileSync.mockResolvedValue(JSON.stringify(jsonData));

    await loadFileAsObject(fileName);

    expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
  });

  it("should handle errors when loading file", async () => {
    const fileName = "nonexistent.json";

    fs.readFileSync.mockImplementation(() => {
      throw new Error("File not found");
    });

    const loadedData = await loadFileAsObject(fileName);

    expect(loadedData).toEqual({});
  });

  it("it should delete files as expected", async () => {
    const fileName = "test.json";
    await deleteFile(fileName);
    expect(fs.unlink).toHaveBeenCalledTimes(1);
  });
});
