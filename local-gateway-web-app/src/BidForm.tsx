import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";

export default function BidForm(props: {
  deviceName: string;
  date: string;
  bidForDataFunc: any;
  setBidFormOpenFunc: any;
}) {
  const theme = useTheme();
  const dividerColor = theme.palette.divider;
  const [price, setPrice] = React.useState("");
  const [additionalCommitments, setAdditionalCommitments] = React.useState("");

  return (
    <Card sx={{ border: 2, borderColor: dividerColor, boxShadow: 0 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={9} sx={{ display: "flex", justifyContent: "left" }}>
            <Typography>Add information to your bid:</Typography>
          </Grid>
          <Grid item xs={3} sx={{ display: "flex", justifyContent: "right" }}>
            <IconButton aria-label="close" onClick={() => props.setBidFormOpenFunc(false)}>
              <CloseIcon />
            </IconButton>
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              id="outlined-required"
              defaultValue=""
              label="Price"
              onChange={(event) => setPrice(event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              id="outlined-required"
              defaultValue=""
              label="Additional Commitments"
              onChange={(event) => setAdditionalCommitments(event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              color="success"
              onClick={async () => {
                const res = await props.bidForDataFunc(
                  props.deviceName,
                  props.date,
                  price,
                  additionalCommitments
                );
                if (res.ok) {
                  props.setBidFormOpenFunc(false);
                  alert("Bid submitted successfully");
                } else {
                  alert("Failed to submit bid!" + res.statusText);
                }
                // on success, close
              }}
            >
              Submit Bid!
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
