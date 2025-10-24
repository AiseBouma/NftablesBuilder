import { Grid, MenuItem } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import EditIcon from "@mui/icons-material/Edit";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { type MouseEvent } from "react";
import { TableCellEmptyRow, TextFieldStyled } from "../ts/utils";

export interface FilterRule {
  source: string[];
  sourceservice: string[];
  destination: string[];
  destinationservice: string[];
  action: string;
  comment: string;
  active: boolean;
}

export interface FilterTableProps {
  chain: string;
  rules: FilterRule[];
  visible: boolean;
  deleted: boolean;
  defaultpolicy: string;
  observer: MutationObserver;
  onStartDrag: (e: MouseEvent<HTMLSpanElement>, type: string, value: string, chain: string, row: number) => void;
  onChangeAction: (chain: string, row: number, value: string) => void;
  onEditComment: (chain: string, index: number) => void;
  onDeleteRule: (chain: string, index: number) => void;
  onToggleRule: (chain: string, index: number) => void;
}

function FilterTable(props: FilterTableProps) {
  if (!props.visible) {
    return null;
  } else {
    return (
      <TableContainer sx={{ marginBottom: "1rem" }}>
        <Table sx={{ width: "auto", border: 0 }} size="small" aria-label="interfaces table">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Active
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Source Addresses
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Source Services
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Destination Addresses
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Destination Services
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Action
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              >
                Comment
              </TableCell>
              <TableCell
                sx={{
                  color: "primary.main",
                  borderBottomWidth: 1,
                  borderColor: "primary.main",
                }}
              ></TableCell>
            </TableRow>
          </TableHead>
          <TableBody id={"tablebody-" + props.chain} sx={{ border: 0 }}>
            {props.rules.map((rule, index) => (
              <TableRow key={props.chain + "-" + index + "-row"}>
                <TableCell className="RulesCell">
                  {!props.deleted ? (
                    rule.active ? (
                      <ToggleOnIcon
                        fontSize="large"
                        className="clickable"
                        sx={{ color: "var(--mui-palette-success-main)" }}
                        onClick={() => props.onToggleRule(props.chain, index)}
                      />
                    ) : (
                      <ToggleOffIcon
                        fontSize="large"
                        className="clickable"
                        sx={{ color: "var(--mui-palette-warning-main)" }}
                        onClick={() => props.onToggleRule(props.chain, index)}
                      />
                    )
                  ) : (
                    <ToggleOffIcon fontSize="large" sx={{ color: "var(--mui-palette-warning-main)" }} />
                  )}
                </TableCell>
                <TableCell className="RulesCell" id={props.chain + "-source-" + index}>
                  {rule.source.map((value, i) => {
                    return (
                      <>
                        {i > 0 ? ", " : null}
                        <span
                          id={props.chain + "-" + index + "-" + value + "-addressvalue"}
                          key={props.chain + "-" + index + "-" + value + "-addressvalue"}
                          className="cellvalue"
                          onMouseDown={function (e: MouseEvent<HTMLSpanElement>) {
                            props.onStartDrag(e, "address", value, props.chain, index);
                          }}
                        >
                          {value}
                        </span>
                      </>
                    );
                  })}
                </TableCell>
                <TableCell className="RulesCell" id={props.chain + "-sourceservice-" + index}>
                  {rule.sourceservice.map((value, i) => {
                    return (
                      <>
                        {i > 0 ? ", " : null}
                        <span
                          id={props.chain + "-" + index + "-" + value + "-servicevalue"}
                          key={props.chain + "-" + index + "-" + value + "-servicevalue"}
                          className="cellvalue"
                          onMouseDown={function (e: MouseEvent<HTMLSpanElement>) {
                            props.onStartDrag(e, "service", value, props.chain, index);
                          }}
                        >
                          {value}
                        </span>
                      </>
                    );
                  })}
                </TableCell>
                <TableCell className="RulesCell" id={props.chain + "-destination-" + index}>
                  {rule.destination.map((value, i) => {
                    return (
                      <>
                        {i > 0 ? ", " : null}
                        <span
                          id={props.chain + "-" + index + "-" + value + "-addressvalue"}
                          key={props.chain + "-" + index + "-" + value + "-addressvalue"}
                          className="cellvalue"
                          onMouseDown={function (e: MouseEvent<HTMLSpanElement>) {
                            props.onStartDrag(e, "address", value, props.chain, index);
                          }}
                        >
                          {value}
                        </span>
                      </>
                    );
                  })}
                </TableCell>
                <TableCell className="RulesCell" id={props.chain + "-destinationservice-" + index}>
                  {rule.destinationservice.map((value, i) => {
                    return (
                      <>
                        {i > 0 ? ", " : null}
                        <span
                          id={props.chain + "-" + index + "-" + value + "-servicevalue"}
                          key={props.chain + "-" + index + "-" + value + "-servicevalue"}
                          className="cellvalue"
                          onMouseDown={function (e: MouseEvent<HTMLSpanElement>) {
                            props.onStartDrag(e, "service", value, props.chain, index);
                          }}
                        >
                          {value}
                        </span>
                      </>
                    );
                  })}
                </TableCell>
                <TableCell className="RulesCell">
                  <TextFieldStyled
                    id="policy-select"
                    select
                    defaultValue="block"
                    variant="standard"
                    value={props.rules[index].action}
                    className="NoBorder"
                    disabled={props.deleted}
                    onChange={(e) => props.onChangeAction(props.chain, index, e.target.value)}
                  >
                    <MenuItem key="accept" value="accept">
                      accept
                    </MenuItem>
                    <MenuItem key="drop" value="drop">
                      drop
                    </MenuItem>
                  </TextFieldStyled>
                </TableCell>
                <TableCell className="RulesCell">
                  <Grid
                    container
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>{props.rules[index].comment}</div>
                    <IconButton
                      aria-label="edit"
                      color="primary"
                      onClick={() => props.onEditComment(props.chain, index)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Grid>
                </TableCell>
                <TableCell className="RulesCell">
                  <IconButton
                    aria-label="delete"
                    color="primary"
                    sx={{ float: "right" }}
                    onClick={() => props.onDeleteRule(props.chain, index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!props.deleted ? (
              <TableRow key={"empty-row"} sx={{ minHeight: "20px" }}>
                <TableCell className="RulesCell"></TableCell>
                <TableCell className="RulesCell" id={props.chain + "-source-empty"}>
                  <span className="EmptyRowSpan">drag here to start</span>
                </TableCell>
                <TableCellEmptyRow className="RulesCell CellEmptyRow" id={props.chain + "-sourceservice-empty"}>
                  <span className="EmptyRowSpan">drag here to start</span>
                </TableCellEmptyRow>
                <TableCell className="RulesCell" id={props.chain + "-destination-empty"}>
                  <span className="EmptyRowSpan">drag here to start</span>
                </TableCell>
                <TableCell className="RulesCell" id={props.chain + "-destinationservice-empty"}>
                  <span className="EmptyRowSpan">drag here to start</span>
                </TableCell>
                <TableCell className="RulesCell"></TableCell>
                <TableCell className="RulesCell"></TableCell>
                <TableCell className="RulesCell"></TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
}

export default FilterTable;
