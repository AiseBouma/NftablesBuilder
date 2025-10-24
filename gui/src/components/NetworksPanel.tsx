import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Grid,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export interface NetworksPanelProps {
  ipv4: Map<string, string>;
  ipv6: Map<string, string>;
  onAddIpv4: () => void;
  onAddIpv6: () => void;
  onEditIPv4Name: (name: string) => void;
  onEditIPv4: (name: string) => void;
  onDeleteIPv4: (hostname: string) => void;
  onEditIPv6Name: (name: string) => void;
  onEditIPv6: (name: string) => void;
  onDeleteIPv6: (hostname: string) => void;
}

function NetworksPanel(props: NetworksPanelProps) {
  function showipv4(name: string) {
    let addr = props.ipv4.get(name);
    if (addr === undefined) {
      return "";
    } else {
      return addr;
    }
  }

  function showipv6(name: string) {
    let addr = props.ipv6.get(name);
    if (addr === undefined) {
      return "";
    } else {
      return addr;
    }
  }

  return (
    <>
      <Grid
        container
        direction="row"
        sx={{
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        <Grid>
          <TableContainer sx={{ marginRight: "100px" }}>
            <Table sx={{ width: "auto", border: 0 }} aria-label="interfaces table">
              <TableHead>
                <TableRow>
                  <TableCell align="left" colSpan={3} sx={{ border: 0 }}>
                    <h2>IPv4 Networks</h2>
                  </TableCell>
                  <TableCell align="right" colSpan={2} sx={{ border: 0 }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={props.onAddIpv4}>
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
                    Network
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
                {Array.from(props.ipv4.keys()).map((name) => (
                  <TableRow key={name}>
                    <TableCell sx={{ border: 0 }}>{name}</TableCell>
                    <TableCell align="left" sx={{ border: 0 }}>
                      <IconButton aria-label="edit" color="primary" onClick={() => props.onEditIPv4Name(name)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell align="left" sx={{ border: 0 }}>
                      <IconButton aria-label="delete" color="primary" onClick={() => props.onDeleteIPv4(name)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ border: 0, whiteSpace: "pre" }}>{showipv4(name)}</TableCell>
                    <TableCell align="left" sx={{ border: 0 }}>
                      <IconButton aria-label="edit" color="primary" onClick={() => props.onEditIPv4(name)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid>
          <TableContainer>
            <Table sx={{ width: "auto", border: 0 }} aria-label="interfaces table">
              <TableHead>
                <TableRow>
                  <TableCell align="left" colSpan={3} sx={{ border: 0 }}>
                    <h2>IPv6 Networks</h2>
                  </TableCell>
                  <TableCell align="right" colSpan={2} sx={{ border: 0 }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={props.onAddIpv6}>
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
                    Network
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
                {Array.from(props.ipv6.keys()).map((name) => (
                  <TableRow key={name}>
                    <TableCell sx={{ border: 0 }}>{name}</TableCell>
                    <TableCell align="left" sx={{ border: 0 }}>
                      <IconButton aria-label="edit" color="primary" onClick={() => props.onEditIPv6Name(name)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell align="left" sx={{ border: 0 }}>
                      <IconButton aria-label="delete" color="primary" onClick={() => props.onDeleteIPv6(name)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ border: 0, whiteSpace: "pre" }}>{showipv6(name)}</TableCell>
                    <TableCell align="left" sx={{ border: 0 }}>
                      <IconButton aria-label="edit" color="primary" onClick={() => props.onEditIPv6(name)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}

export default NetworksPanel;
