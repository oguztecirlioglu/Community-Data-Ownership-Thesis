import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Modal,
  Typography,
  TypographyProps,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { error } from "console";
import React from "react";
import { ElementType } from "react";

const bidSecondaryTypographyProps: TypographyProps<
  ElementType<any>,
  { component?: ElementType<any> | undefined }
> = {
  component: "div",
  sx: {
    overflowX: "auto",
    whiteSpace: "nowrap",
  },
};

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const acceptBidAPICall = async (selectedBid: {
  biddingOrg: string;
  deviceName: string;
  date: string;
  price: string;
}) => {
  const endpoint = "http://localhost:7500/fabric/acceptBid";
  const body = {
    biddingOrg: selectedBid.biddingOrg,
    deviceName: selectedBid.deviceName,
    date: selectedBid.date,
    price: selectedBid.price,
  };
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      return true; // Return true for successful response
    } else {
      return response.statusText;
    }
  } catch (err) {
    return err;
  }
};

export default function BidsMenu(props: { bidsForMyOrg: any }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedBid, setSelectedBid] = React.useState({ biddingOrg: "ERROR: NONE SELECTED" });
  const theme = useTheme();

  const BidViewer = (elem: any) => {
    return (
      <>
        <Card sx={{ m: 2 }}>
          <CardContent>
            <List>
              <ListItem>
                <ListItemText
                  primary="Bidding Org"
                  secondary={elem?.biddingOrg}
                  secondaryTypographyProps={bidSecondaryTypographyProps}
                ></ListItemText>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Current Owner Org"
                  secondary={elem?.currentOwnerOrg}
                  secondaryTypographyProps={bidSecondaryTypographyProps}
                ></ListItemText>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Device Name"
                  secondary={elem?.deviceName}
                  secondaryTypographyProps={bidSecondaryTypographyProps}
                ></ListItemText>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Date"
                  secondary={elem?.date}
                  secondaryTypographyProps={bidSecondaryTypographyProps}
                ></ListItemText>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Price"
                  secondary={elem?.price}
                  secondaryTypographyProps={bidSecondaryTypographyProps}
                ></ListItemText>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Additional Commitments"
                  secondary={elem?.additionalCommitments}
                  secondaryTypographyProps={bidSecondaryTypographyProps}
                ></ListItemText>
              </ListItem>
              <Divider />
              <ListItem>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    setModalOpen(true);
                    setSelectedBid(elem);
                  }}
                >
                  Accept Bid?
                </Button>
              </ListItem>
              <Divider />
            </List>
          </CardContent>
        </Card>
      </>
    );
  };

  const BidsContainer = (props: any) => {
    return (
      <>
        <Card variant="outlined" sx={{ backgroundColor: theme.palette.primary.light }}>
          <CardContent>
            <Typography variant="h4">{"Bids"}</Typography>

            {props.bidsData &&
            props.bidsData?.message !== "No bids found on the ledger for this org." ? (
              props.bidsData.map((elem: any) => BidViewer(elem))
            ) : (
              <Card sx={{ m: 2 }}>
                <CardContent>
                  <Typography>No bids found for any data owned by your Org!</Typography>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={modalStyle}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Accepting Bid from: {props.selectedBid.biddingOrg}
            </Typography>
            <Divider />
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              If you accept this bid, other bids for this data (from other orgs) will be deleted!
            </Typography>

            <Box p={3} textAlign="center">
              <Button
                variant="contained"
                color="success"
                onClick={async () => {
                  const response = await acceptBidAPICall(props.selectedBid);
                  if (response != true) {
                    alert("Error ocurred during request:" + response);
                  } else {
                    alert("Success! Asset transferred");
                    setModalOpen(false);
                    window.location.reload();
                  }
                }}
              >
                Accept Bid
              </Button>
            </Box>
          </Box>
        </Modal>
      </>
    );
  };

  return (
    <>
      <BidsContainer bidsData={props.bidsForMyOrg} selectedBid={selectedBid} />
    </>
  );
}
