import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Button,
  MenuItem,
} from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import { TextFieldStyled } from "../ts/utils";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

export interface ChainItem {
  filter: boolean;
  snat: boolean;
  dnat: boolean;
  iface_in: string;
  iface_out: string;
  direction: string;
  policy: string;
}

export interface ChainsPanelProps {
  chainsList: Map<string, ChainItem>;
  onGenerate: () => void;
  onDelete: (name: string) => void;
  onChange: (name: string, value: string) => void;
  onToggleFilter: (name: string) => void;
  onToggleSnat: (name: string) => void;
  onToggleDnat: (name: string) => void;
}

function ChainsPanel(props: ChainsPanelProps) {
  function snat_possible(chain: string): boolean {
    let data = props.chainsList.get(chain);
    if (data !== undefined) {
      return data.direction == "output" || data.direction == "forward";
    }
    return false;
  }

  function dnat_possible(chain: string): boolean {
    let data = props.chainsList.get(chain);
    if (data !== undefined) {
      return data.direction == "input" || data.direction == "forward";
    }
    return false;
  }

  return (
    <>
      <TableContainer>
        <Table sx={{ width: "auto", border: 0 }} size="small" aria-label="interfaces table">
          <TableHead>
            <TableRow>
              <TableCell align="left" colSpan={6} sx={{ border: 0 }}>
                <h2>Chains</h2>
              </TableCell>
              <TableCell align="right" colSpan={2} sx={{ border: 0 }}>
                <Tooltip title="Generate chains based on network interfaces">
                  <Button variant="contained" startIcon={<BuildIcon />} onClick={props.onGenerate}>
                    Generate
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ border: 0 }}>&nbsp;</TableCell>
              <TableCell
                colSpan={3}
                sx={{
                  color: "primary.main",
                  border: 0,
                  borderColor: "primary.main",
                }}
              >
                Detailed rules for
              </TableCell>
              <TableCell
                colSpan={2}
                sx={{
                  color: "primary.main",
                  border: 0,
                  borderColor: "primary.main",
                }}
              >
                Network Interface
              </TableCell>
              <TableCell sx={{ border: 0 }} colSpan={2}>
                &nbsp;
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
                  width: "80px",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                  color: "primary.main",
                }}
              >
                Filtering
              </TableCell>
              <TableCell
                sx={{
                  width: "80px",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                  color: "primary.main",
                }}
              >
                SNAT
              </TableCell>
              <TableCell
                sx={{
                  width: "80px",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                  color: "primary.main",
                }}
              >
                DNAT
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                In
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Out
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Direction
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Policy
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ border: 0 }}>
            {Array.from(props.chainsList.keys()).map((name) => (
              <TableRow key={name}>
                <TableCell sx={{ border: 0 }}>{name}</TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  {props.chainsList.get(name)?.filter ? (
                    <ToggleOnIcon
                      fontSize="large"
                      className="clickable"
                      sx={{ color: "var(--mui-palette-success-main)", marginTop: "3px" }}
                      onClick={() => props.onToggleFilter(name)}
                    />
                  ) : (
                    <ToggleOffIcon
                      fontSize="large"
                      className="clickable"
                      sx={{ color: "var(--mui-palette-warning-main)", marginTop: "3px" }}
                      onClick={() => props.onToggleFilter(name)}
                    />
                  )}
                </TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  {snat_possible(name) ? (
                    props.chainsList.get(name)?.snat ? (
                      <ToggleOnIcon
                        fontSize="large"
                        className="clickable"
                        sx={{ color: "var(--mui-palette-success-main)", marginTop: "3px" }}
                        onClick={() => props.onToggleSnat(name)}
                      />
                    ) : (
                      <ToggleOffIcon
                        fontSize="large"
                        className="clickable"
                        sx={{ color: "var(--mui-palette-warning-main)", marginTop: "3px" }}
                        onClick={() => props.onToggleSnat(name)}
                      />
                    )
                  ) : (
                    <></>
                  )}
                </TableCell>
                <TableCell align="left" sx={{ border: 0 }}>
                  {dnat_possible(name) ? (
                    props.chainsList.get(name)?.dnat ? (
                      <ToggleOnIcon
                        fontSize="large"
                        className="clickable"
                        sx={{ color: "var(--mui-palette-success-main)", marginTop: "3px" }}
                        onClick={() => props.onToggleDnat(name)}
                      />
                    ) : (
                      <ToggleOffIcon
                        fontSize="large"
                        className="clickable"
                        sx={{ color: "var(--mui-palette-warning-main)", marginTop: "3px" }}
                        onClick={() => props.onToggleDnat(name)}
                      />
                    )
                  ) : (
                    <></>
                  )}
                </TableCell>
                <TableCell sx={{ border: 0 }}>{props.chainsList.get(name)?.iface_in}</TableCell>
                <TableCell sx={{ border: 0 }}>{props.chainsList.get(name)?.iface_out}</TableCell>
                <TableCell sx={{ border: 0 }}>{props.chainsList.get(name)?.direction}</TableCell>
                <TableCell sx={{ border: 0 }}>
                  <TextFieldStyled
                    id="policy-select"
                    select
                    defaultValue="drop"
                    variant="standard"
                    value={props.chainsList.get(name)?.policy}
                    className="NoBorder"
                    onChange={(e) => props.onChange(name, e.target.value)}
                  >
                    <MenuItem key="accept" value="accept">
                      accept
                    </MenuItem>
                    <MenuItem key="drop" value="drop">
                      drop
                    </MenuItem>
                  </TextFieldStyled>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default ChainsPanel;
