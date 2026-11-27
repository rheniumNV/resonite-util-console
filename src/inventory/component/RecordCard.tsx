import React from "react";
import _ from "lodash";
import {
  downloadAssetAsBrson as downloadAsset,
  useLocalLinks,
  InventoryRecord,
} from "../inventoryHelper";
import { copy, eraseResoniteRichTextTag, useLocalStorage } from "../../helper";
import {
  Alert,
  TableRow,
  TableCell,
  IconButton,
  MenuList,
  Divider,
  Menu,
  Snackbar,
  Link,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import FolderIcon from "@mui/icons-material/Folder";
import CopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import DownloadDoneIcon from "@mui/icons-material/DownloadDone";
import MoreHorizTwoToneIcon from "@mui/icons-material/MoreHorizTwoTone";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import moment from "moment";
import MenuButtonWithLoading from "../../common/component/MenuButtonWithLoading";

export function RecordCard({
  recordType,
  name,
  recordUri,
  webThumbnailUri,
  viewerLink,
  assetId,
  assetUri,
  link,
  lastModifyingUserId,
  creationTime,
}: InventoryRecord) {
  const { getLink, pushLink, removeLink } = useLocalLinks();
  const isFav = !!getLink(_.get(link, "link"));
  const [modeState] = useLocalStorage("Util.Mode");

  const displayName = _.slice(eraseResoniteRichTextTag(name), 0, 256);

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const menuOpened = Boolean(menuAnchorEl);
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const [snackbarMessage, setSnackbarMessage] = React.useState<string | null>(
    null
  );
  const handleCloseSnackbar = () => {
    setSnackbarMessage(null);
  };

  const renderCopyMenuItem = (label: string, text: string) => (
    <MenuButtonWithLoading
      handleAction={async () => {
        copy(text);
        setSnackbarMessage(label);
      }}
      SuccessIcon={CheckIcon}
      DefaultIcon={CopyIcon}
      name={label}
    />
  );

  return (
    <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }} hover>
      <TableCell scope="row">
        {(() => {
          switch (recordType) {
            case "directory":
              return (
                <Link color={"rgba(0, 0, 0, 0.54)"} href={viewerLink}>
                  <FolderIcon />
                </Link>
              );
            case "link":
              return (
                <Link color={"rgba(0, 0, 0, 0.54)"} href={viewerLink}>
                  <FolderSharedIcon />
                </Link>
              );
            case "object":
              return <img src={webThumbnailUri} width={30} height={30} />;
            default:
              return null;
          }
        })()}
      </TableCell>
      <TableCell scope="row">
        {recordType == "object" && displayName}
        {recordType != "object" && (
          <Link color={"#000"} href={viewerLink}>
            {displayName}
          </Link>
        )}
      </TableCell>
      <TableCell align="right">
        {moment(creationTime).format("YYYY M/D HH:mm")}
      </TableCell>
      {modeState === "advanced" && (
        <TableCell align="right">{lastModifyingUserId}</TableCell>
      )}
      <TableCell align="right">
        {recordType != "object" && (
          <IconButton
            onClick={() => {
              if (isFav) {
                removeLink(link.link);
              } else {
                pushLink(link);
              }
            }}
          >
            {isFav && <StarIcon fontSize="small" />}
            {!isFav && <StarBorderIcon fontSize="small" />}
          </IconButton>
        )}
      </TableCell>
      <TableCell align="right">
        <IconButton onClick={handleMenuOpen}>
          <MoreHorizTwoToneIcon />
        </IconButton>

        <Menu
          open={menuOpened}
          onClose={handleMenuClose}
          anchorEl={menuAnchorEl}
        >
          <MenuList>
            {modeState === "advanced" &&
              renderCopyMenuItem("Copy RecordUri", recordUri)}
            {recordType === "object" && (
              <>
                {renderCopyMenuItem("Copy AssetUri", assetUri)}
                <Divider />
                <MenuButtonWithLoading
                  handleAction={async () => {
                    await downloadAsset(assetId, name, assetUri);
                    setSnackbarMessage("Download Asset");
                  }}
                  SuccessIcon={DownloadDoneIcon}
                  DefaultIcon={DownloadIcon}
                  name={"Download Asset"}
                />
              </>
            )}
            {recordType != "object" &&
              renderCopyMenuItem(
                "Copy InventoryLink",
                recordType === "link" ? assetUri : recordUri
              )}
          </MenuList>
        </Menu>
        <Snackbar
          open={Boolean(snackbarMessage)}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity="success"
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </TableCell>
    </TableRow>
  );
}
