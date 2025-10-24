import { Grid } from "@mui/material";
import type { DragPosition } from "../ts/dragreceiving.ts";
import { type MouseEvent } from "react";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { FloatingCheckDragIndex, type CheckItem } from "../ts/checks.ts";

export interface FloatingChecksProps {
  dragpos: DragPosition;
  items: CheckItem[];
  onStartDrag: (e: MouseEvent<HTMLDivElement>, index: number) => void;
  onClose: () => void;
  visible: boolean;
  cursor: string;
}

function FloatingChecks(props: FloatingChecksProps) {
  if (!props.visible) {
    return <></>;
  }

  function ShowIcon(check: CheckItem) {
    if (check.status == "unchecked") {
      return <QuestionMarkIcon />;
    }
    if (check.status == "ok") {
      return <CheckIcon color="success" />;
    }
    if (check.status == "warning") {
      return <WarningAmberIcon color="warning" />;
    }
    if (check.status == "error") {
      return <ErrorOutlineIcon color="error" />;
    }
  }

  function ShowWarnings(check: CheckItem) {
    return (
      <Grid
        container
        direction="column"
        sx={{
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        {check.warningtexts.map((line, _index) => (
          <div className={"checksitemtext " + line.status + "color"}>{line.text}</div>
        ))}{" "}
      </Grid>
    );
  }

  function ShowItem(check: CheckItem, index: number) {
    return (
      <Grid
        key={index}
        container
        direction="row"
        sx={{
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        {ShowIcon(check)}
        <Grid
          container
          direction="column"
          sx={{
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          <div className="checksitemtext">{check.text}</div>
          {ShowWarnings(check)}
        </Grid>
      </Grid>
    );
  }

  return (
    <div id="floatchecks" className="floatingchecks" style={{ top: props.dragpos.top, left: props.dragpos.left }}>
      <Grid
        container
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onMouseDown={function (e: MouseEvent<HTMLDivElement>) {
          props.onStartDrag(e, FloatingCheckDragIndex);
        }}
        className="floatingheader"
        style={{ cursor: props.cursor }}
      >
        <div></div>
        <div>Checks</div>
        <CloseIcon className="clickable" onClick={props.onClose} />
      </Grid>
      <Grid
        className="floatingchecksgrid"
        container
        direction="column"
        sx={{
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        {props.items.map((item, index) => ShowItem(item, index))}
      </Grid>
    </div>
  );
}
export default FloatingChecks;
