import { Validator } from "ip-num";
import type { ChainItem, ChainsPanelProps } from "../components/ChainsPanel.tsx";
import type { FilterRule, FilterTableProps } from "../components/FilterTable.tsx";
import type { FloatingChecksProps } from "../components/FloatingCheck";
import type { InterfaceListItem, InterfacesPanelProps } from "../components/InterfacesPanel.tsx";
import { type MouseEvent as MEvent } from "react";
import type { HostsPanelProps } from "../components/HostsPanel.tsx";
import type { HostGroupsPanelProps } from "../components/HostGroupsPanel.tsx";
import type { NetworksPanelProps } from "../components/NetworksPanel.tsx";
import type { CustomRulesPanelProps } from "../components/CustomRulesPanel.tsx";
import { ICMPv4, ICMPv6 } from "./icmp.ts";
import type { ServicesPanelProps } from "../components/ServicesPanel.tsx";
import type { NatRule, NatTableProps } from "../components/NatTable.tsx";
import type { SNatRulesProps } from "../components/SNatRules.tsx";
import type { DNatRulesProps } from "../components/DNatRules.tsx";

export interface CheckStatusLine {
  text: string;
  status: string; // "warning", "error",
}

export interface CheckItem {
  text: string;
  status: string; // "unchecked", "ok", "warning", "error",
  warningtexts: CheckStatusLine[];
}

export const FloatingCheckDragIndex = 10;

interface StateType {
  setfunction: (props: FloatingChecksProps) => void;
  //current: FloatingChecksProps;
  index: number;
}

const initchecks: CheckItem[] = [
  { text: "Check if any interface is listed.", status: "unchecked", warningtexts: [] },
  { text: "Check if interfaces are part of the system.", status: "unchecked", warningtexts: [] },
  { text: "Check if all interfaces in chains are defined.", status: "unchecked", warningtexts: [] },
  { text: "Check if all parts of the filter rules are defined.", status: "unchecked", warningtexts: [] },
  {
    text: "Check if all filter rules have valid IPv4/IPv6 source/destination combinations.",
    status: "unchecked",
    warningtexts: [],
  },
  { text: "Check if all parts of the SNAT rules are defined.", status: "unchecked", warningtexts: [] },
  {
    text: "Check if all SNAT rules have valid IPv4/IPv6 source/destination combinations.",
    status: "unchecked",
    warningtexts: [],
  },
  { text: "Check if all parts of the DNAT rules are defined.", status: "unchecked", warningtexts: [] },
  {
    text: "Check if all DNAT rules have valid IPv4/IPv6 source/destination combinations.",
    status: "unchecked",
    warningtexts: [],
  },
  // NAT TCP/UDP combinations
];

const empty = {
  items: initchecks,
  dragpos: { top: 140, left: 620 },
  onStartDrag: function (_e: MEvent<HTMLDivElement>, _index: number) {},
  onClose: () => {},
  visible: false,
  cursor: "default",
} as FloatingChecksProps;

const state: StateType = {
  setfunction: function (_props: FloatingChecksProps) {},
  //current: { ...empty },
  index: 0,
};

export function InitFloatingChecksState(
  props: FloatingChecksProps,
  setfn: (props: FloatingChecksProps) => void,
  ondragfn: (e: MEvent<HTMLDivElement>, index: number) => void,
  onclosefn: () => void
) {
  state.setfunction = function (props: FloatingChecksProps) {
    setfn({ ...props });
  };
  props.onStartDrag = ondragfn;
  props.onClose = onclosefn;
  state.setfunction(props);
}

export function FloatingChecksDefaultProps(): FloatingChecksProps {
  return empty;
}

function GetIPv4FromHost(refHosts: HostsPanelProps, host: string): string[] {
  let data = refHosts.hosts.get(host);
  if (data !== undefined) {
    return data.ipv4;
  }
  return [];
}

function GetIPv6FromHost(refHosts: HostsPanelProps, host: string): string[] {
  let data = refHosts.hosts.get(host);
  if (data !== undefined) {
    return data.ipv6;
  }
  return [];
}

function CompileIPv4NetList(
  refHosts: HostsPanelProps,
  refHostGroups: HostGroupsPanelProps,
  refNetwork: NetworksPanelProps,
  def: string
): string[] {
  let netlist: string[] = [];
  GetIPv4FromHost(refHosts, def).forEach((ip) => {
    if (!netlist.includes(ip) && Validator.isValidIPv4String(ip)[0]) {
      netlist.push(ip);
    }
  });
  let hosts = refHostGroups.groups.get(def);
  if (hosts !== undefined) {
    hosts.forEach((host) => {
      GetIPv4FromHost(refHosts, host).forEach((ip) => {
        if (!netlist.includes(ip) && Validator.isValidIPv4String(ip)[0]) {
          netlist.push(ip);
        }
      });
    });
  }
  let network = refNetwork.ipv4.get(def);
  if (network !== undefined) {
    netlist.push(network);
  }
  return netlist;
}

function CompileIPv6NetList(
  refHosts: HostsPanelProps,
  refHostGroups: HostGroupsPanelProps,
  refNetwork: NetworksPanelProps,
  def: string
): string[] {
  let netlist: string[] = [];
  GetIPv6FromHost(refHosts, def).forEach((ip) => {
    if (!netlist.includes(ip) && Validator.isValidIPv6String(ip)[0]) {
      netlist.push(ip);
    }
  });
  let hosts = refHostGroups.groups.get(def);
  if (hosts !== undefined) {
    hosts.forEach((host) => {
      GetIPv6FromHost(refHosts, host).forEach((ip) => {
        if (!netlist.includes(ip) && Validator.isValidIPv6String(ip)[0]) {
          netlist.push(ip);
        }
      });
    });
  }
  let network = refNetwork.ipv6.get(def);
  if (network !== undefined) {
    netlist.push(network);
  }
  return netlist;
}

function SetError(props: FloatingChecksProps, text: string) {
  props.items[state.index].status = "error";
  props.items[state.index].warningtexts.push({ text: text, status: "error" });
}

function SetWarning(props: FloatingChecksProps, text: string) {
  if (props.items[state.index].status != "error") {
    props.items[state.index].status = "warning";
  }
  props.items[state.index].warningtexts.push({ text: text, status: "warning" });
}

function SetFinalStatus(props: FloatingChecksProps, ok: boolean) {
  if (ok) {
    props.items[state.index].status = "ok";
  }
  state.setfunction({ ...props });
}

export function RunAllChecks(
  props: FloatingChecksProps,
  interfaces: string[],
  refInterfaces: InterfacesPanelProps,
  refChains: ChainsPanelProps,
  refCustomRules: CustomRulesPanelProps,
  refSNatRules: SNatRulesProps,
  refDNatRules: DNatRulesProps,
  refHosts: HostsPanelProps,
  refHostGroups: HostGroupsPanelProps,
  refNetwork: NetworksPanelProps,
  refServices: ServicesPanelProps
) {
  // reset all checks
  props.items.forEach(function (item: CheckItem) {
    item.warningtexts = [];
    item.status = "unchecked";
  });
  props.visible = true;
  state.setfunction(props);

  state.index = 0;
  CheckInterfaceListed(props, refInterfaces);
  state.index++;
  CheckInterfacesExist(props, interfaces, refInterfaces);
  state.index++;
  CheckInterfacesDefined(props, refInterfaces, refChains);
  state.index++;
  CheckFilterRulesDefined(props, refCustomRules, refHosts, refHostGroups, refNetwork, refServices);
  state.index++;
  CheckFilterRulesIp46(props, refCustomRules, refHosts, refHostGroups, refNetwork);
  state.index++;
  CheckSNatRulesDefined(props, refSNatRules, refHosts, refHostGroups, refNetwork, refServices);
  state.index++;
  CheckSNATRulesIp46(props, refSNatRules, refHosts, refHostGroups, refNetwork);
  state.index++;
  CheckDNatRulesDefined(props, refDNatRules, refHosts, refHostGroups, refNetwork, refServices);
  state.index++;
  CheckDNATRulesIp46(props, refDNatRules, refHosts, refHostGroups, refNetwork);
}

function CheckInterfaceListed(props: FloatingChecksProps, refInterfaces: InterfacesPanelProps) {
  let all_ok = true;
  // Check if any interface is listed
  if (refInterfaces.interfacesList.size == 0) {
    all_ok = false;
    SetError(props, "No interfaces defined.");
  }
  SetFinalStatus(props, all_ok);
}

function CheckInterfacesExist(props: FloatingChecksProps, interfaces: string[], refInterfaces: InterfacesPanelProps) {
  // Check if defined interfaces exist
  let allfound = true;
  refInterfaces.interfacesList.forEach((value: InterfaceListItem, _key: string) => {
    if (!interfaces.includes(value.systemname)) {
      allfound = false;
      SetError(props, "Interface " + value.systemname + " not found.");
    }
  });
  SetFinalStatus(props, allfound);
}

function CheckInterfacesDefined(
  props: FloatingChecksProps,
  refInterfaces: InterfacesPanelProps,
  refChains: ChainsPanelProps
) {
  // Check if all interfaces in chains are defined.
  let alldefined = true;
  refChains.chainsList.forEach((chain: ChainItem, key: string) => {
    if (chain.iface_in != "-" && !refInterfaces.interfacesList.has(chain.iface_in)) {
      alldefined = false;
      SetError(props, "Chain " + key + " uses undefined interface " + chain.iface_in + ".");
    }
    if (chain.iface_out != "-" && !refInterfaces.interfacesList.has(chain.iface_out)) {
      alldefined = false;
      SetError(props, "Chain " + key + " uses undefined interface " + chain.iface_out + ".");
    }
  });
  SetFinalStatus(props, alldefined);
}

function CheckFilterRulesDefined(
  props: FloatingChecksProps,
  refCustomRules: CustomRulesPanelProps,
  refHosts: HostsPanelProps,
  refHostGroups: HostGroupsPanelProps,
  refNetwork: NetworksPanelProps,
  refServices: ServicesPanelProps
) {
  // Check if all parts of the filter rules are defined
  let allrulesok = true;
  refCustomRules.rules.forEach((table: FilterTableProps, key: string) => {
    if (!table.deleted) {
      table.rules.forEach((rule: FilterRule, index: number) => {
        if (rule.active) {
          rule.source.map((def, _index2) => {
            let ipv4s = CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def);
            let ipv6s = CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def);
            if (ipv4s.length == 0 && ipv6s.length == 0) {
              allrulesok = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has undefined or empty source definition named " +
                  def +
                  "."
              );
            }
          });

          rule.destination.map((def, _index2) => {
            let ipv4d = CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def);
            let ipv6d = CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def);
            if (ipv4d.length == 0 && ipv6d.length == 0) {
              allrulesok = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has an undefined or empty destination definition named " +
                  def +
                  "."
              );
            }
          });
          rule.sourceservice.map((def, _index2) => {
            if (!refServices.portlist.has(def) && !ICMPv4.includes(def) && !ICMPv6.includes(def)) {
              allrulesok = false;
              SetError(
                props,
                "Rule " + (index + 1) + " in chain " + key + " has an undefined source service named " + def + "."
              );
            }
          });
          rule.destinationservice.map((def, _index2) => {
            if (!refServices.portlist.has(def) && !ICMPv4.includes(def) && !ICMPv6.includes(def)) {
              allrulesok = false;
              SetError(
                props,
                "Rule " + (index + 1) + " in chain " + key + " has an undefined destination service named " + def + "."
              );
            }
          });
        }
      });
    }
  });
  SetFinalStatus(props, allrulesok);
}

function CheckFilterRulesIp46(
  props: FloatingChecksProps,
  refCustomRules: CustomRulesPanelProps,
  refHosts: HostsPanelProps,
  refHostGroups: HostGroupsPanelProps,
  refNetwork: NetworksPanelProps
) {
  // Check if all filter rules have valid IPv4/IPv6 source/destination combinations
  let rules_ip46_valid = true;
  refCustomRules.rules.forEach((table: FilterTableProps, key: string) => {
    if (!table.deleted) {
      table.rules.forEach((rule: FilterRule, index: number) => {
        if (rule.active) {
          let rule_ipv4s = [] as string[];
          let rule_ipv6s = [] as string[];
          let rule_ipv4d = [] as string[];
          let rule_ipv6d = [] as string[];
          rule.source.map((def, _index2) => {
            rule_ipv4s = rule_ipv4s.concat(CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def));
            rule_ipv6s = rule_ipv6s.concat(CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def));
          });
          rule.destination.map((def, _index2) => {
            rule_ipv4d = rule_ipv4d.concat(CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def));
            rule_ipv6d = rule_ipv6d.concat(CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def));
          });

          if (rule_ipv4s.length > 0 && rule_ipv6s.length == 0 && rule_ipv6d.length > 0 && rule_ipv4d.length == 0) {
            // ipv4 source and ipv6 destination
            rules_ip46_valid = false;
            SetError(
              props,
              "Rule " +
                (index + 1) +
                " in chain " +
                key +
                " has IPv4 source addresses but only IPv6 destination addresses."
            );
          }
          if (rule_ipv6s.length > 0 && rule_ipv4s.length == 0 && rule_ipv4d.length > 0 && rule_ipv6d.length == 0) {
            // ipv6 source and ipv4 destination
            rules_ip46_valid = false;
            SetError(
              props,
              "Rule " +
                (index + 1) +
                " in chain " +
                key +
                " has IPv6 source addresses but only IPv4 destination addresses."
            );
          }
        }
      });
    }
  });
  SetFinalStatus(props, rules_ip46_valid);
}

function CheckSNatRulesDefined(
  props: FloatingChecksProps,
  refSNatRules: SNatRulesProps,
  refHosts: HostsPanelProps,
  refHostGroups: HostGroupsPanelProps,
  refNetwork: NetworksPanelProps,
  refServices: ServicesPanelProps
) {
  // Check if all parts of the snat rules are defined
  let allsnatrulesok = true;
  refSNatRules.rules.forEach((table: NatTableProps, key: string) => {
    if (!table.deleted) {
      table.rules.forEach((rule: NatRule, index: number) => {
        if (rule.active) {
          rule.source.map((def, _index2) => {
            let ipv4s = CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def);
            let ipv6s = CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def);
            if (ipv4s.length == 0 && ipv6s.length == 0) {
              allsnatrulesok = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in SNAT chain " +
                  key +
                  " has undefined or empty source definition named " +
                  def +
                  "."
              );
            }
          });

          rule.destination.map((def, _index2) => {
            let ipv4d = CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def);
            let ipv6d = CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def);
            if (ipv4d.length == 0 && ipv6d.length == 0) {
              allsnatrulesok = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in SNAT chain " +
                  key +
                  " has an undefined or empty destination definition named " +
                  def +
                  "."
              );
            }
          });
          let ipv4d = CompileIPv4NetList(refHosts, refHostGroups, refNetwork, rule.translated);
          let ipv6d = CompileIPv6NetList(refHosts, refHostGroups, refNetwork, rule.translated);
          if (ipv4d.length == 0 && ipv6d.length == 0) {
            allsnatrulesok = false;
            SetError(
              props,
              "Rule " +
                (index + 1) +
                " in SNAT chain " +
                key +
                " has an undefined or empty translated source definition named " +
                rule.translated +
                "."
            );
          }
          rule.sourceservice.map((def, _index2) => {
            if (!refServices.portlist.has(def)) {
              allsnatrulesok = false;
              SetError(
                props,
                "Rule " + (index + 1) + " in SNAT chain " + key + " has an undefined source service named " + def + "."
              );
            }
          });
          rule.destinationservice.map((def, _index2) => {
            if (!refServices.portlist.has(def)) {
              allsnatrulesok = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in SNAT chain " +
                  key +
                  " has an undefined destination service named " +
                  def +
                  "."
              );
            }
          });
          if (rule.translatedservice != "" && !refServices.portlist.has(rule.translatedservice)) {
            allsnatrulesok = false;
            SetError(
              props,
              "Rule " +
                (index + 1) +
                " in SNAT chain " +
                key +
                " has an undefined translated service named " +
                rule.translatedservice +
                "."
            );
          }
        }
      });
    }
  });
  SetFinalStatus(props, allsnatrulesok);
}

function CheckSNATRulesIp46(
  props: FloatingChecksProps,
  refSNatRules: SNatRulesProps,
  refHosts: HostsPanelProps,
  refHostGroups: HostGroupsPanelProps,
  refNetwork: NetworksPanelProps
) {
  // Check if all filter rules have valid IPv4/IPv6 source/destination combinations
  let rules_ip46_valid = true;
  refSNatRules.rules.forEach((table: NatTableProps, key: string) => {
    if (!table.deleted) {
      table.rules.forEach((rule: NatRule, index: number) => {
        if (rule.active) {
          let rule_ipv4s = [] as string[];
          let rule_ipv6s = [] as string[];
          let rule_ipv4d = [] as string[];
          let rule_ipv6d = [] as string[];
          rule.source.map((def, _index2) => {
            rule_ipv4s = rule_ipv4s.concat(CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def));
            rule_ipv6s = rule_ipv6s.concat(CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def));
          });
          rule.destination.map((def, _index2) => {
            rule_ipv4d = rule_ipv4d.concat(CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def));
            rule_ipv6d = rule_ipv6d.concat(CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def));
          });
          let rule_ipv4t = CompileIPv4NetList(refHosts, refHostGroups, refNetwork, rule.translated);
          let rule_ipv6t = CompileIPv6NetList(refHosts, refHostGroups, refNetwork, rule.translated);
          if (rule_ipv4t.length == 0 && rule_ipv6t.length == 0) {
            rules_ip46_valid = false;
            SetError(props, "Rule " + (index + 1) + " in chain " + key + " has no translated addresses.");
          }
          if (rule_ipv4t.length > 1) {
            rules_ip46_valid = false;
            SetError(
              props,
              "Rule " +
                (index + 1) +
                " in chain " +
                key +
                " has multiple translated IPv4 addresses. Only a single address per type is allowed."
            );
          }
          if (rule_ipv6t.length > 1) {
            rules_ip46_valid = false;
            SetError(
              props,
              "Rule " +
                (index + 1) +
                " in chain " +
                key +
                " has multiple translated IPv6 addresses. Only a single address per type is allowed."
            );
          }
          if (rule_ipv4s.length > 0 && rule_ipv6s.length == 0) {
            // pure ipv4 source
            if (rule_ipv6d.length > 0 && rule_ipv4d.length == 0) {
              // pure ipv6 destination
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv4 source addresses but only IPv6 destination addresses."
              );
            }
            if (rule_ipv4t.length == 0) {
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv4 source addresses but no translated IPv4 address."
              );
            }
          }
          if (rule_ipv6s.length > 0 && rule_ipv4s.length == 0) {
            // pure ipv6 source
            if (rule_ipv4d.length > 0 && rule_ipv6d.length == 0) {
              // pure ipv4 destination
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv6 source addresses but only IPv4 destination addresses."
              );
            }
            if (rule_ipv6t.length == 0) {
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv6 source addresses but no translated IPv6 address."
              );
            }
          }
          if (rule_ipv4d.length > 0 && rule_ipv6d.length == 0) {
            // pure ipv4 destination
            if (rule_ipv4t.length == 0) {
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv4 destination addresses but no translated IPv4 address."
              );
            }
          }
          if (rule_ipv6d.length > 0 && rule_ipv4d.length == 0) {
            // pure ipv6 destination
            if (rule_ipv6t.length == 0) {
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv6 destination addresses but no translated IPv6 address."
              );
            }
          }

          if (rule_ipv4s.length > 0 && rule_ipv4t.length == 0) {
            rules_ip46_valid = false;
            SetWarning(
              props,
              "Rule " + (index + 1) + " in chain " + key + " has IPv4 source addresses but no translated IPv4 address."
            );
          }

          if (rule_ipv6s.length > 0 && rule_ipv6t.length == 0) {
            rules_ip46_valid = false;
            SetWarning(
              props,
              "Rule " + (index + 1) + " in chain " + key + " has IPv6 source addresses but no translated IPv6 address."
            );
          }

          if (rule_ipv4d.length > 0 && rule_ipv4t.length == 0) {
            rules_ip46_valid = false;
            SetWarning(
              props,
              "Rule " +
                (index + 1) +
                " in chain " +
                key +
                " has IPv4 destination addresses but no translated IPv4 address."
            );
          }

          if (rule_ipv6d.length > 0 && rule_ipv6t.length == 0) {
            rules_ip46_valid = false;
            SetWarning(
              props,
              "Rule " +
                (index + 1) +
                " in chain " +
                key +
                " has IPv6 Destination addresses but no translated IPv6 address."
            );
          }
        }
      });
    }
  });
  SetFinalStatus(props, rules_ip46_valid);
}

function CheckDNatRulesDefined(
  props: FloatingChecksProps,
  refDNatRules: SNatRulesProps,
  refHosts: HostsPanelProps,
  refHostGroups: HostGroupsPanelProps,
  refNetwork: NetworksPanelProps,
  refServices: ServicesPanelProps
) {
  // Check if all parts of the dnat rules are defined
  let allsnatrulesok = true;
  refDNatRules.rules.forEach((table: NatTableProps, key: string) => {
    if (!table.deleted) {
      table.rules.forEach((rule: NatRule, index: number) => {
        if (rule.active) {
          rule.source.map((def, _index2) => {
            let ipv4s = CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def);
            let ipv6s = CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def);
            if (ipv4s.length == 0 && ipv6s.length == 0) {
              allsnatrulesok = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in DNAT chain " +
                  key +
                  " has undefined or empty source definition named " +
                  def +
                  "."
              );
            }
          });

          rule.destination.map((def, _index2) => {
            let ipv4d = CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def);
            let ipv6d = CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def);
            if (ipv4d.length == 0 && ipv6d.length == 0) {
              allsnatrulesok = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in DNAT chain " +
                  key +
                  " has an undefined or empty destination definition named " +
                  def +
                  "."
              );
            }
          });
          let ipv4d = CompileIPv4NetList(refHosts, refHostGroups, refNetwork, rule.translated);
          let ipv6d = CompileIPv6NetList(refHosts, refHostGroups, refNetwork, rule.translated);
          if (ipv4d.length == 0 && ipv6d.length == 0) {
            allsnatrulesok = false;
            SetError(
              props,
              "Rule " +
                (index + 1) +
                " in DNAT chain " +
                key +
                " has an undefined or empty translated destination definition named " +
                rule.translated +
                "."
            );
          }

          rule.sourceservice.map((def, _index2) => {
            if (!refServices.portlist.has(def)) {
              allsnatrulesok = false;
              SetError(
                props,
                "Rule " + (index + 1) + " in DNAT chain " + key + " has an undefined source service named " + def + "."
              );
            }
          });
          rule.destinationservice.map((def, _index2) => {
            if (!refServices.portlist.has(def)) {
              allsnatrulesok = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in DNAT chain " +
                  key +
                  " has an undefined destination service named " +
                  def +
                  "."
              );
            }
          });

          if (rule.translatedservice != "" && !refServices.portlist.has(rule.translatedservice)) {
            allsnatrulesok = false;
            SetError(
              props,
              "Rule " +
                (index + 1) +
                " in SNAT chain " +
                key +
                " has an undefined translated service named " +
                rule.translatedservice +
                "."
            );
          }
        }
      });
    }
  });
  SetFinalStatus(props, allsnatrulesok);
}

function CheckDNATRulesIp46(
  props: FloatingChecksProps,
  refDNatRules: DNatRulesProps,
  refHosts: HostsPanelProps,
  refHostGroups: HostGroupsPanelProps,
  refNetwork: NetworksPanelProps
) {
  // Check if all filter rules have valid IPv4/IPv6 source/destination combinations
  let rules_ip46_valid = true;
  refDNatRules.rules.forEach((table: NatTableProps, key: string) => {
    if (!table.deleted) {
      table.rules.forEach((rule: NatRule, index: number) => {
        if (rule.active) {
          let rule_ipv4s = [] as string[];
          let rule_ipv6s = [] as string[];
          let rule_ipv4d = [] as string[];
          let rule_ipv6d = [] as string[];
          rule.source.map((def, _index2) => {
            rule_ipv4s = rule_ipv4s.concat(CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def));
            rule_ipv6s = rule_ipv6s.concat(CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def));
          });
          rule.destination.map((def, _index2) => {
            rule_ipv4d = rule_ipv4d.concat(CompileIPv4NetList(refHosts, refHostGroups, refNetwork, def));
            rule_ipv6d = rule_ipv6d.concat(CompileIPv6NetList(refHosts, refHostGroups, refNetwork, def));
          });
          let rule_ipv4t = CompileIPv4NetList(refHosts, refHostGroups, refNetwork, rule.translated);
          let rule_ipv6t = CompileIPv6NetList(refHosts, refHostGroups, refNetwork, rule.translated);
          if (rule_ipv4t.length == 0 && rule_ipv6t.length == 0) {
            rules_ip46_valid = false;
            SetError(props, "Rule " + (index + 1) + " in chain " + key + " has no translated addresses.");
          }
          if (rule_ipv4t.length > 1) {
            rules_ip46_valid = false;
            SetError(
              props,
              "Rule " +
                (index + 1) +
                " in chain " +
                key +
                " has multiple translated IPv4 addresses. Only a single address per type is allowed."
            );
          }
          if (rule_ipv6t.length > 1) {
            rules_ip46_valid = false;
            SetError(
              props,
              "Rule " +
                (index + 1) +
                " in chain " +
                key +
                " has multiple translated IPv6 addresses. Only a single address per type is allowed."
            );
          }
          if (rule_ipv4s.length > 0 && rule_ipv6s.length == 0) {
            // pure ipv4 source
            if (rule_ipv6d.length > 0 && rule_ipv4d.length == 0) {
              // pure ipv6 destination
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv4 source addresses but only IPv6 destination addresses."
              );
            }
            if (rule_ipv4t.length == 0) {
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv4 source addresses but no translated IPv4 address."
              );
            }
          }
          if (rule_ipv6s.length > 0 && rule_ipv4s.length == 0) {
            // pure ipv6 source
            if (rule_ipv4d.length > 0 && rule_ipv6d.length == 0) {
              // pure ipv4 destination
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv6 source addresses but only IPv4 destination addresses."
              );
            }
            if (rule_ipv6t.length == 0) {
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv6 source addresses but no translated IPv6 address."
              );
            }
          }
          if (rule_ipv4d.length > 0 && rule_ipv6d.length == 0) {
            // pure ipv4 destination
            if (rule_ipv4t.length == 0) {
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv4 destination addresses but no translated IPv4 address."
              );
            }
          }
          if (rule_ipv6d.length > 0 && rule_ipv4d.length == 0) {
            // pure ipv6 destination
            if (rule_ipv6t.length == 0) {
              rules_ip46_valid = false;
              SetError(
                props,
                "Rule " +
                  (index + 1) +
                  " in chain " +
                  key +
                  " has only IPv6 destination addresses but no translated IPv6 address."
              );
            }
          }

          if (rule_ipv4s.length > 0 && rule_ipv4t.length == 0) {
            rules_ip46_valid = false;
            SetWarning(
              props,
              "Rule " + (index + 1) + " in chain " + key + " has IPv4 source addresses but no translated IPv4 address."
            );
          }

          if (rule_ipv6s.length > 0 && rule_ipv6t.length == 0) {
            rules_ip46_valid = false;
            SetWarning(
              props,
              "Rule " + (index + 1) + " in chain " + key + " has IPv6 source addresses but no translated IPv6 address."
            );
          }

          if (rule_ipv4d.length > 0 && rule_ipv4t.length == 0) {
            rules_ip46_valid = false;
            SetWarning(
              props,
              "Rule " +
                (index + 1) +
                " in chain " +
                key +
                " has IPv4 destination addresses but no translated IPv4 address."
            );
          }

          if (rule_ipv6d.length > 0 && rule_ipv6t.length == 0) {
            rules_ip46_valid = false;
            SetWarning(
              props,
              "Rule " +
                (index + 1) +
                " in chain " +
                key +
                " has IPv6 Destination addresses but no translated IPv6 address."
            );
          }
        }
      });
    }
  });
  SetFinalStatus(props, rules_ip46_valid);
}
