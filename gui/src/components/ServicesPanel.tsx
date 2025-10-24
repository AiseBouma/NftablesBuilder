import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export interface ServiceDef {
  port: number;
  protocol: string;
  default: boolean;
}

export interface ServicesPanelProps {
  portlist: Map<string, ServiceDef>;
  onAdd: () => void;
  onEdit: (hostname: string) => void;
  onDelete: (hostname: string) => void;
  onEditPort: (hostname: string) => void;
}

function ServicesPanel(props: ServicesPanelProps) {
  function showPort(name: string): string {
    const portDef = props.portlist.get(name);
    if (!portDef) return "N/A";

    let portStr = `${portDef.port}`;
    return portStr + " " + portDef.protocol;
  }

  function disabled(name: string): boolean {
    const portDef = props.portlist.get(name);
    return portDef !== undefined && portDef.default;
  }

  return (
    <>
      <TableContainer>
        <Table sx={{ width: "auto", border: 0 }} size="small" aria-label="services table">
          <TableHead>
            <TableRow>
              <TableCell align="left" colSpan={3} sx={{ border: 0 }}>
                <h2>Services</h2>
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
                Port
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
            {Array.from(props.portlist.keys()).map((sv) => (
              <TableRow key={sv}>
                <TableCell sx={{ border: 0 }}>{sv}</TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton
                    aria-label="edit"
                    disabled={disabled(sv)}
                    color="primary"
                    onClick={() => props.onEdit(sv)}
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton aria-label="delete" color="primary" onClick={() => props.onDelete(sv)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>

                <TableCell sx={{ border: 0, whiteSpace: "pre" }}>{showPort(sv)}</TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton
                    aria-label="edit"
                    disabled={disabled(sv)}
                    color="primary"
                    onClick={() => props.onEditPort(sv)}
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

export default ServicesPanel;
