import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppRoot from "./AppRoot";
import BidsMenu from "./BidsPage";
import ErrorPage from "./ErrorPage";
import React from "react";
import DataPage from "./DataPage";

export default function AppCopy() {
  const [myOrgName, setMyOrgName] = React.useState<null | string>("Loading org...");
  const [bidsForMyOrg, setBidsForMyOrg] = React.useState<null | any>(null);
  const [assetData, setAssetData] = React.useState<null | { data: any }>(null);
  const [tableRows, setTableRows] = React.useState<null | any>([]);
  const [otherOrgsAssets, setOtherOrgsAssets] = React.useState(null);
  const [myOrgsAssets, setMyOrgsAssets] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const endpoint = "http://localhost:7500/fabric/getMyOrg";
        const getRequest: any = await fetch(endpoint); // Replace with your actual API endpoint
        if (!getRequest.ok) throw new Error("Unable to fetch data for all orgs.");
        const json = await getRequest.json();
        setMyOrgName(json.mspid);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    })();
  }, []);

  React.useEffect(() => {
    const endpoint = "http://localhost:7500/fabric/getBidsForMyOrg";
    fetchData(endpoint, setBidsForMyOrg);
    const intervalInSeconds = 60;
    const interval = setInterval(
      fetchData.bind(null, endpoint, setBidsForMyOrg),
      intervalInSeconds * 1000
    );

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const endpoint = "http://localhost:7500/fabric/getOtherOrgsDataAssets";
    fetchData(endpoint, setOtherOrgsAssets);
    const intervalInSeconds = 60;
    const interval = setInterval(
      fetchData.bind(null, endpoint, setOtherOrgsAssets),
      intervalInSeconds * 1000
    );

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const endpoint = "http://localhost:7500/fabric/getMyOrgsDataAssets";
    fetchData(endpoint, setMyOrgsAssets);
    const intervalInSeconds = 60;
    const interval = setInterval(
      fetchData.bind(null, endpoint, setMyOrgsAssets),
      intervalInSeconds * 1000
    );
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const parsedAssetData = assetData?.data
      ? assetData.data.map((e: any) => {
          const obj = Object.entries(e);
          let field: any = {};
          for (const [key, value] of obj) {
            if (key === "time") {
              field[key] = value;
            } else {
              field[key] = (value as { amount: number }).amount;
            }
          }
          return field;
        })
      : [];
    setTableRows(parsedAssetData);
  }, [assetData]);

  const fetchAssetData = async (assetID: string) => {
    const endpoint = "http://localhost:7500/fabric/getAssetData/" + assetID;
    await fetchData(endpoint, setAssetData);
  };

  const router = createRouter(
    myOrgName,
    tableRows,
    myOrgsAssets,
    otherOrgsAssets,
    assetData,
    fetchAssetData,
    bidsForMyOrg
  );

  return <RouterProvider router={router} />;
}

export const fetchData = async (endpoint: string, setter: Function) => {
  try {
    const getRequest = await fetch(endpoint);
    if (!getRequest.ok) {
      throw new Error("Unable to fetch data");
    }
    const jsonData = await getRequest.json();
    setter(jsonData);
    return jsonData;
  } catch (error) {
    console.error(error);
  }
};

export const createRouter = (
  myOrgName: string | null,
  tableRows: any,
  myOrgsAssets: any,
  otherOrgsAssets: any,
  assetData: null | { data: any },
  fetchAssetDataFunc: (endpoint: string, setter: Function) => Promise<any>,
  bidsForMyOrg: any
) => {
  return createBrowserRouter([
    {
      path: "/",
      element: <AppRoot myOrgName={myOrgName} />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "",
          element: (
            <DataPage
              myOrgName={myOrgName}
              tableRows={tableRows}
              myOrgAssets={myOrgsAssets}
              otherOrgsAssets={otherOrgsAssets}
              assetData={assetData}
              fetchAssetData={fetchAssetDataFunc}
            />
          ),
        },
        {
          path: "bidsMenu",
          element: <BidsMenu bidsForMyOrg={bidsForMyOrg} />,
        },
      ],
    },
  ]);
};
