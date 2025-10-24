import { Checkbox, Grid, List, ListItem, ListItemButton, ListItemText } from "@mui/material";

export interface DefaultsPanelProps {
  inactiveList: string[];
  onChange: (rule: string) => void;
}

interface listitemdata {
  key: string;
  primary: string;
  secondary: string;
}

const listitems: listitemdata[] = [
  {
    key: "InvalidTCPFlags",
    primary: "Block packets with Invalid TCP Flags early",
    secondary: "Block TCP packets with an invalid combination of SYN, ACK, URG, FIN and RST flags on the ingress hook.",
  },

  {
    key: "TCPMSS",
    primary: "Block TCP packets with low MSS values.",
    secondary:
      "The minimum MSS should be 526: 576 (minimum size ip datagram) - 60 (maximum fixed size headers, 20 for TCP and 40 for IPv6), see RFC6691.",
  },
  {
    key: "SRCEQDST",
    primary: "Block packets with equal source and destination addresss",
    secondary: "Block packets where the source and destination address are equal.",
  },
  {
    key: "SYNFlood",
    primary: "Limit the rate of new connections",
    secondary: "Limit the rate of TCP SYN packets to 1 per second per source ip address.",
  },
  {
    key: "CT-Invalid",
    primary: "Block invalid connection tracking packets",
    secondary: "Block packets that do not match any known connection tracking state.",
  },
  {
    key: "CT-Established",
    primary: "Allow packets on established connections",
    secondary: "Allow packets that match an established connection tracking state.",
  },
  {
    key: "CT-Related",
    primary: "Allow packets on related connections",
    secondary: "Allow packets that match a related connection tracking state.",
  },
  {
    key: "ICMP",
    primary: "Limit ICMP traffic",
    secondary: "Allow ICMP by default, but limit the rate to 10 per second per source ip address.",
  },
  {
    key: "AllowNAT",
    primary: "Allow NAT traffic",
    secondary: "Allow traffic that traverses one of the specified SNAT or DNAT rules.",
  },
];

function DefaultsPanel(props: DefaultsPanelProps) {
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
        <h2>Default rules</h2>
        <List>
          {listitems.map((li) => {
            return (
              <ListItem key={li.key}>
                <ListItemButton
                  dense
                  onClick={function (_e) {
                    props.onChange(li.key);
                  }}
                >
                  <Checkbox edge="start" checked={!props.inactiveList.includes(li.key)} />
                  <ListItemText id={li.key} primary={li.primary} secondary={li.secondary} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Grid>
    </>
  );
}

export default DefaultsPanel;
