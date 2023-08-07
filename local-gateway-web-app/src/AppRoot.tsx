import { ThemeProvider } from "@emotion/react";
import {
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  createTheme,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import React from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import UoBLogo from "./assets/uob_transparent.png";

export default function AppRoot({ myOrgName: myOrgName }: { myOrgName: string | null }) {
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);

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

  const navigate = useNavigate();

  const MenuList = (props: { openMenuFunction: React.Dispatch<React.SetStateAction<any>> }) => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={() => props.openMenuFunction(false)}
      onKeyDown={() => props.openMenuFunction(false)}
    >
      <List>
        <MenuItem
          itemKey="dataView"
          itemText="Data Assets on the Blockchain"
          itemIcon={<InboxIcon />}
          onClick={() => navigate("/")}
        />
        <MenuItem
          itemKey="bidsForMyData"
          itemText="Bids For My Data"
          itemIcon={<InboxIcon />}
          onClick={() => navigate("/bidsMenu")}
        />
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={() => setMenuOpen((prevState) => !prevState)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              Community Data Viewer
            </Typography>
            <Box component="img" sx={{ height: 54 }} alt="Logo" src={UoBLogo}></Box>
            <Typography variant="h5">{`User belongs to: ${myOrgName}`}</Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          anchor={"left"}
          open={menuOpen}
          ModalProps={{ onBackdropClick: () => setMenuOpen(false) }}
        >
          <MenuList openMenuFunction={setMenuOpen} />
        </Drawer>
        <Outlet />
      </Box>
    </ThemeProvider>
  );
}

function MenuItem(props: { itemKey: string; itemText: string; itemIcon: any; onClick: any }) {
  return (
    <ListItem key={props.itemKey} disablePadding onClick={props.onClick}>
      <ListItemButton>
        <ListItemIcon>{props.itemIcon}</ListItemIcon>
        <ListItemText primary={props.itemText} />
      </ListItemButton>
    </ListItem>
  );
}
