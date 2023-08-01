import React, { useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import {
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Toolbar,
  Tooltip,
} from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const MyHeaderComponent = (props: any) => {
  return <div>{`${props?.displayName} (${props?.unit})`}</div>;
};

const defaultColDefs: ColDef = {
  filter: "agNumberColumnFilter",
  floatingFilter: true,
  sortable: true,
  flex: 1,
  resizable: true,
};

function App() {
  const [allOrgAsset, setAllOrgAsset] = React.useState(null);
  const [myOrgAsset, setMyOrgAsset] = React.useState(null);
  const [assetData, setAssetData] = React.useState<null | { data: any }>(null);
  const [tableRows, setTableRows] = React.useState<null | any>([]);
  const [myOrgName, setMyOrgName] = React.useState<null | string>("Loading org...");
  const gridRef = React.useRef<any>();

  const fetchData = async (endpoint: string, setter: Function) => {
    try {
      const getRequest = await fetch(endpoint); // Replace with your actual API endpoint
      if (!getRequest.ok) {
        throw new Error("Unable to fetch data for all orgs.");
      }
      const jsonData = await getRequest.json();
      setter(jsonData);
    } catch (error) {}
  };

  const fetchAssetData = async (assetID: string) => {
    const endpoint = "http://localhost:7500/fabric/getAssetData/" + assetID;
    await fetchData(endpoint, setAssetData);
  };

  function AssetContainer(props: { title: string; data: any; variant?: string }) {
    return (
      <Card variant="outlined" sx={{ backgroundColor: theme.palette.primary.light }}>
        <CardContent>
          <Typography variant="h4">{props.title}</Typography>
          {Array.isArray(props.data)
            ? props.data.map((assetObject) => renderAssetObject(assetObject, props.variant))
            : "No data loaded yet"}
        </CardContent>
      </Card>
    );
  }

  function AssetDataContainer(props: { title: string; data: any }) {
    return (
      <Card variant="outlined" sx={{ backgroundColor: theme.palette.primary.light }}>
        <CardContent>
          <Typography variant="h4">{props.title}</Typography>
          {props.data ? renderAssetDataObject(props.data) : ""}
        </CardContent>
      </Card>
    );
  }

  const renderAssetDataObject = (assetDataObject: any) => {
    return (
      <Card>
        <CardContent>
          <List>
            <ListItem>
              <ListItemText primary="Device Name" secondary={assetDataObject?.device_name} />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Date" secondary={assetDataObject?.date} />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Data" secondary={<DataTable />} />
            </ListItem>
            <Divider />
          </List>
        </CardContent>
      </Card>
    );
  };

  const columnDefs: any = React.useMemo(() => {
    if (!assetData) return null;
    const firstDataEntry: any = Object.entries(assetData?.data[0]);

    let result = [];
    for (const [key, value] of firstDataEntry) {
      if (key === "time") result.push({ field: key, headerName: "Measurement Time" });
      else if (key === "pm_2_5")
        result.push({
          field: key,
          headerName: "PM 2.5",
          headerComponent: MyHeaderComponent,
          headerComponentParams: { unit: value?.unit },
        });
      else {
        result.push({
          field: key,
          headerName: key.replace(/_/g, " ").toUpperCase(),
          headerComponent: MyHeaderComponent,
          headerComponentParams: { unit: value?.unit },
        });
      }
    }
    return result;
  }, [assetData]);

  const renderAssetObject = (assetObject: any, variant: string | undefined) => {
    return (
      <Card sx={{ m: 2 }}>
        <CardContent>
          <List>
            <ListItem>
              <ListItemText primary="Asset Name" secondary={assetObject?.assetName}></ListItemText>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Date" secondary={assetObject?.date}></ListItemText>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="IPFS CID"
                secondary={assetObject?.IPFS_CID}
                secondaryTypographyProps={{
                  component: "div",
                  sx: {
                    overflowX: "auto",
                    whiteSpace: "nowrap",
                  },
                }}
              ></ListItemText>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Uploading Org"
                secondary={assetObject?.uploadingOrg}
              ></ListItemText>
            </ListItem>
            <Divider />
          </List>
          {variant === "myorg" ? (
            <Tooltip
              title={`View actual data for ${assetObject?.assetName} at the IPFS address: ${assetObject?.IPFS_CID}`}
            >
              <Button
                variant="contained"
                style={{ textTransform: "none" }}
                onClick={() => fetchAssetData(`${assetObject?.assetName}_${assetObject?.date}`)}
              >
                Decrypt and View Data
              </Button>
            </Tooltip>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  const DataTable = () => {
    return (
      <div className="ag-theme-alpine" style={{ height: 1000, width: "100%" }}>
        <AgGridReact
          rowData={tableRows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDefs}
          ref={gridRef}
          suppressColumnVirtualisation={true}
          onRowDataUpdated={(event) => {
            event.columnApi.autoSizeAllColumns();
          }}
        />
      </div>
    );
  };

  useEffect(() => {
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

  useEffect(() => {
    const endpoint = "http://localhost:7500/fabric/getAllAssets";
    fetchData(endpoint, setAllOrgAsset);
    const intervalInSeconds = 60;
    const interval = setInterval(
      fetchData.bind(null, endpoint, setAllOrgAsset),
      intervalInSeconds * 1000
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const endpoint = "http://localhost:7500/fabric/getAllAssets";
    fetchData(endpoint, setMyOrgAsset);
    const intervalInSeconds = 60;
    const interval = setInterval(
      fetchData.bind(null, endpoint, setMyOrgAsset),
      intervalInSeconds * 1000
    );
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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

  // Define a custom theme with the desired background color
  const theme = createTheme({
    palette: {
      primary: {
        main: "#303134",
        light: "#c2c3cc",
      },
      background: {
        default: "#444654",
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              Community Data Viewer
            </Typography>
            <Typography variant="h5">{`User belongs to: ${myOrgName}`}</Typography>
          </Toolbar>
        </AppBar>
        <Grid container spacing={2}>
          <Grid item md={3} xs={12}>
            <AssetContainer title="All Orgs Assets" data={allOrgAsset}></AssetContainer>
          </Grid>
          <Grid item md={3} xs={12}>
            <AssetContainer
              title="My Orgs Assets"
              data={myOrgAsset}
              variant="myorg"
            ></AssetContainer>
          </Grid>
          <Grid item md={6} xs={12}>
            <AssetDataContainer title="View Asset Data" data={assetData}></AssetDataContainer>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}

export default App;
