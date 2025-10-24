import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export interface HostGroupsPanelProps {
  groups: Map<string, string[]>;
  onAdd: () => void;
  onEdit: (hostname: string) => void;
  onDelete: (hostname: string) => void;
  onUpdate: (hostname: string) => void;
}

function HostGroupsPanel(props: HostGroupsPanelProps) {
  function showhosts(grp: string) {
    let hosts = props.groups.get(grp);
    if (hosts === undefined) {
      return "";
    } else {
      return hosts.join(" ").slice(0, 100);
    }
  }

  return (
    <>
      <TableContainer>
        <Table sx={{ width: "auto", border: 0 }} aria-label="interfaces table">
          <TableHead>
            <TableRow>
              <TableCell align="left" colSpan={3} sx={{ border: 0 }}>
                <h2>Host Groups</h2>
              </TableCell>
              <TableCell align="right" colSpan={2} sx={{ border: 0 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={props.onAdd}>
                  Add
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Name
              </TableCell>
              <TableCell
                sx={{
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                &nbsp;
              </TableCell>
              <TableCell
                sx={{
                  width: "80px",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                &nbsp;
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Hosts
              </TableCell>
              <TableCell
                sx={{
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                &nbsp;
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ border: 0 }}>
            {Array.from(props.groups.keys()).map((grp) => (
              <TableRow key={grp}>
                <TableCell sx={{ border: 0 }}>{grp}</TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton aria-label="edit" color="primary" onClick={() => props.onEdit(grp)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton aria-label="delete" color="primary" onClick={() => props.onDelete(grp)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell sx={{ border: 0, whiteSpace: "pre" }}>{showhosts(grp)}</TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton aria-label="edit" color="primary" onClick={() => props.onUpdate(grp)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default HostGroupsPanel;
