import { Grid, Tooltip } from "@mui/material";
import type { DragPosition } from "../ts/dragreceiving.ts";
import { type MouseEvent } from "react";

export interface FloatingListProps {
  title: string;
  index: number;
  dragpos: DragPosition[];
  onStartDragList: (e: MouseEvent<HTMLDivElement>, index: number) => void;
  onStartDragValue: (e: MouseEvent<HTMLDivElement>, type: string, value: string) => void;
  items: string[];
  tooltips: string[];
  type: string;
  cursor: string;
}

function FloatingList(props: FloatingListProps) {
  function ShowItem(item: string, index: number) {
    if (props.tooltips.length > 0) {
      return (
        <Tooltip title={props.tooltips[index]} placement="right" key={index}>
          <div
            key={item}
            className="floatinglistitem"
            onMouseDown={function (e: MouseEvent<HTMLDivElement>) {
              props.onStartDragValue(e, props.type, item);
            }}
          >
            {item}
          </div>
        </Tooltip>
      );
    } else {
      return (
        <div
          key={item}
          className="floatinglistitem"
          onMouseDown={function (e: MouseEvent<HTMLDivElement>) {
            props.onStartDragValue(e, props.type, item);
          }}
        >
          {item}
        </div>
      );
    }
  }

  return (
    <div
      className="floatinglist"
      style={{ top: props.dragpos[props.index].top, left: props.dragpos[props.index].left, cursor: props.cursor }}
    >
      <div
        onMouseDown={function (e: MouseEvent<HTMLDivElement>) {
          props.onStartDragList(e, props.index);
        }}
        className="floatingheader"
      >
        {props.title}
      </div>
      <Grid
        className="floatinggrid"
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
export default FloatingList;
