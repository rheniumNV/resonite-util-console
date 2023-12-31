import * as React from "react";
import { styled } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ContentCopy from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/ArrowRightAlt";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import _ from "lodash";
import { Link } from "@mui/material";
import { copy, eraseResoniteRichTextTag } from "../../helper";

const ExpandMore = styled((props: any) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));

export default function SessionCard({ session }) {
  const {
    name,
    thumbnailUrl,
    description,
    sessionUsers,
    hostUsername,
    totalActiveUsers,
    sessionBeginTime,
    headlessHost,
    maxUsers,
    sessionId,
  } = session;
  const [expanded, setExpanded] = React.useState(false);

  const displayName = _.join(
    _.slice(eraseResoniteRichTextTag(name), 0, 256),
    ""
  );

  const sessionUrl = `http://api.resonite.com/open/session/${sessionId}`;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardHeader
        sx={{ height: 100, fontSize: 12 }}
        title={displayName}
        subheader={`${hostUsername} ${headlessHost ? "(Headless)" : ""}`}
      />
      <CardMedia
        component="img"
        height="194"
        image={thumbnailUrl}
        alt={displayName}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {`${totalActiveUsers}/${maxUsers} `}
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton aria-label="copy-session-url">
          <Link
            onClick={() => {
              copy(sessionUrl);
            }}
          >
            <ContentCopy />
          </Link>
        </IconButton>
        <IconButton aria-label="join-session">
          <Link href={sessionUrl}>
            <ShareIcon />
          </Link>
        </IconButton>
        <ExpandMore
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </ExpandMore>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph>{description}</Typography>
        </CardContent>
        <CardContent>
          {_.map(
            _.sortBy(sessionUsers, ({ isPresent }) => !isPresent),
            ({ username, isPresent }, index) => {
              return (
                <Typography
                  key={index}
                  paragraph
                  color={isPresent ? "black" : "gray"}
                >
                  {username}
                </Typography>
              );
            }
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}
