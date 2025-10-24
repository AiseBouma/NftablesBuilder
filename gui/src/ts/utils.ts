import { TableCell } from "@mui/material";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { IPv4, IPv4CidrRange, IPv6, IPv6CidrRange } from "ip-num";

export function InsertIntoSortedMap<T>(map: Map<string, T>, key: string, entry: T): Map<string, T> {
  let newmap = new Map<string, T>();
  for (const k of map.keys()) {
    if (key.toUpperCase() < k.toUpperCase()) {
      newmap.set(key, entry);
    }
    let data = map.get(k);
    if (data !== undefined) {
      newmap.set(k, data);
    }
  }
  if (newmap.size == map.size) {
    // append at the end
    newmap.set(key, entry);
  }
  return newmap;
}

// will not overwite existing entries
export function InsertIntoMap<T>(map: Map<string, T>, key: string, entry: T): void {
  if (!map.has(key)) {
    map.set(key, entry);
  }
}

export function isLoopBack(ip: string): boolean {
  if (ip.includes(":")) {
    // IPv6 check
    let ipv6Range = IPv6CidrRange.fromCidr("::1/128");
    return ipv6Range.contains(new IPv6(ip));
  } else {
    let ipv4Range = IPv4CidrRange.fromCidr("127.0.0.0/8");
    return ipv4Range.contains(new IPv4(ip));
  }
}

export function CaseInsensitiveSort(str_arr: string[]): string[] {
  return str_arr.sort(function (a, b) {
    const upperA = a.toUpperCase();
    const upperB = b.toUpperCase();

    if (upperA < upperB) return -1;
    if (upperA > upperB) return 1;
    return 0;
  });
}

export function hexEncode(str: string): string {
  var hex, i;
  var result = "";
  for (i = 0; i < str.length; i++) {
    hex = str.charCodeAt(i).toString(16);
    result += ("000" + hex).slice(-4);
  }
  return result;
}

export function hexDecode(str: string): string {
  var j;
  var hexes = str.match(/.{1,4}/g) || [];
  var back = "";
  for (j = 0; j < hexes.length; j++) {
    back += String.fromCharCode(parseInt(hexes[j], 16));
  }
  return back;
}

export const TextFieldStyled = styled(TextField)(
  // @ts-ignore
  ({ theme }) => `
      .MuiInput-underline:before {
        border-bottom: none;
      }
      .MuiInput-underline:after {
        border-bottom: none;
      }
      .css-5h82ro-MuiInputBase-root-MuiInput-root:hover:not(.Mui-disabled, .Mui-error):before {
        border-bottom: none;
      }
      .css-pcashz-MuiInputBase-root-MuiInput-root:hover:not(.Mui-disabled, .Mui-error):before {
        border-bottom: none;
      }
      .css-c4hhgn-MuiSvgIcon-root-MuiNativeSelect-root-MuiSelect-icon {
        color: var(--mui-palette-primary-main);
      }
  `
);

export const TableCellEmptyRow = styled(TableCell)(
  // @ts-ignore
  ({ theme }) => `
  .css-6melek-MuiTableCell-root {
    color: rgba(0, 0, 0, 0.12);
  }
  .css-7ugzcx-MuiTableCell-root {
    color: rgba(0, 0, 0, 0.12);
  }
  .css-q6wj9g-MuiTableCell-root {
    color: rgba(0, 0, 0, 0.12);
  }
  .css-1nob59a-MuiTableCell-root {
    color: rgba(0, 0, 0, 0.12);
  }
  .css-vlagye-MuiTableCell-root {
    color: rgba(0, 0, 0, 0.12);
  }
  .css-4j6czu-MuiTableCell-root {
    color: rgba(0, 0, 0, 0.12);
  }
  `
);
