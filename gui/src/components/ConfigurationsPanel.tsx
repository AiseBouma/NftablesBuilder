import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import LoadIcon from "@mui/icons-material/Publish";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";

interface Props {
  configs: string[];
  onLoad: (config: string) => void;
  onDelete: (config: string) => void;
  onDownload: (config: string) => void;
}

function ConfigurationsPanel(props: Props) {
  return (
    <List sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
      {props.configs.map((name) => {
        const labelId = `config-list-label-${name}`;

        return (
          <ListItem key={name} disablePadding>
            <ListItemText id={labelId} primary={name} />
            <Tooltip title="Load Configuration">
              <IconButton aria-label="load" color="primary" onClick={() => props.onLoad(name)}>
                <LoadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Configuration">
              <IconButton aria-label="download" color="primary" onClick={() => props.onDownload(name)}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Configuration">
              <IconButton aria-label="delete" color="primary" onClick={() => props.onDelete(name)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
        );
      })}
    </List>
  );
}

export default ConfigurationsPanel;
