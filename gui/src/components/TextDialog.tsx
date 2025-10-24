import Dialog from "@mui/material/Dialog";
import PaperComponent from "./PaperComponent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

export interface TextDialogProps {
  open: boolean;
  title: string;
  text: string;
  value: string;
  multiline: boolean;
  warning: string;
  onChange: (text: string) => void;
  onOK: () => void;
  onCancel: () => void;
}

function TextDialog(props: TextDialogProps) {
  let warningText = <></>;
  if (props.warning != "") {
    warningText = <DialogContentText color={"red"}>{props.warning}</DialogContentText>;
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
        <DialogContentText>{props.text}</DialogContentText>
        <TextField
          multiline={props.multiline}
          autoFocus
          margin="dense"
          id="tf"
          name="tf"
          label=""
          fullWidth
          variant="standard"
          value={props.value}
          onChange={(e) => {
            props.onChange(e.target.value);
          }}
          onKeyUp={(e) => {
            if (e.key == "Enter") {
              props.onOK();
            }
          }}
        />
        {warningText}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>Cancel</Button>
        <Button onClick={props.onOK}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}

export default TextDialog;
