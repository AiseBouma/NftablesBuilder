import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Button,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LookupIcon from "@mui/icons-material/Dns";

export interface HostAdresses {
  ipv4: string[];
  ipv6: string[];
}

export interface HostsPanelProps {
  hosts: Map<string, HostAdresses>;
  onAdd: () => void;
  onEdit: (hostname: string) => void;
  onDelete: (hostname: string) => void;
  onLookup: (hostname: string) => void;
  onEditIPv4: (hostname: string) => void;
  onEditIPv6: (hostname: string) => void;
}

function HostsPanel(props: HostsPanelProps) {
  return (
    <>
      <TableContainer>
        <Table sx={{ width: "auto", border: 0 }} size="small" aria-label="hosts table">
          <TableHead>
            <TableRow>
              <TableCell align="left" colSpan={6} sx={{ border: 0 }}>
                <h2>Hosts</h2>
              </TableCell>
              <TableCell align="right" colSpan={2} sx={{ border: 0 }}>
                <Tooltip title="Add host by name, it is recommended to use DNS name">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={props.onAdd}
                  >
                    Add
                  </Button>
                </Tooltip>
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
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                &nbsp;
              </TableCell>
              <TableCell
                sx={{
                  width: "100px",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                &nbsp;
              </TableCell>
              <TableCell
                sx={{
                  width: "135px",
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                IPv4 Addresses
              </TableCell>
              <TableCell
                sx={{
                  width: "100px",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                &nbsp;
              </TableCell>
              <TableCell
                sx={{
                  width: "320px",
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                IPv6 Addresses
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
            {Array.from(props.hosts.keys()).map((host) => (
              <TableRow key={host}>
                <TableCell sx={{ border: 0 }}>{host}</TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton
                    aria-label="edit"
                    color="primary"
                    onClick={() => props.onEdit(host)}
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton
                    aria-label="delete"
                    color="primary"
                    onClick={() => props.onDelete(host)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <Tooltip title="Get addresses via DNS">
                    <IconButton
                      aria-label="lookup"
                      color="primary"
                      onClick={() => props.onLookup(host)}
                    >
                      <LookupIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ border: 0, whiteSpace: "pre" }}>
                  {props.hosts.get(host)?.ipv4.join("\n")}
                </TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton
                    aria-label="edit"
                    color="primary"
                    onClick={() => props.onEditIPv4(host)}
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell sx={{ border: 0, whiteSpace: "pre" }}>
                  {props.hosts.get(host)?.ipv6.join("\n")}
                </TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton
                    aria-label="edit"
                    color="primary"
                    onClick={() => props.onEditIPv6(host)}
                  >
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

export default HostsPanel;
