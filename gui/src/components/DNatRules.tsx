import { Grid } from "@mui/material";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { type MouseEvent } from "react";
import FloatingList from "./FloatingList";
import type { DragPosition } from "../ts/dragreceiving";
import type { NatTableProps } from "./NatTable";
import NatTable from "./NatTable";

export interface DNatRulesProps {
  active: string[];
  rules: Map<string, NatTableProps>;
  dragpos: DragPosition[];
  hosts: string[];
  hostgroups: string[];
  networks: string[];
  services: string[];
  cursor: string;
  onStartDragList: (e: MouseEvent<HTMLDivElement>, index: number) => void;
  onStartDragValue: (e: MouseEvent<HTMLDivElement>, type: string, value: string) => void;
  onHideShow: (chain: string) => void;
  onError: (text: string) => void;
}

function DNatRules(props: DNatRulesProps) {
  function ShowIcon(chain: string) {
    let filterdef = props.rules.get(chain);
    if (filterdef !== undefined) {
      if (filterdef.visible) {
        return (
          <ArrowDropDownIcon
            fontSize="large"
            color="primary"
            className="clickable"
            onClick={function (_e) {
              props.onHideShow(chain);
            }}
          />
        );
      } else {
        return (
          <ArrowRightIcon
            fontSize="large"
            color="primary"
            className="clickable"
            onClick={function (_e) {
              props.onHideShow(chain);
            }}
          />
        );
      }
    }
  }

  function ShowTitle(chain: string) {
    let secondary = "";
    let def = props.rules.get(chain);
    if (def !== undefined) {
      if (def.deleted) {
        secondary = "(deleted)";
      }
    }
    return (
      <>
        <span
          className="clickable"
          onClick={function (_e) {
            props.onHideShow(chain);
          }}
        >
          {chain}
        </span>
        <span className="secondary"> &nbsp;{secondary}</span>
      </>
    );
  }

  function ShowTable(chain: string) {
    let table = props.rules.get(chain);
    if (table === undefined) {
      table = {} as NatTableProps;
      table.rules = [];
    }
    return (
      <>
        <NatTable {...table} />
      </>
    );
  }

  function IsActive(chain: string): boolean {
    return props.active.includes(chain);
  }

  return (
    <>
      <Grid
        container
        direction="column"
        sx={{
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        <h2>Destination NAT Rules</h2>
        {Array.from(props.rules.keys()).map((chain) =>
          IsActive(chain) ? (
            <div key={chain}>
              <div className="chaindiv">
                {ShowIcon(chain)}
                {ShowTitle(chain)}
              </div>
              {ShowTable(chain)}
            </div>
          ) : (
            <></>
          )
        )}
      </Grid>

      <FloatingList
        {...{
          index: 0,
          title: "Hosts",
          dragpos: props.dragpos,
          onStartDragList: props.onStartDragList,
          onStartDragValue: props.onStartDragValue,
          items: props.hosts,
          tooltips: [],
          type: "host",
          cursor: props.cursor,
        }}
      />
      <FloatingList
        {...{
          index: 1,
          title: "Host Groups",
          dragpos: props.dragpos,
          onStartDragList: props.onStartDragList,
          onStartDragValue: props.onStartDragValue,
          items: props.hostgroups,
          tooltips: [],
          type: "address",
          cursor: props.cursor,
        }}
      />
      <FloatingList
        {...{
          index: 2,
          title: "Networks",
          dragpos: props.dragpos,
          onStartDragList: props.onStartDragList,
          onStartDragValue: props.onStartDragValue,
          items: props.networks,
          tooltips: [],
          type: "address",
          cursor: props.cursor,
        }}
      />
      <FloatingList
        {...{
          index: 3,
          title: "Services",
          dragpos: props.dragpos,
          onStartDragList: props.onStartDragList,
          onStartDragValue: props.onStartDragValue,
          items: props.services,
          tooltips: [],
          type: "service",
          cursor: props.cursor,
        }}
      />
    </>
  );
}

export default DNatRules;
