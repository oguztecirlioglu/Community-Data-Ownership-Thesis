import React, { useEffect } from "react";
import "./App.css";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Card, CardContent, Grid, Toolbar } from "@mui/material";

function App() {
  const [allOrgAsset, setAllOrgAsset] = React.useState(null);
  const [myOrgAsset, setMyOrgAsset] = React.useState(null);

  const fetchData = async (endpoint: string, setter: Function) => {
    try {
      const getRequest = await fetch(endpoint); // Replace with your actual API endpoint
      if (!getRequest.ok) {
        throw new Error("Unable to fetch data for all orgs.");
      }
      const jsonData = await getRequest.json();
      setter(jsonData);
      console.log(jsonData);
    } catch (error) {}
  };

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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
            Community Data Viewer
          </Typography>
          <Typography variant="h5">User is member of: INPUT ORG NAME HERE</Typography>
        </Toolbar>
      </AppBar>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <AssetContainer title="All Orgs Assets" data={allOrgAsset}></AssetContainer>
        </Grid>
        <Grid item xs={4}>
          <AssetContainer title="My Orgs Assets" data={myOrgAsset}></AssetContainer>
        </Grid>
        <Grid item xs={4}>
          <AssetContainer title="View Asset Data" data={null}></AssetContainer>
        </Grid>
      </Grid>
    </Box>
  );
}

function AssetContainer(props: { title: string; data: any }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h4">{props.title}</Typography>
        {Array.isArray(props.data) ? props.data.map(renderAssetObject) : "No data loaded yet"}
      </CardContent>
    </Card>
  );
}

function renderAssetObject(assetObject: any) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ overflowX: "auto" }}>
          <Typography variant="h6">{assetObject?.assetName}</Typography>
          <Typography>{assetObject?.date}</Typography>
          <Typography>{assetObject?.IPFS_CID}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default App;
