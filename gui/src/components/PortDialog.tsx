import Dialog from "@mui/material/Dialog";
import PaperComponent from "./PaperComponent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
export interface PortDialogProps {
  open: boolean;
  title: string;
  value: string;
  protocol: string;
  warning: string;
  onChange: (text: string) => void;
  onProtocolChange: (protocol: string) => void;
  onOK: () => void;
  onCancel: () => void;
}

function PortDialog(props: PortDialogProps) {
  let warningText = <></>;
  if (props.warning != "") {
    warningText = (
      <DialogContentText color={"red"}>{props.warning}</DialogContentText>
    );
  }

  return (
    <Dialog
      disableRestoreFocus
      open={props.open}
      onClose={props.onCancel}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
    >
      <DialogTitle style={{ cursor: "move" }} id="draggable-dialog-title">
        {props.title}
      </DialogTitle>
      <DialogContent sx={{ minWidth: "400px" }}>
        
        <div style={{ display: "flex", flexDirection: "row", marginTop: "10px" }}>
        
        <TextField
          
          autoFocus
          margin="dense"
          id="tf"
          name="tf"
          label="Port number"
          variant="standard"
          value={props.value}
          onChange={(e) => {
            props.onChange(e.target.value);
          }}
        />
        <TextField
          id="protocol"
          label="Protocol"
          name="protocol"
          select
          defaultValue="TCP"
          sx={{ marginLeft: "50px", width: "150px" }}
          value={props.protocol}
          onChange={(e) => {
            props.onProtocolChange(e.target.value);
          }}
        >
          <MenuItem key="TCP" value="TCP" >TCP</MenuItem>
          <MenuItem key="UDP" value="UDP" >UDP</MenuItem>
          <MenuItem key="TCP/UDP" value="TCP/UDP" >TCP & UDP</MenuItem>
        </TextField>
        </div>
        {warningText}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>Cancel</Button>
        <Button onClick={props.onOK}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PortDialog;
