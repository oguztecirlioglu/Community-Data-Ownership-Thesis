import {
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

const BidViewer = (elem: any) => {
  return (
    <Card sx={{ m: 2 }}>
      <CardContent>
        <List>
          <ListItem>
            <ListItemText
              primary="Bidding Org"
              secondary={elem?.biddingOrg}
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
              primary="Current Owner Org"
              secondary={elem?.currentOwnerOrg}
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
              primary="Device Name"
              secondary={elem?.deviceName}
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
              secondary={elem?.date}
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
              primary="Price"
              secondary={elem?.price}
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
      </CardContent>
    </Card>
  );
};
export default function BidsMenu(props: { bidsForMyOrg: any }) {
  const theme = useTheme();

  const BidsContainer = (props: any) => {
    return (
      <Card variant="outlined" sx={{ backgroundColor: theme.palette.primary.light }}>
        <CardContent>
          <>
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
          </>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <BidsContainer bidsData={props.bidsForMyOrg} />
    </>
  );
}
