import Alert, { type AlertColor } from "@mui/material/Alert";

export interface AlertBarProps {
  open: boolean;
  severity: AlertColor;
  text: string;
  onClose: () => void;
}

function AlertBar(props: AlertBarProps) {
  let output = <></>;
  if (props.open) {
    output = (
      <Alert severity={props.severity} onClose={props.onClose}>
        {props.text}
      </Alert>
    );
  }
  return output;
}

export default AlertBar;
