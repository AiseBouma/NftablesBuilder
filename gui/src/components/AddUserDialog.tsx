import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export interface AddUserDialogProps {
  open: boolean;
  firstUser: boolean;
  secret: string;
  svg: string;
  addUser: (username: string, password: string) => void;
  onClose: () => void;
}

function AddUserDialog(props: AddUserDialogProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries((formData as any).entries());
    const username = formJson.username;
    const password = formJson.password;
    props.addUser(username, password);
  };

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>Add User</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} id="adduser-form">
          <TextField
            autoFocus
            required
            id="username"
            name="username"
            label="Username"
            fullWidth
            variant="standard"
            sx={{ marginBottom: "12px" }}
          />
          <TextField
            required
            id="password"
            name="password"
            label="Password"
            type="password"
            fullWidth
            variant="standard"
            sx={{ marginBottom: "12px" }}
          />
        </form>
        <DialogContentText sx={{ mt: 2 }}>Scan the QR code below with your authenticator app.</DialogContentText>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          width="244"
          height="244"
          viewBox="0 0 244 244"
          shapeRendering="crispEdges"
        >
          <rect x="0" y="0" width="244" height="244" fill="#ffffff" />
          <path fill="#000000" d={props.svg} />
        </svg>
      </DialogContent>
      <DialogActions>
        {!props.firstUser ? <Button onClick={props.onClose}>Cancel</Button> : null}
        <Button type="submit" form="adduser-form">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddUserDialog;
