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
import SearchIcon from "@mui/icons-material/Search";

export interface InterfaceListItem {
  systemname: string;
  addresses: string;
  loopback: boolean;
}

export interface InterfacesPanelProps {
  interfacesList: Map<string, InterfaceListItem>;
  onDetect: () => void;
  onNameChange: (oldname: string) => void;
}

function InterfacesPanel(props: InterfacesPanelProps) {
  return (
    <>
      <TableContainer>
        <Table sx={{ width: "auto", border: 0 }} aria-label="interfaces table">
          <TableHead>
            <TableRow>
              <TableCell align="left" colSpan={3} sx={{ border: 0 }}>
                <h2>Network Interfaces</h2>
              </TableCell>
              <TableCell align="right" sx={{ border: 0 }}>
                <Tooltip title="Detect network interfaces, existing names will be rematched where possible">
                  <Button variant="contained" startIcon={<SearchIcon />} onClick={props.onDetect}>
                    Detect
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
                  width: "100px",
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
                Systemname
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Addresses
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ border: 0 }}>
            {Array.from(props.interfacesList.keys()).map((name) => (
              <TableRow key={name}>
                <TableCell sx={{ border: 0 }}>{name}</TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  <IconButton aria-label="edit" color="primary" onClick={() => props.onNameChange(name)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell sx={{ border: 0 }}>{props.interfacesList.get(name)?.systemname}</TableCell>
                <TableCell sx={{ border: 0 }}>{props.interfacesList.get(name)?.addresses}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default InterfacesPanel;
