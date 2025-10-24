import "./App.css";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import SaveasIcon from "@mui/icons-material/SaveAs";
import RuleIcon from "@mui/icons-material/Rule";
import InstallIcon from "@mui/icons-material/InstallDesktop";
import UploadIcon from "@mui/icons-material/Upload";
import SettingsIcon from "@mui/icons-material/Settings";
import { type MouseEvent as MEvent } from "react";
import ToolBarButton from "./components/ToolBarButton";
import TitleBar from "./components/TitleBar";
import CustomTabPanel from "./components/CustomTabPanel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import TextDialog from "./components/TextDialog";
import PortDialog, { type PortDialogProps } from "./components/PortDialog";
import LoginDialog, { type LoginDialogProps } from "./components/LoginDialog";
import SettingsDialog, { type SettingsDialogProps } from "./components/SettingsDialog";
import AddUserDialog, { type AddUserDialogProps } from "./components/AddUserDialog";
import ListSelectionDialog, { type ListSelectionDialogProps } from "./components/ListSelectionDialog";
import ConfigurationsPanel from "./components/ConfigurationsPanel";
import ConfirmDialog from "./components/ConfirmDialog";
import type { ConfirmDialogProps } from "./components/ConfirmDialog";
import axios from "axios";
import AlertBar, { type AlertBarProps } from "./components/AlertBar";
import Loading from "./components/Loading";
import HostsPanel, { type HostsPanelProps, type HostAdresses } from "./components/HostsPanel";
import NetworksPanel, { type NetworksPanelProps } from "./components/NetworksPanel";
import ManualFilter from "./components/ManualFilter.tsx";
import HostGroupsPanel, { type HostGroupsPanelProps } from "./components/HostGroupsPanel";
import ServicesPanel, { type ServiceDef, type ServicesPanelProps } from "./components/ServicesPanel";
import InterfacesPanel, { type InterfacesPanelProps, type InterfaceListItem } from "./components/InterfacesPanel";
import CustomRulesPanel, { type CustomRulesPanelProps } from "./components/CustomRulesPanel";
import DNatRules, { type DNatRulesProps } from "./components/DNatRules";
import SNatRules, { type SNatRulesProps } from "./components/SNatRules";
import { type FilterRule, type FilterTableProps } from "./components/FilterTable";
import ChainsPanel, { type ChainsPanelProps, type ChainItem } from "./components/ChainsPanel";
import LogPanel, { type LogPanelProps } from "./components/LogPanel";
import DefaultsPanel, { type DefaultsPanelProps } from "./components/DefaultsPanel";
import useState from "react-usestateref";
import { useEffect } from "react";
import { Validator } from "ip-num";
import { InsertIntoSortedMap, isLoopBack, CaseInsensitiveSort, hexEncode, hexDecode } from "./ts/utils.ts";
import {
  InitTextDialogState,
  TextDialogDefaultProps,
  OpenTextDialog,
  OpenMultiLineTextDialog,
  TextDialogGetTitle,
  TextDialogGetValue,
  TextDialogSetWarning,
  CloseTextDialog,
} from "./ts/textdialog.ts";
import { ThemeProvider, createTheme, styled } from "@mui/material/styles";
import FloatingValue, { type FloatingValueProps } from "./components/FloatingValue.tsx";
import {
  CheckMouseOutOf,
  CheckMouseOverAddress,
  CheckMouseOverService,
  CheckMouseUpOnAddress,
  CheckMouseUpOnService,
  SetNatReceiverPositions,
  SetReceiverPositions,
  type DragPosition,
  type dragreceiver,
} from "./ts/dragreceiving.ts";
import { ICMPv4, ICMPv6 } from "./ts/icmp.ts";
import type { NatRule, NatTableProps } from "./components/NatTable.tsx";
import FloatingChecks from "./components/FloatingCheck.tsx";
import FloatingInstall, { type FloatingInstallProps, FloatingInstallDragIndex } from "./components/FloatingInstall.tsx";
import {
  FloatingCheckDragIndex,
  FloatingChecksDefaultProps,
  InitFloatingChecksState,
  RunAllChecks,
} from "./ts/checks.ts";
import Button from "@mui/material/Button";

interface initdragpositions {
  startmousex: number;
  startmousey: number;
  startdivx: number;
  startdivy: number;
}

interface User {
  username: string;
  password: string;
  secret: string;
}

const theme = createTheme({ cssVariables: true });

const URLServer = "";
let has_run_at_start = false;
let logout_timer: number = -1;

function App() {
  interface Configuration {
    name: string;
    json: string;
  }

  const defaultportlist = new Map<string, ServiceDef>([
    ["DNS", { port: 53, protocol: "TCP/UDP", default: true }],
    ["HTTP", { port: 80, protocol: "TCP/UDP", default: true }],
    ["HTTPS", { port: 443, protocol: "TCP/UDP", default: true }],
    ["SMTP", { port: 25, protocol: "TCP", default: true }],
    ["SSH", { port: 22, protocol: "TCP", default: true }],
  ]);
  const observer = new MutationObserver(mutationCallback);

  const [badgeOnSave, setbadgeOnSave] = useState(false);
  const [activeTab, setActiveTab, refActiveTab] = useState(0);
  const [activeTab2, setActiveTab2, _refActiveTab2] = useState(0);
  const [activeTab3, setActiveTab3, refActiveTab3] = useState(0);
  const [activeTab4, setActiveTab4, refActiveTab4] = useState(0);
  const [configName, setConfigName, refConfigName] = useState("[Untitled]");
  const [currentUser, setCurrentUser, _refCurrentUser] = useState("");
  const [configs, setConfigs, refConfigs] = useState([] as string[]);
  const [confirmDialog, setConfirmDialog] = useState({} as ConfirmDialogProps);
  const [textDialog, setTextDialog] = useState(TextDialogDefaultProps());
  const [portDialog, setPortDialog, refPortDialog] = useState({
    open: false,
    title: "",
    value: "",
    protocol: "TCP",
    warning: "",
    onChange: handleOnChangePortDialog,
    onProtocolChange: handleOnChangeProtocol,
    onOK: () => {},
    onCancel: closePortDialog,
  } as PortDialogProps);
  const [loginDialog, setLoginDialog, refLoginDialog] = useState({
    open: false,
    warning: "",
    check: handleLoginCheck,
  } as LoginDialogProps);
  const [addUserDialog, setAddUserDialog, refAddUserDialog] = useState({
    open: false,
    firstUser: false,
    addUser: handleAddUser,
    onClose: closeAddUserDialog,
  } as AddUserDialogProps);
  const [settingsDialog, setSettingsDialog, refSettingsDialog] = useState({
    open: false,
    users: [] as string[],
    addUser: function () {
      FetchData(URLServer + "newtotpsecret", NewTotpCallback);
      refAddUserDialog.current.open = true;
      refAddUserDialog.current.firstUser = false;
      setAddUserDialog({ ...refAddUserDialog.current });
    },
    deleteUser: deleteUser,
    onClose: function () {
      refSettingsDialog.current.open = false;
      setSettingsDialog({ ...refSettingsDialog.current });
    },
  } as SettingsDialogProps);
  const [listSelectionDialog, setListSelectionDialog, refListSelectionDialog] = useState({
    open: false,
    title: "",
    text_unselected: "",
    text_selected: "",
    unselected: [],
    selected: [],
    onSelect: handleListSelect,
    onDeselect: handleListDeselect,
    onOK: () => {},
    onCancel: CloseListSelectionDialog,
  } as ListSelectionDialogProps);
  const [alertBar, setAlertBar] = useState({} as AlertBarProps);
  const [loading, setLoading] = useState(false);
  const [interfaces, setInterfaces, refInterfaces] = useState({
    interfacesList: new Map<string, InterfaceListItem>(),
    onDetect: ReloadInterfaces,
    onNameChange: function (name: string) {
      OpenTextDialog(name, "Enter the new name of the interface.", name, HandleNewInterfaceNameOK);
    },
  } as InterfacesPanelProps);

  const [chains, setChains, refChains] = useState({
    chainsList: new Map<string, ChainItem>(),
    onGenerate: GenerateChains,
    onDelete: HandleDeleteChain,
    onChange: HandleChangeChain,
    onToggleFilter: HandleToggleFilter,
    onToggleSnat: HandleToggleSnat,
    onToggleDnat: HandleToggleDnat,
  } as ChainsPanelProps);
  const [logging, setLogging, refLogging] = useState({
    loggingtype: "counter",
    onChange: HandleChangeLogging,
  } as LogPanelProps);
  const [defaults, setDefaults, refDefaults] = useState({
    inactiveList: [],
    onChange: HandleChangeDefaults,
  } as DefaultsPanelProps);
  const [hosts, setHosts, refHosts] = useState({
    hosts: new Map<string, HostAdresses>(),
    onAdd: function () {
      OpenTextDialog("New Host", "Enter the name of the host.", "", HandleAddHostOK);
    },
    onEdit: function (hostname: string) {
      OpenTextDialog(hostname, "Enter the new name of the host.", hostname, EditHostnameOK);
    },
    onDelete: handleDeleteHost,
    onLookup: handleLookupHost,
    onEditIPv4: HandleEditIPV4,
    onEditIPv6: HandleEditIPV6,
  } as HostsPanelProps);
  const [services, setServices, refServices] = useState({
    portlist: defaultportlist,
    onAdd: function () {
      OpenTextDialog("New Service", "Enter the name of the service.", "", HandleAddServiceOK);
    },
    onEdit: HandleEditServicename,
    onDelete: handleDeleteService,
    onEditPort: HandleEditService,
  } as ServicesPanelProps);
  const [hostgroups, setHostGroups, refHostGroups] = useState({
    groups: new Map<string, string[]>(),
    onAdd: function () {
      OpenTextDialog("New Host Group", "Enter the name of the host group.", "", HandleAddHostGroupOK);
    },
    onEdit: HandleEditHostGroupname,
    onDelete: handleDeleteHostGroup,
    onUpdate: handleUpdateHostGroup,
  } as HostGroupsPanelProps);
  const [manualFilter, setManualFilter, refManualFilter] = useState({
    pre: "",
    post: "",
    onChangePre: function (text: string) {
      refManualFilter.current.pre = text;
      setManualFilter({ ...refManualFilter.current });
      setbadgeOnSave(true);
    },
    onChangePost: function (text: string) {
      refManualFilter.current.post = text;
      setManualFilter({ ...refManualFilter.current });
      setbadgeOnSave(true);
    },
  });
  const [networks, setNetworks, refNetwork] = useState({
    ipv4: new Map<string, string>(),
    ipv6: new Map<string, string>(),
    onAddIpv4: function () {
      OpenTextDialog("New IPv4 network", "Enter name of network", "", HandleAddIPv4NetworkNameOK);
    },
    onEditIPv4Name: function (name: string) {
      OpenTextDialog(name, "Enter the new name of the network.", name, EditIPv4NetworkNameOK);
    },
    onEditIPv4: HandleEditIPv4Network,
    onDeleteIPv4: HandleDeleteIPv4Network,
    onAddIpv6: function () {
      OpenTextDialog("New IPv6 network", "Enter name of network", "", HandleAddIPv6NetworkNameOK);
    },
    onEditIPv6Name: function (name: string) {
      OpenTextDialog(name, "Enter the new name of the network.", name, EditIPv6NetworkNameOK);
    },
    onEditIPv6: HandleEditIPv6Network,
    onDeleteIPv6: HandleDeleteIPv6Network,
  } as NetworksPanelProps);

  const [_dragInitPos, setDragInitPos, refInitPos] = useState({} as initdragpositions);
  // dragIndex: -3 = no drag, -2 = drag value, -1 = drag value out of table, 0- filter defs/snat defs/dnat defs/checks/install
  const [_dragIndex, setDragIndex, refDragIndex] = useState(-3);
  //  const [draggedValue, setDraggedValue] = useState({ visible: false, type: "", value: "" } as DraggedValue);
  const [_customrules, setCustomRules, refCustomRules] = useState({
    rules: new Map<string, FilterTableProps>(),
    active: [],
    dragpos: [
      { top: 300, left: 1000 },
      { top: 340, left: 1040 },
      { top: 380, left: 1080 },
      { top: 420, left: 1120 },
      { top: 460, left: 1160 },
      { top: 500, left: 1200 },
    ],
    hosts: [],
    hostgroups: [],
    networks: [],
    services: [],
    cursor: "default",
    observer: observer,
    onStartDragList: onStartDragList,
    onStartDragValue: onStartDragValue,
    onHideShow: HideShowChain,
    onError: AlertError,
  } as CustomRulesPanelProps);
  const [_dNatRules, setDNatRules, refDNatRules] = useState({
    rules: new Map<string, NatTableProps>(),
    active: [],
    dragpos: [
      { top: 300, left: 1000 },
      { top: 340, left: 1040 },
      { top: 380, left: 1080 },
      { top: 420, left: 1120 },
    ],
    hosts: [],
    hostgroups: [],
    networks: [],
    services: [],
    cursor: "default",
    observer: observer,
    onStartDragList: onStartDragList,
    onStartDragValue: onStartDragValue,
    onHideShow: HideShowDNATChain,
    onError: AlertError,
  } as DNatRulesProps);
  const [_sNatRules, setSNatRules, refSNatRules] = useState({
    active: [],
    rules: new Map<string, NatTableProps>(),
    dragpos: [
      { top: 300, left: 1000 },
      { top: 340, left: 1040 },
      { top: 380, left: 1080 },
      { top: 420, left: 1120 },
    ],
    hosts: [],
    hostgroups: [],
    networks: [],
    services: [],
    cursor: "default",
    observer: observer,
    onStartDragList: onStartDragList,
    onStartDragValue: onStartDragValue,
    onHideShow: HideShowSNATChain,
    onError: AlertError,
  } as SNatRulesProps);
  const [floatingValue, setFloatingValue, refFloatingValue] = useState({
    visible: false,
    type: "",
    value: "",
    top: 0,
    left: 0,
    from_cell: {},
    fromchain: "",
    fromrow: 0,
    cursor: "default",
  } as FloatingValueProps);
  const [floatingChecks, setFloatingChecks, refFloatingChecks] = useState(FloatingChecksDefaultProps());
  const [floatingInstall, setFloatingInstall, refFloatingInstall] = useState({
    visible: false,
    result: [] as string[],
    script: [] as string[],
    items: [],
    dragpos: { top: 140, left: 816 },

    onStartDrag: onStartDragList,
    onClose: () => {
      refFloatingInstall.current.visible = false;
      refFloatingInstall.current.cursor = "default";
      setFloatingInstall({ ...refFloatingInstall.current });
    },
    cursor: "default",
  } as FloatingInstallProps);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  const handleChange2 = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab2(newValue);
  };
  const handleChange3 = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab3(newValue);
  };
  const handleChange4 = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab4(newValue);
  };

  function mutationCallback(_mutations: MutationRecord[]) {
    if (refDragIndex.current == -2) {
      SetReceiverPos(refFloatingValue.current.type);
    }
  }

  function setLogoutTimer() {
    if (logout_timer != -1) {
      clearTimeout(logout_timer);
    }
    logout_timer = window.setTimeout(Logout, 10 * 60 * 1000); // 10 minutes
  }

  function HandleChangeLogging(value: string) {
    refLogging.current.loggingtype = value;
    setLogging({ ...refLogging.current });
    setbadgeOnSave(true);
  }

  function HideShowSNATChain(chain: string) {
    let def = refSNatRules.current.rules.get(chain);
    if (def !== undefined) {
      def.visible = !def.visible;
      refSNatRules.current.rules.set(chain, def);
      setSNatRules({ ...refSNatRules.current });
    }
  }

  function HideShowDNATChain(chain: string) {
    let def = refDNatRules.current.rules.get(chain);
    if (def !== undefined) {
      def.visible = !def.visible;
      refDNatRules.current.rules.set(chain, def);
      setDNatRules({ ...refDNatRules.current });
    }
  }

  function HideShowChain(chain: string) {
    let filterdef = refCustomRules.current.rules.get(chain);
    if (filterdef !== undefined) {
      filterdef.visible = !filterdef.visible;
      refCustomRules.current.rules.set(chain, filterdef);
      setCustomRules({ ...refCustomRules.current });
    }
  }

  function handleAddUser(username: string, password: string) {
    let user: User = { username: username, password: password, secret: refAddUserDialog.current.secret };
    setLoading(true);

    axios
      .post(URLServer + "adduser", user)
      .then((response) => {
        if (response.data === "OK") {
          closeAddUserDialog();
          if (refAddUserDialog.current.firstUser) {
            refAddUserDialog.current.firstUser = false;
            refLoginDialog.current.open = true;
            setLoginDialog({ ...refLoginDialog.current });
          } else {
            FetchData(URLServer + "users", UsersCallback);
          }
        } else {
          AlertError("Error adding user: " + response.data);
        }
      })
      .catch((error) => {
        let errtxt = "";
        if (error.response) {
          // The server responded with a status outside the range of 2xx
          errtxt = "Error Status: " + error.response.status + " Error Data: " + error.response.data;
        } else if (error.request) {
          // The request was made but no response was received
          errtxt = "No Response Received: " + error.request;
        } else {
          // Something went wrong in setting up the request
          errtxt = "Request Error: " + error.message;
        }
        AlertError(errtxt);
      })
      .finally(function () {
        setLoading(false);
      });
  }

  function deleteUser(username: string) {
    if (refSettingsDialog.current.users.length <= 1) {
      AlertError("At least one user must exist.");
      return;
    }
    FetchData(URLServer + "deleteuser/" + username, DeleteUserCallback);
  }

  function handleLoginCheck(username: string, password: string, mfacode: string) {
    let logindata = { username: username, password: password, mfa: mfacode };
    setLoading(true);

    axios
      .post(URLServer + "login", logindata)
      .then((response) => {
        if (response.data === "OK") {
          setCurrentUser(username);
          refLoginDialog.current.open = false;
          setLoginDialog({ ...refLoginDialog.current });
          FetchData(URLServer + "configs", FetchConfigsCallback);
          FetchData(URLServer + "users", UsersCallback);
          setLogoutTimer();
        } else {
          refLoginDialog.current.warning = "Login error: " + response.data;
          setLoginDialog({ ...refLoginDialog.current });
        }
      })
      .catch((error) => {
        let errtxt = "";
        if (error.response) {
          // The server responded with a status outside the range of 2xx
          errtxt = "Error Status: " + error.response.status + " Error Data: " + error.response.data;
        } else if (error.request) {
          // The request was made but no response was received
          errtxt = "No Response Received: " + error.request;
        } else {
          // Something went wrong in setting up the request
          errtxt = "Request Error: " + error.message;
        }
        refLoginDialog.current.warning = errtxt;
        setLoginDialog({ ...refLoginDialog.current });
      })
      .finally(function () {
        setLoading(false);
      });
  }

  function onStartDragList(e: MEvent<HTMLDivElement>, index: number) {
    StartDrag(e);
    setDragIndex(index);
    if (FilterRulesOpen()) {
      refCustomRules.current.cursor = "move";
      setCustomRules({ ...refCustomRules.current });
    }
    if (SNatRulesOpen()) {
      refSNatRules.current.cursor = "move";
      setSNatRules({ ...refSNatRules.current });
    }
    if (DNatRulesOpen()) {
      refDNatRules.current.cursor = "move";
      setDNatRules({ ...refDNatRules.current });
    }
    if (refFloatingChecks.current.visible) {
      refFloatingChecks.current.cursor = "move";
      setFloatingChecks({ ...refFloatingChecks.current });
    }
    if (refFloatingInstall.current.visible) {
      refFloatingInstall.current.cursor = "move";
      setFloatingInstall({ ...refFloatingInstall.current });
    }
  }

  function FilterRulesOpen(): boolean {
    return refActiveTab.current == 3 && refActiveTab3.current == 1;
  }

  function SNatRulesOpen(): boolean {
    return refActiveTab.current == 4 && refActiveTab4.current == 0;
  }

  function DNatRulesOpen(): boolean {
    return refActiveTab.current == 4 && refActiveTab4.current == 1;
  }

  function SetReceiverPos(type: string) {
    if (FilterRulesOpen()) {
      SetReceiverPositions(type, refCustomRules.current.rules);
    }
    if (SNatRulesOpen()) {
      SetNatReceiverPositions(type, refSNatRules.current.rules, refDragIndex.current);
    }
    if (DNatRulesOpen()) {
      SetNatReceiverPositions(type, refDNatRules.current.rules, refDragIndex.current);
    }
  }

  function onStartDragValueOut(e: MEvent<HTMLSpanElement>, type: string, value: string, chain: string, rownr: number) {
    let span = StartDrag(e);
    let cell = span.parentElement;
    if (cell) {
      let row = cell.parentElement;
      if (row) {
        let tbody = row.parentElement;
        if (tbody) {
          observer.observe(tbody, { childList: true });
        }
      }

      setDragIndex(-1);
      refFloatingValue.current.visible = true;
      refFloatingValue.current.value = value;
      refFloatingValue.current.type = type;
      refFloatingValue.current.cursor = "move";
      refFloatingValue.current.from_cell = cell;
      refFloatingValue.current.fromchain = chain;
      refFloatingValue.current.fromrow = rownr;
      refFloatingValue.current.left = span.getBoundingClientRect().x;
      refFloatingValue.current.top = span.getBoundingClientRect().y - 3;
      setFloatingValue({ ...refFloatingValue.current });
      SetReceiverPos(type);
    }
  }

  function onStartDragValue(e: MEvent<HTMLDivElement>, type: string, value: string) {
    let div = StartDrag(e);
    setDragIndex(-2);
    refFloatingValue.current.visible = true;
    refFloatingValue.current.value = value;
    refFloatingValue.current.type = type;
    refFloatingValue.current.cursor = "move";
    refFloatingValue.current.left = div.getBoundingClientRect().x + window.scrollX;
    refFloatingValue.current.top = div.getBoundingClientRect().y + window.scrollY - 3;
    setFloatingValue({ ...refFloatingValue.current });
    SetReceiverPos(type);
  }

  function StartDrag(e: MEvent<HTMLDivElement | HTMLSpanElement>): HTMLDivElement | HTMLSpanElement {
    e.preventDefault();
    let div = e.currentTarget;
    setDragInitPos({
      startdivx: div.getBoundingClientRect().x + window.scrollX,
      startdivy: div.getBoundingClientRect().y + window.scrollY,
      startmousex: e.clientX,
      startmousey: e.clientY,
    });
    return div;
  }

  function onMouseMove(e: MouseEvent) {
    setLogoutTimer();
    if (refDragIndex.current == -1 || refDragIndex.current == -2) {
      refFloatingValue.current.left = e.clientX - refInitPos.current.startmousex + refInitPos.current.startdivx;
      refFloatingValue.current.top = e.clientY - refInitPos.current.startmousey + refInitPos.current.startdivy;
      setFloatingValue({ ...refFloatingValue.current });
    }
    if (refDragIndex.current == -1) {
      // drag value out of table
      if (CheckMouseOutOf(refFloatingValue.current.from_cell, e.clientX, e.clientY)) {
        if (FilterRulesOpen()) {
          let filtertable = refCustomRules.current.rules.get(refFloatingValue.current.fromchain);
          if (filtertable !== undefined) {
            if (refFloatingValue.current.from_cell.id.endsWith("source-" + refFloatingValue.current.fromrow)) {
              filtertable.rules[refFloatingValue.current.fromrow].source = filtertable.rules[
                refFloatingValue.current.fromrow
              ].source.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (refFloatingValue.current.from_cell.id.endsWith("destination-" + refFloatingValue.current.fromrow)) {
              filtertable.rules[refFloatingValue.current.fromrow].destination = filtertable.rules[
                refFloatingValue.current.fromrow
              ].destination.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (refFloatingValue.current.from_cell.id.endsWith("sourceservice-" + refFloatingValue.current.fromrow)) {
              filtertable.rules[refFloatingValue.current.fromrow].sourceservice = filtertable.rules[
                refFloatingValue.current.fromrow
              ].sourceservice.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (
              refFloatingValue.current.from_cell.id.endsWith("destinationservice-" + refFloatingValue.current.fromrow)
            ) {
              filtertable.rules[refFloatingValue.current.fromrow].destinationservice = filtertable.rules[
                refFloatingValue.current.fromrow
              ].destinationservice.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (
              filtertable.rules[refFloatingValue.current.fromrow].source.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].destination.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].sourceservice.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].destinationservice.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].comment == ""
            ) {
              // delete empty rule
              filtertable.rules = filtertable.rules.filter(function (_r: FilterRule, index: number): boolean {
                return index != refFloatingValue.current.fromrow;
              });
            }
            refCustomRules.current.rules.set(refFloatingValue.current.fromchain, filtertable);
            setCustomRules({ ...refCustomRules.current });
            setbadgeOnSave(true);
          }
          setDragIndex(-2); // value can be dragged to some receiver now
        }
        if (SNatRulesOpen()) {
          let filtertable = refSNatRules.current.rules.get(refFloatingValue.current.fromchain);
          if (filtertable !== undefined) {
            if (refFloatingValue.current.from_cell.id.endsWith("source-" + refFloatingValue.current.fromrow)) {
              filtertable.rules[refFloatingValue.current.fromrow].source = filtertable.rules[
                refFloatingValue.current.fromrow
              ].source.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (refFloatingValue.current.from_cell.id.endsWith("destination-" + refFloatingValue.current.fromrow)) {
              filtertable.rules[refFloatingValue.current.fromrow].destination = filtertable.rules[
                refFloatingValue.current.fromrow
              ].destination.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (refFloatingValue.current.from_cell.id.endsWith("translated-" + refFloatingValue.current.fromrow)) {
              if (filtertable.rules[refFloatingValue.current.fromrow].translated == refFloatingValue.current.value) {
                filtertable.rules[refFloatingValue.current.fromrow].translated = "";
              }
            }
            if (refFloatingValue.current.from_cell.id.endsWith("sourceservice-" + refFloatingValue.current.fromrow)) {
              filtertable.rules[refFloatingValue.current.fromrow].sourceservice = filtertable.rules[
                refFloatingValue.current.fromrow
              ].sourceservice.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (
              refFloatingValue.current.from_cell.id.endsWith("destinationservice-" + refFloatingValue.current.fromrow)
            ) {
              filtertable.rules[refFloatingValue.current.fromrow].destinationservice = filtertable.rules[
                refFloatingValue.current.fromrow
              ].destinationservice.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (
              refFloatingValue.current.from_cell.id.endsWith("translatedservice-" + refFloatingValue.current.fromrow)
            ) {
              if (
                filtertable.rules[refFloatingValue.current.fromrow].translatedservice == refFloatingValue.current.value
              ) {
                filtertable.rules[refFloatingValue.current.fromrow].translatedservice = "";
              }
            }
            if (
              filtertable.rules[refFloatingValue.current.fromrow].source.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].destination.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].translated == "" &&
              filtertable.rules[refFloatingValue.current.fromrow].sourceservice.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].destinationservice.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].translatedservice == "" &&
              filtertable.rules[refFloatingValue.current.fromrow].comment == ""
            ) {
              // delete empty rule
              filtertable.rules = filtertable.rules.filter(function (_r: NatRule, index: number): boolean {
                return index != refFloatingValue.current.fromrow;
              });
            }
            refSNatRules.current.rules.set(refFloatingValue.current.fromchain, filtertable);
            setSNatRules({ ...refSNatRules.current });
            setbadgeOnSave(true);
          }
          setDragIndex(-2); // value can be dragged to some receiver now
        }
        if (DNatRulesOpen()) {
          let filtertable = refDNatRules.current.rules.get(refFloatingValue.current.fromchain);
          if (filtertable !== undefined) {
            if (refFloatingValue.current.from_cell.id.endsWith("source-" + refFloatingValue.current.fromrow)) {
              filtertable.rules[refFloatingValue.current.fromrow].source = filtertable.rules[
                refFloatingValue.current.fromrow
              ].source.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (refFloatingValue.current.from_cell.id.endsWith("destination-" + refFloatingValue.current.fromrow)) {
              filtertable.rules[refFloatingValue.current.fromrow].destination = filtertable.rules[
                refFloatingValue.current.fromrow
              ].destination.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (refFloatingValue.current.from_cell.id.endsWith("translated-" + refFloatingValue.current.fromrow)) {
              if (filtertable.rules[refFloatingValue.current.fromrow].translated == refFloatingValue.current.value) {
                filtertable.rules[refFloatingValue.current.fromrow].translated = "";
              }
            }
            if (refFloatingValue.current.from_cell.id.endsWith("sourceservice-" + refFloatingValue.current.fromrow)) {
              filtertable.rules[refFloatingValue.current.fromrow].sourceservice = filtertable.rules[
                refFloatingValue.current.fromrow
              ].sourceservice.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (
              refFloatingValue.current.from_cell.id.endsWith("destinationservice-" + refFloatingValue.current.fromrow)
            ) {
              filtertable.rules[refFloatingValue.current.fromrow].destinationservice = filtertable.rules[
                refFloatingValue.current.fromrow
              ].destinationservice.filter(function (v: string): boolean {
                return v != refFloatingValue.current.value;
              });
            }
            if (
              refFloatingValue.current.from_cell.id.endsWith("translatedservice-" + refFloatingValue.current.fromrow)
            ) {
              if (
                filtertable.rules[refFloatingValue.current.fromrow].translatedservice == refFloatingValue.current.value
              ) {
                filtertable.rules[refFloatingValue.current.fromrow].translatedservice = "";
              }
            }
            if (
              filtertable.rules[refFloatingValue.current.fromrow].source.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].destination.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].translated == "" &&
              filtertable.rules[refFloatingValue.current.fromrow].sourceservice.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].destinationservice.length == 0 &&
              filtertable.rules[refFloatingValue.current.fromrow].translatedservice == "" &&
              filtertable.rules[refFloatingValue.current.fromrow].comment == ""
            ) {
              // delete empty rule
              filtertable.rules = filtertable.rules.filter(function (_r: NatRule, index: number): boolean {
                return index != refFloatingValue.current.fromrow;
              });
            }
            refDNatRules.current.rules.set(refFloatingValue.current.fromchain, filtertable);
            setDNatRules({ ...refDNatRules.current });
            setbadgeOnSave(true);
          }
          setDragIndex(-2); // value can be dragged to some receiver now
        }
      }
    }
    if (refDragIndex.current == -2) {
      if (refFloatingValue.current.type == "host" || refFloatingValue.current.type == "address") {
        if (CheckMouseOverAddress(e.clientX, e.clientY)) {
          refFloatingValue.current.cursor = "crosshair";
        } else {
          refFloatingValue.current.cursor = "move";
        }
      }
      if (refFloatingValue.current.type == "service") {
        if (CheckMouseOverService(e.clientX, e.clientY)) {
          refFloatingValue.current.cursor = "crosshair";
        } else {
          refFloatingValue.current.cursor = "move";
        }
      }
    }
    if (refDragIndex.current >= 0) {
      // drag list or checks
      console.log(refDragIndex.current, refFloatingInstall.current.visible, FloatingInstallDragIndex);
      if (refFloatingInstall.current.visible && refDragIndex.current == FloatingInstallDragIndex) {
        refFloatingInstall.current.dragpos.left =
          e.clientX - refInitPos.current.startmousex + refInitPos.current.startdivx;
        refFloatingInstall.current.dragpos.top =
          e.clientY - refInitPos.current.startmousey + refInitPos.current.startdivy;
        setFloatingInstall({ ...refFloatingInstall.current });
      } else {
        if (refFloatingChecks.current.visible && refDragIndex.current == FloatingCheckDragIndex) {
          refFloatingChecks.current.dragpos.left =
            e.clientX - refInitPos.current.startmousex + refInitPos.current.startdivx;
          refFloatingChecks.current.dragpos.top =
            e.clientY - refInitPos.current.startmousey + refInitPos.current.startdivy;
          setFloatingChecks({ ...refFloatingChecks.current });
        } else {
          if (FilterRulesOpen()) {
            refCustomRules.current.dragpos[refDragIndex.current].left =
              e.clientX - refInitPos.current.startmousex + refInitPos.current.startdivx;
            refCustomRules.current.dragpos[refDragIndex.current].top =
              e.clientY - refInitPos.current.startmousey + refInitPos.current.startdivy;
            setCustomRules({ ...refCustomRules.current });
          }
          if (SNatRulesOpen()) {
            refSNatRules.current.dragpos[refDragIndex.current].left =
              e.clientX - refInitPos.current.startmousex + refInitPos.current.startdivx;
            refSNatRules.current.dragpos[refDragIndex.current].top =
              e.clientY - refInitPos.current.startmousey + refInitPos.current.startdivy;
            setSNatRules({ ...refSNatRules.current });
          }
          if (DNatRulesOpen()) {
            refDNatRules.current.dragpos[refDragIndex.current].left =
              e.clientX - refInitPos.current.startmousex + refInitPos.current.startdivx;
            refDNatRules.current.dragpos[refDragIndex.current].top =
              e.clientY - refInitPos.current.startmousey + refInitPos.current.startdivy;
            setDNatRules({ ...refDNatRules.current });
          }
        }
      }
    }
  }

  function AddressRececeived(receiver: dragreceiver) {
    if (FilterRulesOpen()) {
      if (receiver.id.endsWith("source-empty") || receiver.id.endsWith("destination-empty")) {
        let newrule: FilterRule = {
          source: [],
          sourceservice: [],
          destination: [],
          destinationservice: [],
          action: "drop",
          comment: "",
          active: true,
        };
        if (receiver.id.endsWith("source-empty")) {
          newrule.source.push(refFloatingValue.current.value);
        } else {
          newrule.destination.push(refFloatingValue.current.value);
        }
        let data = refCustomRules.current.rules.get(receiver.chain);
        if (data !== undefined) {
          data.rules.push(newrule);
        }
      } else {
        let filtertable = refCustomRules.current.rules.get(receiver.chain);
        if (filtertable !== undefined) {
          if (
            receiver.id.endsWith("source-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].source.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].source.push(refFloatingValue.current.value);
          }
          if (
            receiver.id.endsWith("destination-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].destination.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].destination.push(refFloatingValue.current.value);
          }
          refCustomRules.current.rules.set(receiver.chain, filtertable);
        }
      }
      setCustomRules({ ...refCustomRules.current });
    }
    if (SNatRulesOpen()) {
      if (
        receiver.id.endsWith("source-empty") ||
        receiver.id.endsWith("destination-empty") ||
        receiver.id.endsWith("translated-empty")
      ) {
        let newrule: NatRule = {
          source: [],
          sourceservice: [],
          destination: [],
          destinationservice: [],
          translated: "",
          translatedservice: "",
          comment: "",
          active: true,
        };
        if (receiver.id.endsWith("source-empty")) {
          newrule.source.push(refFloatingValue.current.value);
        } else if (receiver.id.endsWith("destination-empty")) {
          newrule.destination.push(refFloatingValue.current.value);
        } else {
          newrule.translated = refFloatingValue.current.value;
        }
        let data = refSNatRules.current.rules.get(receiver.chain);
        if (data !== undefined) {
          data.rules.push(newrule);
        }
      } else {
        let filtertable = refSNatRules.current.rules.get(receiver.chain);
        if (filtertable !== undefined) {
          if (
            receiver.id.endsWith("source-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].source.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].source.push(refFloatingValue.current.value);
          }
          if (
            receiver.id.endsWith("destination-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].destination.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].destination.push(refFloatingValue.current.value);
          }
          if (
            receiver.id.endsWith("translated-" + receiver.rownr) &&
            filtertable.rules[receiver.rownr].translated != refFloatingValue.current.value
          ) {
            filtertable.rules[receiver.rownr].translated = refFloatingValue.current.value;
          }
          refSNatRules.current.rules.set(receiver.chain, filtertable);
        }
      }
      setSNatRules({ ...refSNatRules.current });
    }
    if (DNatRulesOpen()) {
      if (
        receiver.id.endsWith("source-empty") ||
        receiver.id.endsWith("destination-empty") ||
        receiver.id.endsWith("translated-empty")
      ) {
        let newrule: NatRule = {
          source: [],
          sourceservice: [],
          destination: [],
          destinationservice: [],
          translated: "",
          translatedservice: "",
          comment: "",
          active: true,
        };
        if (receiver.id.endsWith("source-empty")) {
          newrule.source.push(refFloatingValue.current.value);
        } else if (receiver.id.endsWith("destination-empty")) {
          newrule.destination.push(refFloatingValue.current.value);
        } else {
          newrule.translated = refFloatingValue.current.value;
        }
        let data = refDNatRules.current.rules.get(receiver.chain);
        if (data !== undefined) {
          data.rules.push(newrule);
        }
      } else {
        let filtertable = refDNatRules.current.rules.get(receiver.chain);
        if (filtertable !== undefined) {
          if (
            receiver.id.endsWith("source-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].source.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].source.push(refFloatingValue.current.value);
          }
          if (
            receiver.id.endsWith("destination-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].destination.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].destination.push(refFloatingValue.current.value);
          }
          if (
            receiver.id.endsWith("translated-" + receiver.rownr) &&
            filtertable.rules[receiver.rownr].translated != refFloatingValue.current.value
          ) {
            filtertable.rules[receiver.rownr].translated = refFloatingValue.current.value;
          }
          refDNatRules.current.rules.set(receiver.chain, filtertable);
        }
      }
      setDNatRules({ ...refDNatRules.current });
    }
  }

  function ServiceRececeived(receiver: dragreceiver) {
    if (FilterRulesOpen()) {
      if (receiver.id.endsWith("sourceservice-empty") || receiver.id.endsWith("destinationservice-empty")) {
        let newrule: FilterRule = {
          source: [],
          sourceservice: [],
          destination: [],
          destinationservice: [],
          action: "drop",
          comment: "",
          active: true,
        };
        if (receiver.id.endsWith("sourceservice-empty")) {
          newrule.sourceservice.push(refFloatingValue.current.value);
        } else {
          newrule.destinationservice.push(refFloatingValue.current.value);
        }
        let data = refCustomRules.current.rules.get(receiver.chain);
        if (data !== undefined) {
          data.rules.push(newrule);
          refCustomRules.current.rules.set(receiver.chain, data);
        }
      } else {
        let filtertable = refCustomRules.current.rules.get(receiver.chain);
        if (filtertable !== undefined) {
          if (
            receiver.id.endsWith("sourceservice-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].sourceservice.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].sourceservice.push(refFloatingValue.current.value);
          }
          if (
            receiver.id.endsWith("destinationservice-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].destinationservice.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].destinationservice.push(refFloatingValue.current.value);
          }
          refCustomRules.current.rules.set(receiver.chain, filtertable);
        }
      }
      setCustomRules({ ...refCustomRules.current });
    }
    if (SNatRulesOpen()) {
      if (
        receiver.id.endsWith("sourceservice-empty") ||
        receiver.id.endsWith("destinationservice-empty") ||
        receiver.id.endsWith("translatedservice-empty")
      ) {
        let newrule: NatRule = {
          source: [],
          sourceservice: [],
          destination: [],
          destinationservice: [],
          translated: "",
          translatedservice: "",
          comment: "",
          active: true,
        };
        if (receiver.id.endsWith("sourceservice-empty")) {
          newrule.sourceservice.push(refFloatingValue.current.value);
        } else if (receiver.id.endsWith("destinationservice-empty")) {
          newrule.destinationservice.push(refFloatingValue.current.value);
        } else {
          newrule.translatedservice = refFloatingValue.current.value;
        }
        let data = refSNatRules.current.rules.get(receiver.chain);
        if (data !== undefined) {
          data.rules.push(newrule);
          refSNatRules.current.rules.set(receiver.chain, data);
        }
      } else {
        let filtertable = refSNatRules.current.rules.get(receiver.chain);
        if (filtertable !== undefined) {
          if (
            receiver.id.endsWith("sourceservice-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].sourceservice.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].sourceservice.push(refFloatingValue.current.value);
          }
          if (
            receiver.id.endsWith("destinationservice-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].destinationservice.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].destinationservice.push(refFloatingValue.current.value);
          }
          if (
            receiver.id.endsWith("translatedservice-" + receiver.rownr) &&
            filtertable.rules[receiver.rownr].translatedservice != refFloatingValue.current.value
          ) {
            filtertable.rules[receiver.rownr].translatedservice = refFloatingValue.current.value;
          }
          refSNatRules.current.rules.set(receiver.chain, filtertable);
        }
      }
      setSNatRules({ ...refSNatRules.current });
    }
    if (DNatRulesOpen()) {
      if (
        receiver.id.endsWith("sourceservice-empty") ||
        receiver.id.endsWith("destinationservice-empty") ||
        receiver.id.endsWith("translatedservice-empty")
      ) {
        let newrule: NatRule = {
          source: [],
          sourceservice: [],
          destination: [],
          destinationservice: [],
          translated: "",
          translatedservice: "",
          comment: "",
          active: true,
        };
        if (receiver.id.endsWith("sourceservice-empty")) {
          newrule.sourceservice.push(refFloatingValue.current.value);
        } else if (receiver.id.endsWith("destinationservice-empty")) {
          newrule.destinationservice.push(refFloatingValue.current.value);
        } else {
          newrule.translatedservice = refFloatingValue.current.value;
        }
        let data = refDNatRules.current.rules.get(receiver.chain);
        if (data !== undefined) {
          data.rules.push(newrule);
          refDNatRules.current.rules.set(receiver.chain, data);
        }
      } else {
        let filtertable = refDNatRules.current.rules.get(receiver.chain);
        if (filtertable !== undefined) {
          if (
            receiver.id.endsWith("sourceservice-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].sourceservice.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].sourceservice.push(refFloatingValue.current.value);
          }
          if (
            receiver.id.endsWith("destinationservice-" + receiver.rownr) &&
            !filtertable.rules[receiver.rownr].destinationservice.includes(refFloatingValue.current.value)
          ) {
            filtertable.rules[receiver.rownr].destinationservice.push(refFloatingValue.current.value);
          }
          if (
            receiver.id.endsWith("translatedservice-" + receiver.rownr) &&
            filtertable.rules[receiver.rownr].translatedservice != refFloatingValue.current.value
          ) {
            filtertable.rules[receiver.rownr].translatedservice = refFloatingValue.current.value;
          }
          refDNatRules.current.rules.set(receiver.chain, filtertable);
        }
      }
      setDNatRules({ ...refDNatRules.current });
    }
  }

  function onMouseUp(e: MouseEvent) {
    if (refDragIndex.current > -3) {
      e.preventDefault();
      if (refDragIndex.current == -2) {
        // dragging a value
        refFloatingValue.current.visible = false;
        refFloatingValue.current.cursor = "default";
        setFloatingValue({ ...refFloatingValue.current });
        if (refFloatingValue.current.type == "host" || refFloatingValue.current.type == "address") {
          // dropped a host or network on an address field?
          let receiver = CheckMouseUpOnAddress(e.clientX, e.clientY);
          if (receiver != null) {
            AddressRececeived(receiver);

            setbadgeOnSave(true);
          } else {
            // not dropped on a valid address field
            refCustomRules.current.cursor = "default";
            setCustomRules({ ...refCustomRules.current });
          }
        }
        if (refFloatingValue.current.type == "service") {
          // dropped a service on an service field?
          let receiver = CheckMouseUpOnService(e.clientX, e.clientY);
          if (receiver != null) {
            ServiceRececeived(receiver);
            setbadgeOnSave(true);
          } else {
            // not dropped on a valid address field
            refCustomRules.current.cursor = "default";
            setCustomRules({ ...refCustomRules.current });
          }
        }
      }
      if (refDragIndex.current >= 0) {
        if (FilterRulesOpen()) {
          refCustomRules.current.cursor = "default";
          setCustomRules({ ...refCustomRules.current });
        }
        if (SNatRulesOpen()) {
          refSNatRules.current.cursor = "default";
          setSNatRules({ ...refSNatRules.current });
        }
        if (DNatRulesOpen()) {
          refDNatRules.current.cursor = "default";
          setDNatRules({ ...refDNatRules.current });
        }
        if (refFloatingChecks.current.visible) {
          refFloatingChecks.current.cursor = "default";
          setFloatingChecks({ ...refFloatingChecks.current });
        }
      }
      setDragIndex(-3);
    }
  }

  function AlertError(text: string) {
    setAlertBar({
      open: true,
      severity: "error",
      text: text,
      onClose: () => {
        setAlertBar({
          open: false,
          severity: "error",
          text: "",
          onClose: () => {},
        });
      },
    });
  }

  function FetchData(url: string, callback: (json: any) => void) {
    setLoading(true);

    const fetchDataFromServer = async () => {
      axios
        .get(url)
        .then((response) => {
          callback(response.data);
        })
        .catch((error) => {
          let errtxt = "";
          if (error.response) {
            // The server responded with a status outside the range of 2xx
            errtxt = "Error Status: " + error.response.status + " Error Data: " + error.response.data;
          } else if (error.request) {
            // The request was made but no response was received
            errtxt = "No Response Received: " + error.request;
          } else {
            // Something went wrong in setting up the request
            errtxt = "Request Error: " + error.message;
          }
          AlertError(errtxt);
        })
        .finally(function () {
          setLoading(false);
        });
    };

    fetchDataFromServer();
  }

  interface FilterTableSaveType {
    chain: string;
    policy: string;
    deleted: boolean;
    rules: FilterRule[];
  }
  interface CustomRulesSaveType {
    filtertables: FilterTableSaveType[];
    dragpos: DragPosition[];
  }
  interface NatTableSaveType {
    chain: string;
    policy: string;
    deleted: boolean;
    rules: NatRule[];
  }
  interface NatRulesSaveType {
    nattables: NatTableSaveType[];
    dragpos: DragPosition[];
  }

  function Config2json(): Configuration {
    let filtertosave: CustomRulesSaveType = { filtertables: [], dragpos: refCustomRules.current.dragpos };
    refCustomRules.current.rules.forEach(function (table, chain) {
      let tabletosave: FilterTableSaveType = {
        chain: chain,
        policy: table.defaultpolicy,
        deleted: table.deleted,
        rules: table.rules,
      };
      filtertosave.filtertables.push(tabletosave);
    });
    let dnattosave: NatRulesSaveType = { nattables: [], dragpos: refDNatRules.current.dragpos };
    refDNatRules.current.rules.forEach(function (table, chain) {
      let tabletosave: NatTableSaveType = {
        chain: chain,
        policy: table.defaultpolicy,
        deleted: table.deleted,
        rules: table.rules,
      };
      dnattosave.nattables.push(tabletosave);
    });
    let snattosave: NatRulesSaveType = { nattables: [], dragpos: refSNatRules.current.dragpos };
    refSNatRules.current.rules.forEach(function (table, chain) {
      let tabletosave: NatTableSaveType = {
        chain: chain,
        policy: table.defaultpolicy,
        deleted: table.deleted,
        rules: table.rules,
      };
      snattosave.nattables.push(tabletosave);
    });
    let conf: Configuration = {
      name: hexEncode(refConfigName.current),
      json: JSON.stringify({
        interfaces: Object.fromEntries(refInterfaces.current.interfacesList), // cannot stringify map :-(
        hosts: Object.fromEntries(refHosts.current.hosts),
        hostgroups: Object.fromEntries(refHostGroups.current.groups),
        ipv4networks: Object.fromEntries(refNetwork.current.ipv4),
        ipv6networks: Object.fromEntries(refNetwork.current.ipv6),
        services: Object.fromEntries(refServices.current.portlist),
        chains: Object.fromEntries(refChains.current.chainsList),
        inactive_defaults: refDefaults.current.inactiveList,
        filters: filtertosave,
        pre: refManualFilter.current.pre,
        post: refManualFilter.current.post,
        snat: snattosave,
        dnat: dnattosave,
        logging: refLogging.current.loggingtype,
        checksdragpos: refFloatingChecks.current.dragpos,
      }),
    };
    return conf;
  }

  async function postToServer(action: string, conf: Configuration, callback: (result: any) => void) {
    setLoading(true);

    axios
      .post(URLServer + action, conf)
      .then((response) => {
        callback(response.data);
      })
      .catch((error) => {
        let errtxt = "";
        if (error.response) {
          // The server responded with a status outside the range of 2xx
          errtxt = "Error Status: " + error.response.status + " Error Data: " + error.response.data;
        } else if (error.request) {
          // The request was made but no response was received
          errtxt = "No Response Received: " + error.request;
        } else {
          // Something went wrong in setting up the request
          errtxt = "Request Error: " + error.message;
        }
        AlertError(errtxt);
      })
      .finally(function () {
        setLoading(false);
      });
  }

  function SaveToServerCallback(result: any) {
    if (result === "OK") {
      setbadgeOnSave(false);
    } else {
      AlertError("Save failed: " + result.error);
    }
  }

  function HandleChangeDefaults(rule: string) {
    if (refDefaults.current.inactiveList.includes(rule)) {
      refDefaults.current.inactiveList = refDefaults.current.inactiveList.filter((value) => value !== rule);
    } else {
      refDefaults.current.inactiveList.push(rule);
    }
    setDefaults({ ...refDefaults.current });
    setbadgeOnSave(true);
  }

  function HandleToggleFilter(name: string) {
    let data = refChains.current.chainsList.get(name);
    if (data !== undefined) {
      data.filter = !data.filter;
      refChains.current.chainsList.set(name, data);
      setChains({ ...refChains.current });
      setbadgeOnSave(true);
    }
  }

  function HandleToggleSnat(name: string) {
    let data = refChains.current.chainsList.get(name);
    if (data !== undefined) {
      data.snat = !data.snat;
      refChains.current.chainsList.set(name, data);
      setChains({ ...refChains.current });
      setbadgeOnSave(true);
    }
  }

  function HandleToggleDnat(name: string) {
    let data = refChains.current.chainsList.get(name);
    if (data !== undefined) {
      data.dnat = !data.dnat;
      refChains.current.chainsList.set(name, data);
      setChains({ ...refChains.current });
      setbadgeOnSave(true);
    }
  }

  function HandleChangeChain(name: string, value: string) {
    let data = refChains.current.chainsList.get(name);
    if (data !== undefined) {
      data.policy = value;
      refChains.current.chainsList.set(name, data);
      setChains({ ...refChains.current });
      setbadgeOnSave(true);
    }
    let data2 = refCustomRules.current.rules.get(name);
    if (data2 !== undefined) {
      data2.defaultpolicy = value;
      refCustomRules.current.rules.set(name, data2);
      setCustomRules({ ...refCustomRules.current });
    }
  }

  function GenerateChains(): void {
    if (refInterfaces.current.interfacesList.size == 0) {
      AlertError("No network interfaces listed, detect them first (DEFINITIONS tab -> INTERFACES tab).");
    } else {
      let newList = new Map<string, ChainItem>();
      refInterfaces.current.interfacesList.forEach(function (value, key) {
        let policy = "drop";
        if (value.loopback) {
          policy = "accept";
        }
        let name = "In-on-" + key;
        let data = refChains.current.chainsList.get(name);
        if (data === undefined) {
          data = {
            filter: false,
            snat: false,
            dnat: false,
            iface_in: key,
            iface_out: "-",
            direction: "input",
            policy: policy,
          };
        }
        newList.set(name, data);

        if (!value.loopback) {
          refInterfaces.current.interfacesList.forEach(function (value2, key2) {
            if (key2 != key && !value2.loopback) {
              name = "Forward-" + key + "-to-" + key2;
              data = refChains.current.chainsList.get(name);
              if (data === undefined) {
                data = {
                  filter: false,
                  snat: false,
                  dnat: false,
                  iface_in: key,
                  iface_out: key2,
                  direction: "forward",
                  policy: policy,
                };
              }
              newList.set(name, data);
            }
          });
        }
        name = "Out-on-" + key;
        data = refChains.current.chainsList.get(name);
        if (data === undefined) {
          data = {
            filter: false,
            snat: false,
            dnat: false,
            iface_in: "-",
            iface_out: key,
            direction: "output",
            policy: policy,
          };
        }
        newList.set(name, data);
      });
      refChains.current.chainsList = newList;
      setChains({ ...refChains.current });

      // update filter rules
      let newRuleList = new Map<string, FilterTableProps>();
      for (const name of newList.keys()) {
        let data = refCustomRules.current.rules.get(name);
        if (data === undefined) {
          let policy = "drop";
          let chain = newList.get(name);
          if (chain !== undefined) {
            policy = chain.policy;
          }
          data = {
            rules: [],
            visible: false,
            deleted: false,
            defaultpolicy: policy,
            chain: name,
            observer: observer,
            onStartDrag: onStartDragValueOut,
            onChangeAction: onChangeAction,
            onEditComment: onEditComment,
            onDeleteRule: onDeleteRule,
            onToggleRule: onToggleRule,
          };
        } else {
          refCustomRules.current.rules.delete(name);
        }
        newRuleList.set(name, data);
      }
      for (const [name, rules] of refCustomRules.current.rules.entries()) {
        if (rules.rules.length > 0) {
          let r = { ...rules };
          r.deleted = true;
          newRuleList.set(name, r);
        }
      }
      refCustomRules.current.rules = newRuleList;
      setCustomRules({ ...refCustomRules.current });

      // update SNAT rules
      let newSNATRuleList = new Map<string, NatTableProps>();
      newList.forEach(function (chain_item, chain) {
        if (chain_item.direction == "output" || chain_item.direction == "forward") {
          let data = refSNatRules.current.rules.get(chain);
          if (data === undefined) {
            data = {
              rules: [],
              visible: false,
              deleted: false,
              defaultpolicy: "policy",
              chain: chain,
              direction: "Source",
              observer: observer,
              onStartDrag: onStartDragValueOut,
              onChangeAction: onChangeAction,
              onEditComment: onEditSNatComment,
              onDeleteRule: onDeleteSNatRule,
              onToggleRule: onToggleSNatRule,
            };
          } else {
            refSNatRules.current.rules.delete(chain);
          }
          newSNATRuleList.set(chain, data);
        }
      });

      for (const [name, rules] of refSNatRules.current.rules.entries()) {
        if (rules.rules.length > 0) {
          let r = { ...rules };
          r.deleted = true;
          newSNATRuleList.set(name, r);
        }
      }
      refSNatRules.current.rules = newSNATRuleList;
      setSNatRules({ ...refSNatRules.current });

      // update DNAT rules
      let newDNATRuleList = new Map<string, NatTableProps>();
      newList.forEach(function (chain_item, chain) {
        if (chain_item.direction == "input" || chain_item.direction == "forward") {
          let data = refDNatRules.current.rules.get(chain);
          if (data === undefined) {
            data = {
              rules: [],
              visible: false,
              deleted: false,
              defaultpolicy: "policy",
              chain: chain,
              direction: "Destination",
              observer: observer,
              onStartDrag: onStartDragValueOut,
              onChangeAction: onChangeAction,
              onEditComment: onEditDNatComment,
              onDeleteRule: onDeleteDNatRule,
              onToggleRule: onToggleDNatRule,
            };
          } else {
            refDNatRules.current.rules.delete(chain);
          }
          newDNATRuleList.set(chain, data);
        }
      });

      for (const [name, rules] of refDNatRules.current.rules.entries()) {
        if (rules.rules.length > 0) {
          let r = { ...rules };
          r.deleted = true;
          newDNATRuleList.set(name, r);
        }
      }
      refDNatRules.current.rules = newDNATRuleList;
      setDNatRules({ ...refDNatRules.current });
      setbadgeOnSave(true);
    }
  }

  function isArray(value: any): value is any[] {
    return Array.isArray(value);
  }

  interface NwInterface {
    name: string;
    addresses: string;
  }

  function isInterface(obj: any): obj is NwInterface {
    return typeof obj.name === "string" && typeof obj.addresses === "string";
  }

  function FetchInterfacesCallback(json: any) {
    let newlist = new Map<string, InterfaceListItem>();
    if (isArray(json)) {
      let safeArray: any[] = json;
      safeArray.map((obj: any, index: number) => {
        if (isInterface(obj)) {
          let nwi: NwInterface = obj as NwInterface;

          // reuse given names where possible
          let foundname = "";
          for (const [name, interf] of refInterfaces.current.interfacesList.entries()) {
            if (interf.systemname == nwi.name) {
              foundname = name;
            }
          }

          let name = "interface" + index;
          if (foundname != "") {
            name = foundname;
          }
          let loopback = false;
          let addr = nwi.addresses.trim().split(" ");
          if (addr.length > 0 && addr[0] != "") {
            loopback = isLoopBack(addr[0]);
          }
          newlist = InsertIntoSortedMap<InterfaceListItem>(newlist, name, {
            systemname: nwi.name,
            addresses: nwi.addresses,
            loopback: loopback,
          });
        } else {
          AlertError("Unexpected response from server");
        }
      });
      refInterfaces.current.interfacesList = newlist;
      setInterfaces(refInterfaces.current);
      setbadgeOnSave(true);
    } else {
      AlertError("Unexpected response from server");
    }
  }

  function ReloadInterfaces() {
    FetchData(URLServer + "interfaces", FetchInterfacesCallback);
  }

  function onChangeAction(chain: string, row: number, value: string) {
    let filtertable = refCustomRules.current.rules.get(chain);
    if (filtertable !== undefined) {
      filtertable.rules[row].action = value;
      refCustomRules.current.rules.set(chain, filtertable);
      setCustomRules({ ...refCustomRules.current });
      setbadgeOnSave(true);
    }
  }

  function onEditComment(chain: string, index: number) {
    let filtertable = refCustomRules.current.rules.get(chain);
    if (filtertable !== undefined) {
      let comment = filtertable.rules[index].comment;
      OpenTextDialog("Comment", "", comment, function () {
        filtertable.rules[index].comment = TextDialogGetValue();
        setCustomRules({ ...refCustomRules.current });
        CloseTextDialog();
        setbadgeOnSave(true);
      });
    }
  }

  function onEditSNatComment(chain: string, index: number) {
    let nattable = refSNatRules.current.rules.get(chain);
    if (nattable !== undefined) {
      let comment = nattable.rules[index].comment;
      OpenTextDialog("Comment", "", comment, function () {
        nattable.rules[index].comment = TextDialogGetValue();
        setSNatRules({ ...refSNatRules.current });
        CloseTextDialog();
        setbadgeOnSave(true);
      });
    }
  }

  function onEditDNatComment(chain: string, index: number) {
    let nattable = refDNatRules.current.rules.get(chain);
    if (nattable !== undefined) {
      let comment = nattable.rules[index].comment;
      OpenTextDialog("Comment", "", comment, function () {
        nattable.rules[index].comment = TextDialogGetValue();
        setDNatRules({ ...refDNatRules.current });
        CloseTextDialog();
        setbadgeOnSave(true);
      });
    }
  }

  function onDeleteRule(chain: string, row: number) {
    setConfirmDialog({
      open: true,
      title: "",
      text: "Delete this rule?",
      onClose: (ok: boolean) => {
        closeConfirmDialog();
        if (ok) {
          let filtertable = refCustomRules.current.rules.get(chain);
          if (filtertable !== undefined) {
            filtertable.rules = filtertable.rules.filter(function (_rule, index) {
              return index != row;
            });
            if (filtertable.rules.length == 0 && filtertable.deleted) {
              // if table is empty and marked as deleted, remove it completely
              refCustomRules.current.rules.delete(chain);
            }
            setCustomRules({ ...refCustomRules.current });
            setbadgeOnSave(true);
          }
        }
      },
    });
  }

  function onDeleteSNatRule(chain: string, row: number) {
    setConfirmDialog({
      open: true,
      title: "",
      text: "Delete this rule?",
      onClose: (ok: boolean) => {
        closeConfirmDialog();
        if (ok) {
          let nattable = refSNatRules.current.rules.get(chain);
          if (nattable !== undefined) {
            nattable.rules = nattable.rules.filter(function (_rule, index) {
              return index != row;
            });
            if (nattable.rules.length == 0 && nattable.deleted) {
              // if table is empty and marked as deleted, remove it completely
              refSNatRules.current.rules.delete(chain);
            }
            setSNatRules({ ...refSNatRules.current });
            setbadgeOnSave(true);
          }
        }
      },
    });
  }

  function onDeleteDNatRule(chain: string, row: number) {
    setConfirmDialog({
      open: true,
      title: "",
      text: "Delete this rule?",
      onClose: (ok: boolean) => {
        closeConfirmDialog();
        if (ok) {
          let nattable = refDNatRules.current.rules.get(chain);
          if (nattable !== undefined) {
            nattable.rules = nattable.rules.filter(function (_rule, index) {
              return index != row;
            });
            if (nattable.rules.length == 0 && nattable.deleted) {
              // if table is empty and marked as deleted, remove it completely
              refDNatRules.current.rules.delete(chain);
            }
            setDNatRules({ ...refDNatRules.current });
            setbadgeOnSave(true);
          }
        }
      },
    });
  }

  function onToggleRule(chain: string, row: number) {
    let filtertable = refCustomRules.current.rules.get(chain);
    if (filtertable !== undefined) {
      filtertable.rules[row].active = !filtertable.rules[row].active;
      setCustomRules({ ...refCustomRules.current });
      setbadgeOnSave(true);
    }
  }

  function onToggleSNatRule(chain: string, row: number) {
    let nattable = refSNatRules.current.rules.get(chain);
    if (nattable !== undefined) {
      nattable.rules[row].active = !nattable.rules[row].active;
      setSNatRules({ ...refSNatRules.current });
      setbadgeOnSave(true);
    }
  }

  function onToggleDNatRule(chain: string, row: number) {
    let nattable = refDNatRules.current.rules.get(chain);
    if (nattable !== undefined) {
      nattable.rules[row].active = !nattable.rules[row].active;
      setDNatRules({ ...refDNatRules.current });
      setbadgeOnSave(true);
    }
  }

  function handleListSelect(item: string) {
    refListSelectionDialog.current.selected.push(item);
    refListSelectionDialog.current.selected.sort(Intl.Collator().compare);
    refListSelectionDialog.current.unselected = refListSelectionDialog.current.unselected.filter(
      (value) => value !== item
    );
    setListSelectionDialog({ ...refListSelectionDialog.current });
  }

  function handleListDeselect(item: string) {
    refListSelectionDialog.current.unselected.push(item);
    refListSelectionDialog.current.unselected.sort(Intl.Collator().compare);
    refListSelectionDialog.current.selected = refListSelectionDialog.current.selected.filter((value) => value !== item);
    setListSelectionDialog({ ...refListSelectionDialog.current });
  }

  function handleLookupHost(host: string) {
    FetchData(URLServer + "lookup/" + host, LookupHostCallback);
  }

  function LookupHostCallback(json_any: any) {
    const json = Object.assign({}, json_any);
    if (
      Object.hasOwn(json, "host") &&
      Object.hasOwn(json, "ipv4") &&
      Object.hasOwn(json, "ipv6") &&
      typeof json.host == "string" &&
      typeof json.ipv4 == "string" &&
      typeof json.ipv6 == "string"
    ) {
      let entry = refHosts.current.hosts.get(json.host);
      if (entry !== undefined) {
        if (json.ipv4 != "") {
          entry.ipv4 = json.ipv4.split(" ");
        }
        if (json.ipv6 != "") {
          entry.ipv6 = json.ipv6.split(" ");
        }
        refHosts.current.hosts.set(json.host, entry);
        setHosts(refHosts.current);
        setbadgeOnSave(true);
      }
    } else {
      AlertError("Unexpected response from server");
    }
  }

  function FetchConfigsCallback(json: any) {
    let configslist: string[] = [];
    if (isArray(json)) {
      let safeArray: any[] = json;
      safeArray.map((obj: any) => {
        if (typeof obj === "string") {
          configslist.push(hexDecode(obj));
        } else {
          AlertError("Unexpected response from server");
        }
      });
      if (configslist.length > 0) {
        setConfigName(configslist[0]);
        LoadConfig(configslist[0]);
      }
      setConfigs(CaseInsensitiveSort(configslist));
    } else {
      AlertError("Unexpected response from server");
    }
  }

  function UsersCallback(json: any) {
    if (isArray(json)) {
      let safeArray: any[] = json;
      refSettingsDialog.current.users = CaseInsensitiveSort(safeArray);
      setSettingsDialog({ ...refSettingsDialog.current });
    }
  }

  function UserExistsCallback(result: any) {
    if (result === "NOK") {
      FetchData(URLServer + "newtotpsecret", NewTotpCallback);
      refAddUserDialog.current.open = true;
      refAddUserDialog.current.firstUser = true;
      setAddUserDialog({ ...refAddUserDialog.current });
    } else {
      refLoginDialog.current.open = true;
      setLoginDialog({ ...refLoginDialog.current });
    }
  }

  function DeleteUserCallback(json: any) {
    if (isArray(json)) {
      let safeArray: any[] = json;
      refSettingsDialog.current.users = CaseInsensitiveSort(safeArray);
      setSettingsDialog({ ...refSettingsDialog.current });
    }
  }

  function NewTotpCallback(totp_any: any) {
    const totp = Object.assign({}, totp_any);
    if (
      Object.hasOwn(totp, "secret") &&
      Object.hasOwn(totp, "svg") &&
      typeof totp.secret == "string" &&
      typeof totp.svg == "string"
    ) {
      refAddUserDialog.current.secret = totp.secret;
      let svgparts = totp.svg.split(' d="');
      if (svgparts.length > 1) {
        refAddUserDialog.current.svg = svgparts[1].substring(0, svgparts[1].length - 9);
        setAddUserDialog({ ...refAddUserDialog.current });
      } else {
        AlertError("Unexpected response from server");
      }
    } else {
      AlertError("Unexpected response from server");
    }
  }

  function HandleEditService(service: string) {
    let portDef = refServices.current.portlist.get(service);
    if (portDef === undefined) {
      refPortDialog.current.value = "";
      refPortDialog.current.protocol = "TCP";
    } else {
      refPortDialog.current.value = portDef.port.toString();
      refPortDialog.current.protocol = portDef.protocol;
    }
    refPortDialog.current.open = true;
    refPortDialog.current.title = service;
    refPortDialog.current.warning = "";
    refPortDialog.current.onOK = HandleEditPortOK;
    setPortDialog({ ...refPortDialog.current });
  }

  function EditIPv4NetworkNameOK() {
    let oldname = TextDialogGetTitle();
    const newname = TextDialogGetValue();
    if (AddresTypeNameOK(newname)) {
      let data = refNetwork.current.ipv4.get(oldname);
      if (data !== undefined) {
        refNetwork.current.ipv4.delete(oldname);
        refNetwork.current.ipv4 = InsertIntoSortedMap<string>(refNetwork.current.ipv4, newname, data);
        setbadgeOnSave(true);
      }
      CloseTextDialog();
    }
  }

  function HandleEditIPv4Network(name: string) {
    let addr = "";
    let result = refNetwork.current.ipv4.get(name);
    if (result !== undefined) {
      addr = result;
    }
    OpenTextDialog(name, "Enter network in CIDR notation, like 192.168.1.0/24", addr, HandleEditIPv4NetworkOK);
  }

  function HandleEditIPv4NetworkOK() {
    let name = TextDialogGetTitle();
    const newip = TextDialogGetValue();
    const result = Validator.isValidIPv4CidrNotation(newip);
    if (!result[0]) {
      TextDialogSetWarning(newip + " is not a valid CIDR notation");
    } else {
      refNetwork.current.ipv4.set(name, newip);
      setbadgeOnSave(true);
      CloseTextDialog();
    }
  }

  function HandleDeleteIPv4Network(name: string) {
    setConfirmDialog({
      open: true,
      title: "",
      text: "Delete network " + name + "?",
      onClose: (ok: boolean) => {
        closeConfirmDialog();
        if (ok) {
          refNetwork.current.ipv4.delete(name);
          setNetworks(refNetwork.current);
          setbadgeOnSave(true);
        }
      },
    });
  }

  function EditIPv6NetworkNameOK() {
    let oldname = TextDialogGetTitle();
    const newname = TextDialogGetValue();
    if (AddresTypeNameOK(newname)) {
      let data = refNetwork.current.ipv6.get(oldname);
      if (data !== undefined) {
        refNetwork.current.ipv6.delete(oldname);
        refNetwork.current.ipv6 = InsertIntoSortedMap<string>(refNetwork.current.ipv6, newname, data);
        setbadgeOnSave(true);
      }
      CloseTextDialog();
    }
  }

  function HandleEditIPv6Network(name: string) {
    let addr = "";
    let result = refNetwork.current.ipv6.get(name);
    if (result !== undefined) {
      addr = result;
    }
    OpenTextDialog(name, "Enter network in CIDR notation, like 2001:db8::/32", addr, HandleEditIPv6NetworkOK);
  }

  function HandleEditIPv6NetworkOK() {
    let name = TextDialogGetTitle();
    const newip = TextDialogGetValue();
    const result = Validator.isValidIPv6CidrNotation(newip);
    if (!result[0]) {
      TextDialogSetWarning(newip + " is not a valid CIDR notation");
    } else {
      refNetwork.current.ipv6.set(name, newip);
      setbadgeOnSave(true);
      CloseTextDialog();
    }
  }

  function HandleDeleteIPv6Network(name: string) {
    setConfirmDialog({
      open: true,
      title: "",
      text: "Delete network " + name + "?",
      onClose: (ok: boolean) => {
        closeConfirmDialog();
        if (ok) {
          refNetwork.current.ipv6.delete(name);
          setNetworks(refNetwork.current);
          setbadgeOnSave(true);
        }
      },
    });
  }

  function handleDeleteHostGroup(group: string) {
    setConfirmDialog({
      open: true,
      title: "",
      text: "Delete host group " + group + "?",
      onClose: (ok: boolean) => {
        closeConfirmDialog();
        if (ok) {
          refHostGroups.current.groups.delete(group);
          setHostGroups(refHostGroups.current);
          setbadgeOnSave(true);
        }
      },
    });
  }

  function handleUpdateHostGroup(group: string) {
    refListSelectionDialog.current.open = true;
    refListSelectionDialog.current.title = group;
    refListSelectionDialog.current.text_unselected = "Available";
    refListSelectionDialog.current.text_selected = " In Group";
    refListSelectionDialog.current.unselected = [];
    refListSelectionDialog.current.selected = [];
    refListSelectionDialog.current.onOK = HandleHostGroupOK;
    let hostlist = refHostGroups.current.groups.get(group);
    if (hostlist === undefined) {
      hostlist = [];
    }
    for (const host of refHosts.current.hosts.keys()) {
      if (hostlist.includes(host)) {
        refListSelectionDialog.current.selected.push(host);
      } else {
        refListSelectionDialog.current.unselected.push(host);
      }
    }
    setListSelectionDialog({ ...refListSelectionDialog.current });
  }

  function CloseListSelectionDialog() {
    refListSelectionDialog.current.open = false;
    setListSelectionDialog({ ...refListSelectionDialog.current });
  }

  function HandleNewInterfaceNameOK() {
    let oldname = TextDialogGetTitle();
    const newname = TextDialogGetValue();
    if (refInterfaces.current.interfacesList.has(newname)) {
      TextDialogSetWarning("Interface " + newname + " already present.");
    } else {
      let data = refInterfaces.current.interfacesList.get(oldname);
      if (data !== undefined) {
        refInterfaces.current.interfacesList.delete(oldname);
        refInterfaces.current.interfacesList = InsertIntoSortedMap<InterfaceListItem>(
          refInterfaces.current.interfacesList,
          newname,
          data
        );
        setbadgeOnSave(true);
      }
      CloseTextDialog();
    }
  }

  function HandleEditPortOK() {
    let portnr = parseInt(refPortDialog.current.value);
    if (isNaN(portnr) || portnr < 1 || portnr > 65535) {
      refPortDialog.current.warning = "Port number must be between 1 and 65535.";
      setPortDialog(Object.assign({}, refPortDialog.current));
      return;
    }
    refServices.current.portlist.set(refPortDialog.current.title, {
      port: portnr,
      protocol: refPortDialog.current.protocol,
      default: false,
    });

    setServices(refServices.current);
    setbadgeOnSave(true);
    closePortDialog();
  }

  function HandleNewConfigurationOK() {
    setConfigName("[Untitled]");
    refInterfaces.current.interfacesList.clear();
    setInterfaces(refInterfaces.current);
    refHosts.current.hosts.clear();
    setHosts(refHosts.current);
    refHostGroups.current.groups.clear();
    setHostGroups(refHostGroups.current);
    refNetwork.current.ipv4.clear();
    refNetwork.current.ipv6.clear();
    setNetworks(refNetwork.current);
    refServices.current.portlist = defaultportlist;
    setServices(refServices.current);
    refChains.current.chainsList.clear();
    setChains(refChains.current);
    refDefaults.current.inactiveList = [];
    setDefaults(refDefaults.current);
    refCustomRules.current.rules.clear();
    setCustomRules(refCustomRules.current);
    refManualFilter.current.pre = "";
    refManualFilter.current.post = "";
    setManualFilter(refManualFilter.current);
    refSNatRules.current.rules.clear();
    setSNatRules(refSNatRules.current);
    refDNatRules.current.rules.clear();
    setDNatRules(refDNatRules.current);
    setbadgeOnSave(false);
  }

  function HandleSaveAsConfigurationOK() {
    let text = TextDialogGetValue();
    if (configs.includes(text)) {
      TextDialogSetWarning("Configuration " + text + " already present.");
    } else if (text == configName) {
      TextDialogSetWarning("Configuration " + text + " already loaded.");
    } else {
      if (text != "") {
        setConfigName(text);
        postToServer("save", Config2json(), SaveToServerCallback);
        setConfigs(CaseInsensitiveSort([...configs, text]));
      }
      CloseTextDialog();
    }
  }

  function HandleNewButtonClick() {
    if (badgeOnSave) {
      setConfirmDialog({
        open: true,
        title: "",
        text: "Unsaved changes will be lost.",
        onClose: (ok: boolean) => {
          closeConfirmDialog();
          if (ok) {
            HandleNewConfigurationOK();
          }
        },
      });
    } else {
      HandleNewConfigurationOK();
    }
  }

  function HandleSaveButtonClick() {
    if (configName == "[Untitled]") {
      HandleSaveAsButtonClick();
    } else {
      if (!configs.includes(configName)) {
        setConfigs(CaseInsensitiveSort([...configs, configName]));
      }
      postToServer("save", Config2json(), SaveToServerCallback);
    }
  }

  function HandleSaveAsButtonClick() {
    OpenTextDialog(
      "New Configuration Name",
      "Enter the new name of the configuration.",
      "",
      HandleSaveAsConfigurationOK
    );
  }

  function HandleEditServicename(servicename: string) {
    OpenTextDialog(servicename, "Enter the new name of the service.", servicename, EditServicenameOK);
  }

  function HandleEditHostGroupname(group: string) {
    OpenTextDialog(group, "Enter the new name of the group.", group, EditHostGroupnameOK);
  }

  function HandleEditIPV4(host: string) {
    let addrs_arr = refHosts.current.hosts.get(host);
    let addrs = "";
    if (addrs_arr !== undefined) {
      addrs = addrs_arr.ipv4.join("\n");
    }
    OpenMultiLineTextDialog(host, "Enter IPv4 addresses, one per line.", addrs, EditIPv4OK);
  }

  function HandleEditIPV6(host: string) {
    let addrs_arr = refHosts.current.hosts.get(host);
    let addrs = "";
    if (addrs_arr !== undefined) {
      addrs = addrs_arr.ipv6.join("\n");
    }
    OpenMultiLineTextDialog(host, "Enter IPv6 addresses, one per line.", addrs, EditIPv6OK);
  }

  function AddresTypeNameOK(name: string): boolean {
    if (refHosts.current.hosts.has(name)) {
      TextDialogSetWarning("Name " + name + " already used by a host");
      return false;
    }
    if (refHostGroups.current.groups.has(name)) {
      TextDialogSetWarning("Name " + name + " already used by a host group");
      return false;
    }
    if (refNetwork.current.ipv4.has(name)) {
      TextDialogSetWarning("Name " + name + " already used by an ipv4 network");
      return false;
    }
    if (refNetwork.current.ipv6.has(name)) {
      TextDialogSetWarning("Name " + name + " already used by an ipv6 network");
      return false;
    }
    return true;
  }

  function EditHostnameOK() {
    let oldname = TextDialogGetTitle();
    const newname = TextDialogGetValue();
    if (AddresTypeNameOK(newname)) {
      let data = refHosts.current.hosts.get(oldname);
      if (data !== undefined) {
        refHosts.current.hosts.delete(oldname);
        refHosts.current.hosts = InsertIntoSortedMap<HostAdresses>(refHosts.current.hosts, newname, data);
        setbadgeOnSave(true);
      }
      CloseTextDialog();
    }
  }

  function EditServicenameOK() {
    let oldname = TextDialogGetTitle();
    const newname = TextDialogGetValue();
    if (refServices.current.portlist.has(newname) || ICMPv4.includes(newname) || ICMPv6.includes(newname)) {
      TextDialogSetWarning(newname + " already present in services");
    } else {
      let data = refServices.current.portlist.get(oldname);
      if (data !== undefined) {
        refServices.current.portlist.delete(oldname);
        refServices.current.portlist = InsertIntoSortedMap<ServiceDef>(refServices.current.portlist, newname, data);
        setbadgeOnSave(true);
      }
      CloseTextDialog();
    }
  }

  function EditHostGroupnameOK() {
    const oldname = TextDialogGetTitle();
    const newname = TextDialogGetValue();
    if (AddresTypeNameOK(newname)) {
      let data = refHostGroups.current.groups.get(oldname);
      if (data !== undefined) {
        refHostGroups.current.groups.delete(oldname);
        refHostGroups.current.groups = InsertIntoSortedMap<string[]>(refHostGroups.current.groups, newname, data);
        setbadgeOnSave(true);
      }
      CloseTextDialog();
    }
  }

  function EditIPv4OK() {
    let ips = TextDialogGetValue().split("\n");
    let allvalid = true;
    ips.forEach((ip) => {
      let valid = Validator.isValidIPv4String(ip);
      if (!valid[0]) {
        allvalid = false;
        TextDialogSetWarning(ip + " is not a valid ipv4 address");
      }
    });
    if (allvalid) {
      let host = TextDialogGetTitle();
      let data = refHosts.current.hosts.get(host);
      if (data !== undefined) {
        data.ipv4 = TextDialogGetValue().split("\n");
        refHosts.current.hosts.set(host, data);
        setbadgeOnSave(true);
        CloseTextDialog();
      } else {
        TextDialogSetWarning("Internal error: could not find host");
      }
    }
  }

  function EditIPv6OK() {
    let ips = TextDialogGetValue().split("\n");
    let allvalid = true;
    ips.forEach((ip) => {
      let valid = Validator.isValidIPv6String(ip);
      if (!valid[0]) {
        allvalid = false;
        TextDialogSetWarning(ip + " is not a valid ipv6 address");
      }
    });
    if (allvalid) {
      let host = TextDialogGetTitle();
      let data = refHosts.current.hosts.get(host);
      if (data !== undefined) {
        data.ipv6 = TextDialogGetValue().split("\n");
        refHosts.current.hosts.set(host, data);
        setbadgeOnSave(true);
        CloseTextDialog();
      } else {
        TextDialogSetWarning("Internal error: could not find host");
      }
    }
  }

  function HandleHostGroupOK() {
    let group = refListSelectionDialog.current.title;
    refHostGroups.current.groups.delete(group);
    refHostGroups.current.groups.set(group, refListSelectionDialog.current.selected);
    setHostGroups(Object.assign({}, refHostGroups.current));
    setbadgeOnSave(true);
    CloseListSelectionDialog();
  }

  function HandleAddHostOK() {
    let text = TextDialogGetValue();
    if (AddresTypeNameOK(text)) {
      if (text != "") {
        setbadgeOnSave(true);
        // insert while keeping order alphabetical
        refHosts.current.hosts = InsertIntoSortedMap<HostAdresses>(refHosts.current.hosts, text, {
          ipv4: [],
          ipv6: [],
        });
        setHosts(Object.assign({}, refHosts.current));
      }
      CloseTextDialog();
    }
  }

  function HandleAddServiceOK() {
    let text = TextDialogGetValue();
    if (refServices.current.portlist.has(text) || ICMPv4.includes(text) || ICMPv6.includes(text)) {
      TextDialogSetWarning("Service " + text + " already present.");
    } else {
      if (text != "") {
        setbadgeOnSave(true);
        // insert while keeping order alphabetical
        let newservices = new Map<string, ServiceDef>();
        for (const sv of refServices.current.portlist.keys()) {
          if (text.toUpperCase() < sv.toUpperCase()) {
            newservices.set(text, {
              port: 0,
              protocol: "TCP",
              default: false,
            });
          }
          let ports = refServices.current.portlist.get(sv);
          if (ports !== undefined) {
            newservices.set(sv, ports);
          }
        }
        if (newservices.size == refServices.current.portlist.size) {
          // append at the end
          newservices.set(text, {
            port: 0,
            protocol: "TCP",
            default: false,
          });
        }
        refServices.current.portlist = newservices;
        setServices(Object.assign({}, refServices.current));
      }
      CloseTextDialog();
    }
  }

  function HandleAddHostGroupOK() {
    let text = TextDialogGetValue();
    if (AddresTypeNameOK(text)) {
      if (text != "") {
        setbadgeOnSave(true);
        // insert while keeping order alphabetical
        refHostGroups.current.groups = InsertIntoSortedMap<string[]>(refHostGroups.current.groups, text, []);
        setHostGroups(Object.assign({}, refHostGroups.current));
      }
      CloseTextDialog();
    }
  }

  function HandleAddIPv4NetworkNameOK() {
    let text = TextDialogGetValue();
    if (AddresTypeNameOK(text)) {
      if (text != "") {
        setbadgeOnSave(true);
        // insert while keeping order alphabetical
        refNetwork.current.ipv4 = InsertIntoSortedMap<string>(refNetwork.current.ipv4, text, "");
        setNetworks(Object.assign({}, refNetwork.current));
      }
      CloseTextDialog();
    }
  }

  function HandleAddIPv6NetworkNameOK() {
    let text = TextDialogGetValue();
    if (AddresTypeNameOK(text)) {
      if (text != "") {
        setbadgeOnSave(true);
        // insert while keeping order alphabetical
        refNetwork.current.ipv6 = InsertIntoSortedMap<string>(refNetwork.current.ipv6, text, "");
        setNetworks(Object.assign({}, refNetwork.current));
      }
      CloseTextDialog();
    }
  }

  function LoadConfig(name: string) {
    FetchData(URLServer + "load/" + hexEncode(name), LoadConfigCallback);
  }

  function DownloadConfig(name: string) {
    FetchData(URLServer + "load/" + hexEncode(name), DownloadConfigCallback);
  }

  function DownloadConfigCallback(json_any: any) {
    const json = Object.assign({}, json_any);
    if (
      Object.hasOwn(json, "name") &&
      Object.hasOwn(json, "json") &&
      typeof json.name == "string" &&
      typeof json.json == "string"
    ) {
      if (json.name == "") {
        AlertError(json.json);
      } else {
        //setConfigName(hexDecode(json.name));

        const blob = new Blob([json.json], { type: `application/json;charset=utf-8;` });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", hexDecode(json.name) + ".json");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  function LoadConfigCallback(json_any: any) {
    const json = Object.assign({}, json_any);
    if (
      Object.hasOwn(json, "name") &&
      Object.hasOwn(json, "json") &&
      typeof json.name == "string" &&
      typeof json.json == "string"
    ) {
      if (json.name == "") {
        AlertError(json.json);
      } else {
        setConfigName(hexDecode(json.name));
        setbadgeOnSave(false);
        let data = JSON.parse(json.json); // TODO test for fields
        refInterfaces.current.interfacesList = new Map(Object.entries(data.interfaces));
        setInterfaces(refInterfaces.current);
        refHosts.current.hosts = new Map(Object.entries(data.hosts));
        setHosts(refHosts.current);
        refHostGroups.current.groups = new Map(Object.entries(data.hostgroups));
        setHostGroups(refHostGroups.current);
        refNetwork.current.ipv4 = new Map(Object.entries(data.ipv4networks));
        refNetwork.current.ipv6 = new Map(Object.entries(data.ipv6networks));
        setNetworks(refNetwork.current);
        refServices.current.portlist = new Map(Object.entries(data.services));
        setServices(refServices.current);
        refChains.current.chainsList = new Map(Object.entries(data.chains));
        setChains(refChains.current);
        refDefaults.current.inactiveList = data.inactive_defaults || [];
        setDefaults(refDefaults.current);
        let filters: CustomRulesSaveType = data.filters;
        refCustomRules.current.rules.clear();
        filters.filtertables.map(function (table) {
          refCustomRules.current.rules.set(table.chain, {
            rules: table.rules,
            visible: false,
            deleted: table.deleted,
            defaultpolicy: table.policy,
            chain: table.chain,
            observer: observer,
            onStartDrag: onStartDragValueOut,
            onChangeAction: onChangeAction,
            onEditComment: onEditComment,
            onDeleteRule: onDeleteRule,
            onToggleRule: onToggleRule,
          });
        });
        refCustomRules.current.dragpos = filters.dragpos;
        setCustomRules({ ...refCustomRules.current });

        let snat: NatRulesSaveType = data.snat;
        refSNatRules.current.rules.clear();
        snat.nattables.map(function (table) {
          refSNatRules.current.rules.set(table.chain, {
            rules: table.rules,
            visible: false,
            deleted: table.deleted,
            defaultpolicy: table.policy,
            chain: table.chain,
            direction: "Source",
            observer: observer,
            onStartDrag: onStartDragValueOut,
            onChangeAction: onChangeAction,
            onEditComment: onEditSNatComment,
            onDeleteRule: onDeleteSNatRule,
            onToggleRule: onToggleSNatRule,
          });
        });
        refSNatRules.current.dragpos = snat.dragpos;
        setSNatRules({ ...refSNatRules.current });

        let dnat: NatRulesSaveType = data.dnat;
        refDNatRules.current.rules.clear();
        dnat.nattables.map(function (table) {
          refDNatRules.current.rules.set(table.chain, {
            rules: table.rules,
            visible: false,
            deleted: table.deleted,
            defaultpolicy: table.policy,
            chain: table.chain,
            direction: "Destination",
            observer: observer,
            onStartDrag: onStartDragValueOut,
            onChangeAction: onChangeAction,
            onEditComment: onEditDNatComment,
            onDeleteRule: onDeleteDNatRule,
            onToggleRule: onToggleDNatRule,
          });
        });
        refDNatRules.current.dragpos = dnat.dragpos;
        setDNatRules({ ...refDNatRules.current });

        refManualFilter.current.pre = data.pre;
        refManualFilter.current.post = data.post;
        setManualFilter(refManualFilter.current);
        refLogging.current.loggingtype = data.loggingtype || "none";
        setLogging({ ...refLogging.current });
        refFloatingChecks.current.dragpos = data.checksdragpos;
        setFloatingChecks({ ...refFloatingChecks.current });
      }
    } else {
      AlertError("Unexpected response from server");
    }
  }

  function handleLoadConfig(config: string) {
    if (badgeOnSave) {
      setConfirmDialog({
        open: true,
        title: "",
        text: "Unsaved changes will be lost.",
        onClose: (ok: boolean) => {
          closeConfirmDialog();
          if (ok) {
            LoadConfig(config);
          }
        },
      });
    } else {
      LoadConfig(config);
    }
  }

  function closeConfirmDialog() {
    setConfirmDialog({
      open: false,
      title: "",
      text: "",
      onClose: () => {},
    });
  }

  function handleOnChangePortDialog(text: string) {
    let regex = /^\d+$/; // only digits allowed
    if (!regex.test(text) && text != "") {
      refPortDialog.current.warning = "Only digits allowed";
    } else {
      refPortDialog.current.warning = "";
    }
    refPortDialog.current.value = text;
    setPortDialog({ ...refPortDialog.current });
  }

  function handleOnChangeProtocol(text: string) {
    refPortDialog.current.protocol = text;
    setPortDialog({ ...refPortDialog.current });
  }

  function closePortDialog() {
    refPortDialog.current.open = false;
    refPortDialog.current.warning = "";
    refPortDialog.current.value = "";
    setPortDialog({ ...refPortDialog.current });
  }

  function closeAddUserDialog() {
    refAddUserDialog.current.open = false;
    setAddUserDialog({ ...refAddUserDialog.current });
  }

  function handleDeleteConfig(config: string) {
    setConfirmDialog({
      open: true,
      title: "",
      text: "Delete configuration " + config + "?",
      onClose: (ok: boolean) => {
        closeConfirmDialog();
        if (ok) {
          setConfigs(
            configs.filter((element, _index, _array) => {
              return element != config;
            })
          );
          if (config == configName) setbadgeOnSave(true);
          FetchData(URLServer + "delete/" + hexEncode(config), FetchCallback);
        }
      },
    });
  }

  function handleDeleteHost(host: string) {
    setConfirmDialog({
      open: true,
      title: "",
      text: "Delete host " + host + "?",
      onClose: (ok: boolean) => {
        closeConfirmDialog();
        if (ok) {
          refHosts.current.hosts.delete(host);
          setHosts(refHosts.current);
          setbadgeOnSave(true);
        }
      },
    });
  }

  function handleDeleteService(sv: string) {
    setConfirmDialog({
      open: true,
      title: "",
      text: "Delete service " + sv + "?",
      onClose: (ok: boolean) => {
        closeConfirmDialog();
        if (ok) {
          refServices.current.portlist.delete(sv);
          setServices(refServices.current);
          setbadgeOnSave(true);
        }
      },
    });
  }

  function HandleDeleteChain(chain: string) {
    let text = "Delete chain " + chain + "?";
    let found = false;
    let data = refCustomRules.current.rules.get(chain);
    if (data !== undefined && !data.deleted && data.rules.length > 0) {
      found = true;
    }
    let snatdata = refSNatRules.current.rules.get(chain);
    if (snatdata !== undefined && !snatdata.deleted && snatdata.rules.length > 0) {
      found = true;
    }
    let dnatdata = refDNatRules.current.rules.get(chain);
    if (dnatdata !== undefined && !dnatdata.deleted && dnatdata.rules.length > 0) {
      found = true;
    }
    if (found) {
      text = " There are rules connected to this chain.\n" + text;
    }
    setConfirmDialog({
      open: true,
      title: "",
      text: text,
      onClose: (ok: boolean) => {
        closeConfirmDialog();
        if (ok) {
          refChains.current.chainsList.delete(chain);
          setChains({ ...refChains.current });
          let data = refCustomRules.current.rules.get(chain);
          if (data !== undefined) {
            data.deleted = true;
            refCustomRules.current.rules.set(chain, data);
            setCustomRules({ ...refCustomRules.current });
          }
          let snatdata = refSNatRules.current.rules.get(chain);
          if (snatdata !== undefined) {
            snatdata.deleted = true;
            refSNatRules.current.rules.set(chain, snatdata);
            setSNatRules({ ...refSNatRules.current });
          }
          let dnatdata = refDNatRules.current.rules.get(chain);
          if (dnatdata !== undefined) {
            dnatdata.deleted = true;
            refDNatRules.current.rules.set(chain, dnatdata);
            setDNatRules({ ...refDNatRules.current });
          }
          setbadgeOnSave(true);
        }
      },
    });
  }

  function FetchCallback(str: any) {
    if (typeof str === "string" && str != "OK") {
      AlertError(str);
    }
  }

  function HandleCheckButtonClick() {
    refFloatingChecks.current.visible = true;
    setFloatingChecks({ ...refFloatingChecks.current });
    // get interfaces and run checks
    FetchData(URLServer + "interfaces", RunChecks);
  }

  function RunChecks(json: any) {
    let interfaces: string[] = [];
    if (isArray(json)) {
      let safeArray: any[] = json;
      safeArray.map((obj: any, _index: number) => {
        if (isInterface(obj)) {
          let nwi: NwInterface = obj as NwInterface;
          interfaces.push(nwi.name);
        }
      });
    }
    RunAllChecks(
      refFloatingChecks.current,
      interfaces,
      refInterfaces.current,
      refChains.current,
      refCustomRules.current,
      refSNatRules.current,
      refDNatRules.current,
      refHosts.current,
      refHostGroups.current,
      refNetwork.current,
      refServices.current
    );
  }

  function HandleInstallButtonClick() {
    refFloatingInstall.current.visible = true;
    setFloatingInstall({ ...refFloatingInstall.current });

    // install firewall and show output
    postToServer("install", Config2json(), InstallCallback);
  }

  function InstallCallback(result: any) {
    console.log(result);
    type InstallResultType = { result: string[]; script: string[] };

    // Validate this value with a custom type guard function
    function isInstallResult(o: any): o is InstallResultType {
      return (
        "script" in o &&
        isArray(o.script) &&
        o.script.every((item: any) => typeof item === "string") &&
        "result" in o &&
        isArray(o.result) &&
        o.result.every((item: any) => typeof item === "string")
      );
    }

    //const parsed = JSON.parse(result);
    if (isInstallResult(result)) {
      refFloatingInstall.current.script = result.script;
      refFloatingInstall.current.result = result.result;
    } else {
      // error handling; invalid data format
      AlertError("Unexpected result from server");
    }

    setFloatingInstall({ ...refFloatingInstall.current });
  }

  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }

  useEffect(() => {
    if (!has_run_at_start) {
      has_run_at_start = true;
      InitTextDialogState(setTextDialog);
      InitFloatingChecksState(refFloatingChecks.current, setFloatingChecks, onStartDragList, () => {
        refFloatingChecks.current.visible = false;
        setFloatingChecks({ ...refFloatingChecks.current });
      });
      // skip when developing locally
      if (location.host != "localhost:5173") {
        FetchData(URLServer + "userexists", UserExistsCallback);
      }
      document.addEventListener("mousemove", onMouseMove, { passive: true, capture: true });
      document.addEventListener("mouseup", onMouseUp);
      document.addEventListener("click", setLogoutTimer);
      document.addEventListener("dblclick", setLogoutTimer);
      document.addEventListener("mouseover", setLogoutTimer);
      document.addEventListener("input", setLogoutTimer);
      document.addEventListener("keypress", setLogoutTimer);
      axios.defaults.withCredentials = true;
    }
    return () => {};
  }, []);

  function CustomRulesData(): CustomRulesPanelProps {
    let crpprops = refCustomRules.current;
    crpprops.active = [];
    refChains.current.chainsList.forEach((value: ChainItem, name: string) => {
      if (value.filter) {
        crpprops.active.push(name);
      }
    });
    crpprops.hosts = Array.from(refHosts.current.hosts.keys());
    crpprops.hostgroups = Array.from(refHostGroups.current.groups.keys());
    crpprops.networks = Array.from(refNetwork.current.ipv4.keys()).concat(Array.from(refNetwork.current.ipv6.keys()));
    crpprops.services = Array.from(refServices.current.portlist.keys());
    return crpprops;
  }

  function SNatRulesData(): SNatRulesProps {
    let snrprops = refSNatRules.current;
    snrprops.active = [];
    refChains.current.chainsList.forEach((value: ChainItem, name: string) => {
      if (value.snat) {
        snrprops.active.push(name);
      }
    });
    snrprops.hosts = Array.from(refHosts.current.hosts.keys());
    snrprops.hostgroups = Array.from(refHostGroups.current.groups.keys());
    snrprops.networks = Array.from(refNetwork.current.ipv4.keys()).concat(Array.from(refNetwork.current.ipv6.keys()));
    snrprops.services = Array.from(refServices.current.portlist.keys());
    return snrprops;
  }

  function DNatRulesData(): DNatRulesProps {
    let dnrprops = refDNatRules.current;
    dnrprops.active = [];
    refChains.current.chainsList.forEach((value: ChainItem, name: string) => {
      if (value.dnat) {
        dnrprops.active.push(name);
      }
    });
    dnrprops.hosts = Array.from(refHosts.current.hosts.keys());
    dnrprops.hostgroups = Array.from(refHostGroups.current.groups.keys());
    dnrprops.networks = Array.from(refNetwork.current.ipv4.keys()).concat(Array.from(refNetwork.current.ipv6.keys()));
    dnrprops.services = Array.from(refServices.current.portlist.keys());
    return dnrprops;
  }

  async function HandleUpload(files: FileList) {
    if (files.length > 0) {
      let filename = await files.item(0)?.name;
      if (filename) {
        if (filename?.endsWith(".json")) {
          filename = filename.substring(0, filename.length - 5);
        }
        while (refConfigs.current.includes(filename)) {
          filename = filename.concat("+");
        }
        const json = await files.item(0)?.text();
        if (filename && json) {
          let conf: Configuration = {
            name: hexEncode(filename),
            json: json,
          };
          postToServer("save", conf, () => {
            FetchData(URLServer + "configs", FetchConfigsCallback);
          });
        }
      }
    }
  }

  function Logout() {
    setCurrentUser("");
    refLoginDialog.current.open = true;
    setLoginDialog({ ...refLoginDialog.current });
    FetchData(URLServer + "logout", (any: any) => {
      console.log(any);
    });
  }

  const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <AlertBar {...alertBar} />
        <FloatingValue {...floatingValue} />
        <TitleBar configname={configName} current_user={currentUser} onLogout={Logout} />
        <Grid
          container
          spacing={8}
          direction="row"
          sx={{
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          <ToolBarButton label="New" icon={<AddIcon />} badge={false} onClick={HandleNewButtonClick} />
          <ToolBarButton label="Save" icon={<SaveIcon />} badge={badgeOnSave} onClick={HandleSaveButtonClick} />
          <ToolBarButton label="Save as" icon={<SaveasIcon />} badge={false} onClick={HandleSaveAsButtonClick} />
          <ToolBarButton label="Check" icon={<RuleIcon />} badge={false} onClick={HandleCheckButtonClick} />
          <ToolBarButton label="Install" icon={<InstallIcon />} badge={false} onClick={HandleInstallButtonClick} />
          <Button component="label" variant="contained" startIcon={<UploadIcon />} sx={{ width: "130px" }}>
            Upload
            <VisuallyHiddenInput
              type="file"
              onChange={(event) => {
                if (event.target.files) {
                  HandleUpload(event.target.files);
                }
              }}
            />
          </Button>
          <ToolBarButton
            label="Settings"
            icon={<SettingsIcon />}
            badge={false}
            onClick={function () {
              refSettingsDialog.current.open = true;
              setSettingsDialog({ ...refSettingsDialog.current });
            }}
          />
        </Grid>
        <TextDialog {...textDialog} />
        <PortDialog {...portDialog} />
        <AddUserDialog {...addUserDialog} />
        <LoginDialog {...loginDialog} />
        <SettingsDialog {...settingsDialog} />
        <ListSelectionDialog {...listSelectionDialog} />
        <ConfirmDialog {...confirmDialog} />
        <Loading open={loading} />
        <FloatingChecks {...floatingChecks} />
        <FloatingInstall {...floatingInstall} />
        <Box sx={{ borderBottom: 1, borderColor: "divider", marginTop: "1rem" }}>
          <Tabs value={activeTab} onChange={handleChange} aria-label="basic tabs">
            <Tab label="Configurations" {...a11yProps(0)} />
            <Tab label="Definitions" {...a11yProps(1)} />
            <Tab label="Chains" {...a11yProps(2)} />
            <Tab label="Filter" {...a11yProps(3)} />
            <Tab label="NAT" {...a11yProps(4)} />
            <Tab label="Log" {...a11yProps(5)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={activeTab} index={0}>
          <ConfigurationsPanel
            configs={configs}
            onDelete={handleDeleteConfig}
            onLoad={handleLoadConfig}
            onDownload={DownloadConfig}
          />
        </CustomTabPanel>

        <CustomTabPanel value={activeTab} index={1}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={activeTab2} onChange={handleChange2} aria-label="basic tabs">
              <Tab label="Interfaces" {...a11yProps(10)} />
              <Tab label="Hosts" {...a11yProps(11)} />
              <Tab label="Host Groups" {...a11yProps(12)} />
              <Tab label="Networks" {...a11yProps(13)} />
              <Tab label="Services" {...a11yProps(14)} />
            </Tabs>
          </Box>
          <CustomTabPanel value={activeTab2} index={0}>
            <InterfacesPanel {...interfaces} />
          </CustomTabPanel>
          <CustomTabPanel value={activeTab2} index={1}>
            <HostsPanel {...hosts} />
          </CustomTabPanel>
          <CustomTabPanel value={activeTab2} index={2}>
            <HostGroupsPanel {...hostgroups} />
          </CustomTabPanel>
          <CustomTabPanel value={activeTab2} index={3}>
            <NetworksPanel {...networks} />
          </CustomTabPanel>
          <CustomTabPanel value={activeTab2} index={4}>
            <ServicesPanel {...services} />
          </CustomTabPanel>
        </CustomTabPanel>
        <CustomTabPanel value={activeTab} index={2}>
          <ChainsPanel {...chains} />
        </CustomTabPanel>
        <CustomTabPanel value={activeTab} index={3}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={activeTab3} onChange={handleChange3} aria-label="basic tabs">
              <Tab label="Default" {...a11yProps(20)} />
              <Tab label="Custom" {...a11yProps(21)} />
              <Tab label="Manual" {...a11yProps(22)} />
            </Tabs>
          </Box>
          <CustomTabPanel value={activeTab3} index={0}>
            <DefaultsPanel {...defaults} />
          </CustomTabPanel>
          <CustomTabPanel value={activeTab3} index={1}>
            <CustomRulesPanel {...CustomRulesData()} />
          </CustomTabPanel>
          <CustomTabPanel value={activeTab3} index={2}>
            <ManualFilter {...manualFilter} />
          </CustomTabPanel>
        </CustomTabPanel>
        <CustomTabPanel value={activeTab} index={4}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={activeTab4} onChange={handleChange4} aria-label="basic tabs">
              <Tab label="Source NAT" {...a11yProps(40)} />
              <Tab label="Destination NAT" {...a11yProps(41)} />
            </Tabs>
          </Box>
          <CustomTabPanel value={activeTab4} index={0}>
            <SNatRules {...SNatRulesData()} />
          </CustomTabPanel>
          <CustomTabPanel value={activeTab4} index={1}>
            <DNatRules {...DNatRulesData()} />
          </CustomTabPanel>
        </CustomTabPanel>
        <CustomTabPanel value={activeTab} index={5}>
          <LogPanel {...logging} />
        </CustomTabPanel>
      </ThemeProvider>
    </>
  );
}

export default App;
