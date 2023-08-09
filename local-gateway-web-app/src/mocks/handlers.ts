import { rest } from "msw";

export const mockData = {
  device_name: "Virtual_IoT_Device_1070",
  date: "2023-07-31",
  data: [
    {
      time: "2023-07-31T10:59:39.851Z",
      temperature: { unit: "celsius", amount: 20.607658194041562 },
      relative_humidity: { unit: "percentage", amount: 29.65570867618714 },
      pm_2_5: { unit: "µg/m3", amount: 8.385062153779224 },
      pm_10: { unit: "µg/m3", amount: 12.923776505592137 },
      tvoc: { unit: "µg/m3", amount: 289.9246219044567 },
      ozone: { unit: "µg/m3", amount: 88.82764969466277 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 7.687560295299703 },
      sulfur_dioxide: { unit: "µg/m3", amount: 33.7490557308706 },
      carbon_monoxide: { unit: "µg/m3", amount: 29.092476024350407 },
    },
    {
      time: "2023-08-01T10:59:40.852Z",
      temperature: { unit: "celsius", amount: 19.38414648840969 },
      relative_humidity: { unit: "percentage", amount: 30.1301949742116 },
      pm_2_5: { unit: "µg/m3", amount: 8.196892072712458 },
      pm_10: { unit: "µg/m3", amount: 13.624938351088257 },
      tvoc: { unit: "µg/m3", amount: 301.28058218681645 },
      ozone: { unit: "µg/m3", amount: 93.48012433120452 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.334602634043176 },
      sulfur_dioxide: { unit: "µg/m3", amount: 36.22713414981652 },
      carbon_monoxide: { unit: "µg/m3", amount: 29.649423950505014 },
    },
    {
      time: "2023-08-01T10:59:41.853Z",
      temperature: { unit: "celsius", amount: 19.03782647756136 },
      relative_humidity: { unit: "percentage", amount: 29.141778700059792 },
      pm_2_5: { unit: "µg/m3", amount: 7.802109284222309 },
      pm_10: { unit: "µg/m3", amount: 12.518649499841436 },
      tvoc: { unit: "µg/m3", amount: 280.267223663294 },
      ozone: { unit: "µg/m3", amount: 86.93839481569717 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.130884615747021 },
      sulfur_dioxide: { unit: "µg/m3", amount: 34.10638673549566 },
      carbon_monoxide: { unit: "µg/m3", amount: 28.69787139767703 },
    },
    {
      time: "2023-08-01T10:59:42.853Z",
      temperature: { unit: "celsius", amount: 19.33421898309574 },
      relative_humidity: { unit: "percentage", amount: 28.727093754251463 },
      pm_2_5: { unit: "µg/m3", amount: 7.93831036906521 },
      pm_10: { unit: "µg/m3", amount: 13.289751876160386 },
      tvoc: { unit: "µg/m3", amount: 289.57091083515996 },
      ozone: { unit: "µg/m3", amount: 88.60234445578854 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.262514013066468 },
      sulfur_dioxide: { unit: "µg/m3", amount: 35.98963307555693 },
      carbon_monoxide: { unit: "µg/m3", amount: 29.858984983868943 },
    },
    {
      time: "2023-08-01T10:59:43.855Z",
      temperature: { unit: "celsius", amount: 19.06530706939033 },
      relative_humidity: { unit: "percentage", amount: 30.904132859612183 },
      pm_2_5: { unit: "µg/m3", amount: 8.259470280439215 },
      pm_10: { unit: "µg/m3", amount: 13.255267474106189 },
      tvoc: { unit: "µg/m3", amount: 290.085745280515 },
      ozone: { unit: "µg/m3", amount: 87.55189100634284 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.352151040052945 },
      sulfur_dioxide: { unit: "µg/m3", amount: 34.457684756033295 },
      carbon_monoxide: { unit: "µg/m3", amount: 30.20837517619487 },
    },
    {
      time: "2023-08-01T10:59:44.856Z",
      temperature: { unit: "celsius", amount: 19.856435928503558 },
      relative_humidity: { unit: "percentage", amount: 30.364954014472087 },
      pm_2_5: { unit: "µg/m3", amount: 7.728379808249322 },
      pm_10: { unit: "µg/m3", amount: 12.696429840215705 },
      tvoc: { unit: "µg/m3", amount: 300.06953985640115 },
      ozone: { unit: "µg/m3", amount: 87.4380179698845 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 7.9027606543642985 },
      sulfur_dioxide: { unit: "µg/m3", amount: 34.26948224317291 },
      carbon_monoxide: { unit: "µg/m3", amount: 30.220585484939978 },
    },
    {
      time: "2023-08-01T10:59:45.857Z",
      temperature: { unit: "celsius", amount: 20.80818754359372 },
      relative_humidity: { unit: "percentage", amount: 29.966538918000467 },
      pm_2_5: { unit: "µg/m3", amount: 8.144864006359008 },
      pm_10: { unit: "µg/m3", amount: 13.424742973367243 },
      tvoc: { unit: "µg/m3", amount: 289.1244073687685 },
      ozone: { unit: "µg/m3", amount: 94.08679215554822 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 7.9908070510092974 },
      sulfur_dioxide: { unit: "µg/m3", amount: 35.510046375797984 },
      carbon_monoxide: { unit: "µg/m3", amount: 29.72888649341012 },
    },
    {
      time: "2023-08-01T10:59:46.859Z",
      temperature: { unit: "celsius", amount: 20.85435349896417 },
      relative_humidity: { unit: "percentage", amount: 30.25132852481657 },
      pm_2_5: { unit: "µg/m3", amount: 8.231035584874174 },
      pm_10: { unit: "µg/m3", amount: 13.625382787198344 },
      tvoc: { unit: "µg/m3", amount: 286.2442723800539 },
      ozone: { unit: "µg/m3", amount: 88.12007611023824 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.07751975527533 },
      sulfur_dioxide: { unit: "µg/m3", amount: 34.784654464867465 },
      carbon_monoxide: { unit: "µg/m3", amount: 29.854378082866596 },
    },
    {
      time: "2023-08-01T10:59:47.860Z",
      temperature: { unit: "celsius", amount: 19.78660879192082 },
      relative_humidity: { unit: "percentage", amount: 29.83556821400998 },
      pm_2_5: { unit: "µg/m3", amount: 7.776113431533002 },
      pm_10: { unit: "µg/m3", amount: 13.452298490406355 },
      tvoc: { unit: "µg/m3", amount: 282.87850489272427 },
      ozone: { unit: "µg/m3", amount: 87.30653500830138 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.34140640460039 },
      sulfur_dioxide: { unit: "µg/m3", amount: 35.07527098094096 },
      carbon_monoxide: { unit: "µg/m3", amount: 30.91934275072354 },
    },
    {
      time: "2023-08-01T10:59:48.861Z",
      temperature: { unit: "celsius", amount: 19.827666552747992 },
      relative_humidity: { unit: "percentage", amount: 29.422094074786465 },
      pm_2_5: { unit: "µg/m3", amount: 8.3566811403213 },
      pm_10: { unit: "µg/m3", amount: 13.19233136518146 },
      tvoc: { unit: "µg/m3", amount: 294.1004263900321 },
      ozone: { unit: "µg/m3", amount: 88.16103811434387 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.2154099626196 },
      sulfur_dioxide: { unit: "µg/m3", amount: 33.79725620602443 },
      carbon_monoxide: { unit: "µg/m3", amount: 30.833152117127394 },
    },
    {
      time: "2023-08-01T10:59:49.861Z",
      temperature: { unit: "celsius", amount: 19.064936376471415 },
      relative_humidity: { unit: "percentage", amount: 30.577860650738803 },
      pm_2_5: { unit: "µg/m3", amount: 8.059697548338475 },
      pm_10: { unit: "µg/m3", amount: 12.920371367513146 },
      tvoc: { unit: "µg/m3", amount: 299.800654184309 },
      ozone: { unit: "µg/m3", amount: 88.94601713649239 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.146298132210935 },
      sulfur_dioxide: { unit: "µg/m3", amount: 35.25991807106944 },
      carbon_monoxide: { unit: "µg/m3", amount: 28.66375178867364 },
    },
    {
      time: "2023-08-01T10:59:50.862Z",
      temperature: { unit: "celsius", amount: 20.375854774289593 },
      relative_humidity: { unit: "percentage", amount: 29.64580530878675 },
      pm_2_5: { unit: "µg/m3", amount: 8.348662304238676 },
      pm_10: { unit: "µg/m3", amount: 13.629444575007515 },
      tvoc: { unit: "µg/m3", amount: 297.40369381368066 },
      ozone: { unit: "µg/m3", amount: 87.22534065394407 },
      nitrogen_dioxide: { unit: "µg/m3", amount: 8.280481067872676 },
      sulfur_dioxide: { unit: "µg/m3", amount: 34.44602109435804 },
      carbon_monoxide: { unit: "µg/m3", amount: 30.962796578986687 },
    },
  ],
};

export const mockAllAssets = [
  {
    assetName: "Virtual_IoT_Device_1070",
    date: "2023-07-31",
    IPFS_CID: "QmQC73RJZiSaBxS9WgHF3t2gpG17BuZL9oKuBEHnvzkCy3",
    ownerOrg: "Org1MSP",
  },
  {
    assetName: "Virtual_IoT_Device_3366",
    date: "2023-07-31",
    IPFS_CID: "QmWz3CnPmDNUgXF2QLBoNxTG1aXmbrdovWg3cLKVAcXzr1",
    ownerOrg: "Org1MSP",
  },
  {
    assetName: "Virtual_IoT_Device_3986",
    date: "2023-07-31",
    IPFS_CID: "Qmdn6usfZjhbVqom6rQwDYqnAKWgKuEZxhkyZnXE9JnnMg",
    ownerOrg: "Org1MSP",
  },
  {
    assetName: "Virtual_IoT_Device_4133",
    date: "2023-07-31",
    IPFS_CID: "QmYJkeU8oGw6fFGTYgGEeCMWo4hE8DRyijKs56whqCzcVw",
    ownerOrg: "Org1MSP",
  },
  {
    assetName: "Virtual_IoT_Device_5121",
    date: "2023-07-31",
    IPFS_CID: "QmP8QxNSQqWdMrJ37c7uzvqhAUDTQYgLUwoXZs5hRhHj3D",
    ownerOrg: "Org1MSP",
  },
  {
    assetName: "Virtual_IoT_Device_5440",
    date: "2023-07-31",
    IPFS_CID: "QmQeuMuG2MfSp676vRf6y5jU4Qy8YTFMX5DzD9L699Q6PD",
    ownerOrg: "Org1MSP",
  },
  {
    assetName: "Virtual_IoT_Device_5667",
    date: "2023-07-31",
    IPFS_CID: "QmPpKa9g9vWmjGQYCsq1iwhtpLDaLPCr5aVtjaPFKq52wZ",
    ownerOrg: "Org1MSP",
  },
  {
    assetName: "Virtual_IoT_Device_5750",
    date: "2023-07-31",
    IPFS_CID: "QmemTwET9CehZEAx3evpyeQPMVmHidqWBUAznAT1nCwnLt",
    ownerOrg: "Org1MSP",
  },
  {
    assetName: "Virtual_IoT_Device_8099",
    date: "2023-07-31",
    IPFS_CID: "QmUaQ7uPtFrP6ND573fyRQ6GGyYgLJQd4JJx3yB1nvvECH",
    ownerOrg: "Org1MSP",
  },
];

export const mockBid = [
  {
    additionalCommitments: "testCommitments",
    biddingOrg: "Org1MSP",
    currentOwnerOrg: "testOrg",
    deviceName: "Virtual_IoT_Device_1337",
    date: "2023-08-08",
    price: "42",
    active: true,
  },
];

export const mockMyOrgsAssets = [
  {
    assetName: "Virtual_IoT_Device_7941",
    date: "2023-08-08",
    IPFS_CID: "QmTRW4y257tueE95yxwEaMML4fhvE6zbY3UqvvXqx6ETg4",
    ownerOrg: "testOrg",
  },
];

export const mockOtherOrgsAssets = [
  {
    assetName: "Virtual_IoT_Device_8709",
    date: "2023-08-08",
    IPFS_CID: "QmQ2EkvXGFHxCW9G8QFSX3bGzwp9DoTJmKjX6ACcQJdhuP",
    ownerOrg: "Org1MSP",
  },
];

export const handlers = [
  // Define the request handler for the API endpoint
  rest.get("http://localhost:7500/fabric/getAssetData/:id", (req, res, ctx) => {
    // Assuming the :id parameter is the asset ID
    const assetID = req.params.id;

    // You can add more logic here if needed based on the asset ID

    // Return the mock data as the response
    return res(ctx.json(mockData));
  }),
  rest.get("http://localhost:7500/fabric/getAllDataAssets", (req, res, ctx) => {
    // Return the mock data as the response
    return res(ctx.json(mockAllAssets));
  }),
  rest.get("http://localhost:7500/fabric/getAllDataAssets", (req, res, ctx) => {
    // Return the mock data as the response
    return res(ctx.json(mockAllAssets));
  }),

  rest.get("http://localhost:7500/fabric/getMyOrg", (req, res, ctx) => {
    return res(ctx.json({ mspid: "testOrg" }));
  }),

  rest.get("http://localhost:7500/fabric/getBidsForMyOrg", (req, res, ctx) => {
    return res(ctx.json(mockBid));
  }),

  rest.get("http://localhost:7500/fabric/getOtherOrgsDataAssets", (req, res, ctx) => {
    return res(ctx.json(mockOtherOrgsAssets));
  }),

  rest.get("http://localhost:7500/fabric/getMyOrgsDataAssets", (req, res, ctx) => {
    return res(ctx.json(mockMyOrgsAssets));
  }),

  // rest.get("http://localhost:7500/fabric/getAssetData/" + assetID, (req, res, ctx) => {}),
];
