import { Grid } from "@mui/material";
import type { DragPosition } from "../ts/dragreceiving.ts";
import { type MouseEvent } from "react";
import CloseIcon from "@mui/icons-material/Close";

export const FloatingInstallDragIndex = 11;

export interface FloatingInstallProps {
  dragpos: DragPosition;
  script: string[];
  result: string[];
  onStartDrag: (e: MouseEvent<HTMLDivElement>, index: number) => void;
  onClose: () => void;
  visible: boolean;
  cursor: string;
}

function FloatingInstall(props: FloatingInstallProps) {
  if (!props.visible) {
    return <></>;
  }

  function ShowResult() {
    if (props.result.length > 0 && props.result[0] == "OK") {
      return <div className="script_ok">OK</div>;
    } else {
      return props.result.map((line, index) => (
        <div key={index} className="script_error">
          {line + " "}
        </div>
      ));
    }
  }

  return (
    <div id="floatinstall" className="floatinginstall" style={{ top: props.dragpos.top, left: props.dragpos.left }}>
      <Grid
        container
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onMouseDown={function (e: MouseEvent<HTMLDivElement>) {
          props.onStartDrag(e, FloatingInstallDragIndex);
        }}
        className="floatingheader"
        style={{ cursor: props.cursor }}
      >
        <div></div>
        <div>Install</div>
        <CloseIcon className="clickable" onClick={props.onClose} />
      </Grid>
      <Grid
        className="floatinginstallgrid"
        container
        direction="column"
        sx={{
          justifyContent: "flex-start",
          alignItems: "flex-start",
          overflowY: "auto",
        }}
      >
        <Grid
          className="installscript"
          container
          direction="column"
          sx={{
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          <div className="scripttitle">Installation result:</div>
          {ShowResult()}
          <div className="scripttitle">Nft script:</div>
          <table>
            {props.script.map((line, index) => (
              <tr>
                <td key={index} className="line_number">
                  {index + 1}
                </td>
                <td key={index} className="script">
                  {line}
                </td>
              </tr>
            ))}
          </table>
        </Grid>
      </Grid>
    </div>
  );
}
export default FloatingInstall;
