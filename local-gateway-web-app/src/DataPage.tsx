import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  Button,
  Tooltip,
  Box,
  Grid,
} from "@mui/material";
import { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import React from "react";
import BidsMenu from "./BidsPage";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import BidForm from "./BidForm";

export default function DataPage(props: {
  myOrgName: string | null;
  tableRows: any;
  myOrgAssets: any;
  otherOrgsAssets: any;
  fetchAssetData: any;
  assetData: any;
}) {
  const gridRef = React.useRef<any>();
  const [bidFormOpen, setBidFormOpen] = React.useState(false);

  const theme = useTheme();

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

  const renderAssetObject = (assetObject: any, variant: string | undefined) => {
    return (
      <Card sx={{ m: 2 }}>
        <CardContent>
          <List>
            <ListItem>
              <ListItemText
                primary="Asset Name"
                secondary={assetObject?.assetName}
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
                primary="Date"
                secondary={assetObject?.date}
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
                primary="Owner Org"
                secondary={assetObject?.ownerOrg}
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
          </List>
          {variant === "myorg" ? (
            <Tooltip
              title={`View actual data for ${assetObject?.assetName} at the IPFS address: ${assetObject?.IPFS_CID}`}
            >
              <Button
                variant="contained"
                style={{ textTransform: "none" }}
                onClick={() =>
                  props.fetchAssetData(`${assetObject?.assetName}_${assetObject?.date}`)
                }
              >
                Decrypt and View Data
              </Button>
            </Tooltip>
          ) : (
            <Tooltip
              title={`Bid for data: ${assetObject?.assetName} at the IPFS address: ${assetObject?.IPFS_CID}`}
            >
              {bidFormOpen ? (
                <BidForm
                  setBidFormOpenFunc={setBidFormOpen}
                  bidForDataFunc={bidForData}
                  deviceName={assetObject.assetName}
                  date={assetObject.date}
                />
              ) : (
                <Button
                  variant="contained"
                  style={{ textTransform: "none" }}
                  onClick={() => setBidFormOpen(true)}
                >
                  {"Bid For Data?"}
                </Button>
              )}
            </Tooltip>
          )}
        </CardContent>
      </Card>
    );
  };

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
    if (!props.assetData) return null;
    const firstDataEntry: any = Object.entries(props.assetData?.data[0]);

    let result = [];
    for (const [key, value] of firstDataEntry) {
      if (key === "time") result.push({ field: key, headerName: "Measurement Time" });
      else if (key === "pm_2_5")
        result.push({
          field: key,
          headerName: "PM 2.5",
          headerComponent: nameUnitHeaderComponent,
          headerComponentParams: { unit: value?.unit },
        });
      else {
        result.push({
          field: key,
          headerName: key.replace(/_/g, " ").toUpperCase(),
          headerComponent: nameUnitHeaderComponent,
          headerComponentParams: { unit: value?.unit },
        });
      }
    }
    return result;
  }, [props.assetData]);

  const DataTable = () => {
    return (
      <div className="ag-theme-alpine" style={{ height: 1000, width: "100%" }}>
        <AgGridReact
          rowData={props.tableRows}
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

  return (
    <Grid container spacing={2}>
      <Grid item md={3} xs={12}>
        <AssetContainer title="Other Orgs Assets" data={props.otherOrgsAssets}></AssetContainer>
      </Grid>
      <Grid item md={3} xs={12}>
        <AssetContainer
          title="My Orgs Assets"
          data={props.myOrgAssets}
          variant="myorg"
        ></AssetContainer>
      </Grid>
      <Grid item md={6} xs={12}>
        <AssetDataContainer title="View Asset Data" data={props.assetData}></AssetDataContainer>
      </Grid>
    </Grid>
  );
}

const bidForData = async (
  deviceName: string,
  date: string,
  price: string,
  additionalCommitments: string
) => {
  const endpoint = "http://localhost:7500/fabric/bidForData";
  const body = {
    deviceName: deviceName,
    date: date,
    price: price,
    additionalCommitments: additionalCommitments,
  };
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res;
};

const nameUnitHeaderComponent = (props: any) => {
  return <div>{`${props?.displayName} (${props?.unit})`}</div>;
};

const defaultColDefs: ColDef = {
  filter: "agNumberColumnFilter",
  floatingFilter: true,
  sortable: true,
  flex: 1,
  resizable: true,
};
