import React, { useState } from "react";
import { useRouter } from "next/router";
import _ from "lodash";
import {
  formatInventoryPath,
  getLinkApiUrl,
  parseRecordUri,
  toLinkUrl,
  toViewerUrl,
  useLocalLinks,
} from "../../../src/inventory/inventoryHelper";
import {
  Button,
  Container,
  Stack,
  TextField,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
  Dialog,
} from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRightAlt";
import StarIcon from "@mui/icons-material/Star";
import FolderIcon from "@mui/icons-material/Folder";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudIcon from "@mui/icons-material/Cloud";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

const COMMON_LINKS = [
  { name: "Resonite Essentials", ownerId: "G-Resonite", path: "Inventory" },
  { name: "Creator Jam Public", ownerId: "U-Medra", path: "Inventory\\CJ" },
  { name: "JP Publics", ownerId: "G-Shared-Project-rheni", path: "Inventory" },
  { name: "1Public Folders", ownerId: "U-Staccato", path: "Inventory" },
];

function LinkItem({
  name,
  link,
  ownerId,
  path,
  removeLink,
  recordId,
}: {
  name: string;
  ownerId: string;
  path: string;
  recordId?: string;
  removeLink?: (link: string) => void;
  link?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    //https://github.com/rheniumNV/neos-util-console/issues/17
    //一旦使えるようにする。
    if (recordId) {
      router.push(toLinkUrl(ownerId, recordId));
    } else {
      router.push(toViewerUrl(ownerId, `${path}\\${name}`));
    }
  };

  return (
    <ListItemButton sx={{ pl: 4 }}>
      <ListItemIcon onClick={handleOpen}>
        <FolderIcon />
      </ListItemIcon>
      <ListItemText
        primary={name}
        secondary={`${ownerId} / ${formatInventoryPath(path)}`}
        onClick={handleOpen}
      />
      {Boolean(removeLink) && Boolean(link) && (
        <>
          <ListItemIcon>
            <IconButton onClick={handleClickOpen}>
              <DeleteIcon />
            </IconButton>
          </ListItemIcon>
          <Dialog
            fullScreen={fullScreen}
            open={open}
            onClose={handleClose}
            aria-labelledby="responsive-dialog-title"
          >
            <DialogTitle id="responsive-dialog-title">
              {`Do you really want to remove "${name}" from your favorites?`}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>{`${ownerId} / ${formatInventoryPath(
                path
              )} / ${name}`}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button autoFocus onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  removeLink(link);
                  handleClose();
                }}
                autoFocus
                color={"error"}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </ListItemButton>
  );
}

const Index = () => {
  const router = useRouter();

  const [linkText, setLinkText] = useState("");
  const {
    ownerId: linkOwnerId,
    recordId: linkRecordId,
    isValid: linkTextIsValid,
  } = parseRecordUri(linkText);
  const linkTextFieldError = !(linkTextIsValid || !linkText);

  const { links, pushLink, getLink, removeLink } = useLocalLinks();

  const [favoritesOpened, setFavoritesOpened] = React.useState<boolean>(true);
  const [standardOpened, setStandardOpened] = React.useState<boolean>(true);

  return (
    <Container sx={{ paddingTop: 6 }}>
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <Stack>
              <TextField
                id="standard-basic"
                label={
                  Boolean(linkText)
                    ? "inventory link"
                    : "resrec:///U-xxxx/R-xxxx"
                }
                variant="standard"
                color={linkTextFieldError ? "primary" : "error"}
                value={linkText}
                onChange={(event) => {
                  setLinkText(event.target.value);
                }}
                error={linkTextFieldError}
                helperText={linkTextFieldError ? "resrec///U-xxxx/R-xxxx" : ""}
              />
            </Stack>
          </Grid>
          <Grid item xs={2}>
            <Stack>
              <Button
                variant="contained"
                endIcon={<ArrowRightIcon />}
                disabled={!linkTextIsValid}
                onClick={() => {
                  router.replace(toLinkUrl(linkOwnerId, linkRecordId));
                }}
              >
                Open
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={2}>
            <Stack>
              <Button
                variant="contained"
                endIcon={<StarIcon />}
                disabled={!linkTextIsValid}
                onClick={async () => {
                  const sameLink = getLink(linkText);
                  if (!sameLink) {
                    const response = await fetch(
                      getLinkApiUrl(linkOwnerId, linkRecordId)
                    ).catch(() => undefined);
                    if (!response?.ok) {
                      window.alert("Failed to load this inventory link.");
                      return;
                    }
                    const { name, path } = await response.json();
                    pushLink({
                      link: linkText,
                      ownerId: linkOwnerId,
                      recordId: linkRecordId,
                      path,
                      name,
                    });
                  } else {
                    window.alert(`"${sameLink.name}" already exists.`);
                  }
                }}
              >
                Favorite
              </Button>
            </Stack>
          </Grid>
        </Grid>
        <List component="nav" aria-label="main mailbox folders">
          <ListItemButton
            onClick={() => {
              setFavoritesOpened(!favoritesOpened);
            }}
          >
            <ListItemIcon>
              <StarIcon />
            </ListItemIcon>
            <ListItemText primary={`Favorites (${_.size(links)})`} />
            {favoritesOpened ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
          <Collapse in={favoritesOpened} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {_.map(links, (link) => (
                <LinkItem
                  {...link}
                  removeLink={removeLink}
                  key={_.get(link, "recordId")}
                />
              ))}
            </List>
          </Collapse>
          <ListItemButton
            onClick={() => {
              setStandardOpened(!standardOpened);
            }}
          >
            <ListItemIcon>
              <CloudIcon />
            </ListItemIcon>
            <ListItemText primary={`Common (${_.size(COMMON_LINKS)})`} />
            {standardOpened ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
          <Collapse in={standardOpened} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {_.map(COMMON_LINKS, (link) => (
                <LinkItem {...link} key={`${link.ownerId}/${link.name}`} />
              ))}
            </List>
          </Collapse>
        </List>
      </Stack>
    </Container>
  );
};

export default Index;
