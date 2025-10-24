import type { FilterTableProps } from "../components/FilterTable";
import type { NatTableProps } from "../components/NatTable";

export interface DragPosition {
  top: number;
  left: number;
}

export const startdragpos: DragPosition[] = [
  { top: 0, left: 0 },

  { top: 300, left: 1000 },
  { top: 340, left: 1040 },
  { top: 380, left: 1080 },
  { top: 420, left: 1120 },
  { top: 300, left: 1000 },
  { top: 340, left: 1040 },
  { top: 380, left: 1080 },
  { top: 420, left: 1120 },
  { top: 140, left: 620 },
];

export interface dragreceiver {
  id: string;
  chain: string;
  rownr: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

interface State {
  address: dragreceiver[];
  service: dragreceiver[];
  targetcell: string;
}

const state: State = { address: [], service: [], targetcell: "" };

export function SetReceiverPositions(type: string, rules: Map<string, FilterTableProps>) {
  state.address = [];
  state.service = [];
  rules.forEach((filtertable, chain) => {
    if (filtertable.visible && !filtertable.deleted) {
      filtertable.rules.forEach((_rules, index) => {
        if (type == "host" || type == "address") {
          ["source", "destination"].map((direction) => {
            let id = chain + "-" + direction + "-" + index;
            let cell = document.getElementById(id);
            if (cell) {
              const rect = cell.getBoundingClientRect();
              state.address.push({
                id: id,
                chain: chain,
                rownr: index,
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
                right: rect.right,
              });
            }
          });
        }
        if (type == "service") {
          ["sourceservice", "destinationservice"].map((direction) => {
            let id = chain + "-" + direction + "-" + index;
            let cell = document.getElementById(id);
            if (cell) {
              const rect = cell.getBoundingClientRect();
              state.service.push({
                id: id,
                chain: chain,
                rownr: index,
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
                right: rect.right,
              });
            }
          });
        }
      });
      if (type == "host" || type == "address") {
        ["source", "destination"].map((direction) => {
          let id = chain + "-" + direction + "-empty";
          let cell = document.getElementById(id);
          if (cell) {
            const rect = cell.getBoundingClientRect();
            state.address.push({
              id: id,
              chain: chain,
              rownr: -1,
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
            });
          }
        });
      }
      if (type == "service") {
        ["sourceservice", "destinationservice"].map((direction) => {
          let id = chain + "-" + direction + "-empty";
          let cell = document.getElementById(id);
          if (cell) {
            const rect = cell.getBoundingClientRect();
            state.service.push({
              id: id,
              chain: chain,
              rownr: -1,
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
            });
          }
        });
      }
    }
  });
}

export function SetNatReceiverPositions(type: string, rules: Map<string, NatTableProps>, _dragindex: number) {
  state.address = [];
  state.service = [];
  rules.forEach((nattable, chain) => {
    if (nattable.visible && !nattable.deleted) {
      nattable.rules.forEach((_rules, index) => {
        if (type == "host" || type == "address") {
          ["source", "destination"].map((direction) => {
            let id = chain + "-" + direction + "-" + index;
            let cell = document.getElementById(id);
            if (cell) {
              const rect = cell.getBoundingClientRect();
              state.address.push({
                id: id,
                chain: chain,
                rownr: index,
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
                right: rect.right,
              });
            }
          });
          if (type == "host") {
            // only hosts are allowed to be dragged to translated address
            let id = chain + "-translated-" + index;
            let cell = document.getElementById(id);
            if (cell) {
              const rect = cell.getBoundingClientRect();
              state.address.push({
                id: id,
                chain: chain,
                rownr: index,
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
                right: rect.right,
              });
            }
          }
        }
        if (type == "service") {
          ["sourceservice", "destinationservice", "translatedservice"].map((direction) => {
            let id = chain + "-" + direction + "-" + index;
            let cell = document.getElementById(id);
            if (cell) {
              const rect = cell.getBoundingClientRect();
              state.service.push({
                id: id,
                chain: chain,
                rownr: index,
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
                right: rect.right,
              });
            }
          });
        }
      });
      if (type == "host" || type == "address") {
        ["source", "destination"].map((direction) => {
          let id = chain + "-" + direction + "-empty";
          let cell = document.getElementById(id);
          if (cell) {
            const rect = cell.getBoundingClientRect();
            state.address.push({
              id: id,
              chain: chain,
              rownr: -1,
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
            });
          }
        });
        if (type == "host") {
          // only hosts are allowed to be dragged to translated address
          let id = chain + "-translated-empty";
          let cell = document.getElementById(id);
          if (cell) {
            const rect = cell.getBoundingClientRect();
            state.address.push({
              id: id,
              chain: chain,
              rownr: -1,
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
            });
          }
        }
      }
      if (type == "service") {
        ["sourceservice", "destinationservice", "translatedservice"].map((direction) => {
          let id = chain + "-" + direction + "-empty";
          let cell = document.getElementById(id);
          if (cell) {
            const rect = cell.getBoundingClientRect();
            state.service.push({
              id: id,
              chain: chain,
              rownr: -1,
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
            });
          }
        });
      }
    }
  });
}

export function CheckMouseUpOnAddress(x: number, y: number): dragreceiver | null {
  if (state.targetcell != "") {
    let cell = document.getElementById(state.targetcell);
    if (cell) {
      cell.style.backgroundColor = "white";
    }
    state.targetcell = "";
  }
  for (let a of state.address) {
    if (x < a.right && x > a.left && y < a.bottom && y > a.top) {
      return a;
    }
  }
  return null;
}

export function CheckMouseUpOnService(x: number, y: number): dragreceiver | null {
  if (state.targetcell != "") {
    let cell = document.getElementById(state.targetcell);
    if (cell) {
      cell.style.backgroundColor = "white";
    }
    state.targetcell = "";
  }
  for (let a of state.service) {
    if (x < a.right && x > a.left && y < a.bottom && y > a.top) {
      return a;
    }
  }
  return null;
}

export function CheckMouseOutOf(cell: HTMLElement, x: number, y: number): boolean {
  const rect = cell.getBoundingClientRect();
  if (x < rect.right && x > rect.left && y < rect.bottom && y > rect.top) {
    return false;
  }
  return true;
}

export function CheckMouseOverAddress(x: number, y: number): boolean {
  //console.log(x, y);
  let valid = false;
  let target = "";
  for (let a of state.address) {
    //console.log(a.left, a.right);
    if (x < a.right && x > a.left && y < a.bottom && y > a.top) {
      //console.log(a.id);
      valid = true;
      if (a.id != state.targetcell) {
        let cell = document.getElementById(a.id);
        if (cell) {
          cell.style.backgroundColor = "rgba(194, 255, 197, 0.5)";
          //  if (a.id.endsWith("_empty")) {
          //    cell.style.color = "rgba(194, 255, 197, 0.5)";
          //  }
        }
      }
      target = a.id;
      break;
    }
  }
  if (state.targetcell != "" && state.targetcell != target) {
    let cell = document.getElementById(state.targetcell);
    if (cell) {
      cell.style.backgroundColor = "white";
      //  if (state.targetcell.endsWith("_empty")) {
      //    cell.style.color = "white";
      //  }
    }
  }
  state.targetcell = target;
  return valid;
}

export function CheckMouseOverService(x: number, y: number): boolean {
  //console.log(x, y);
  let valid = false;
  let target = "";
  for (let a of state.service) {
    //console.log(a.left, a.right);
    if (x < a.right && x > a.left && y < a.bottom && y > a.top) {
      //console.log(a.id);
      valid = true;
      if (a.id != state.targetcell) {
        let cell = document.getElementById(a.id);
        if (cell) {
          cell.style.backgroundColor = "rgba(194, 255, 197, 0.5)";
          if (a.id.endsWith("_empty")) {
            cell.style.color = "rgba(194, 255, 197, 0.5)";
          }
        }
      }
      target = a.id;
      break;
    }
  }
  if (state.targetcell != "" && state.targetcell != target) {
    let cell = document.getElementById(state.targetcell);
    if (cell) {
      cell.style.backgroundColor = "white";
      if (state.targetcell.endsWith("_empty")) {
        cell.style.color = "white";
      }
    }
  }
  state.targetcell = target;
  return valid;
}
