import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export interface LoginDialogProps {
  open: boolean;
  warning: string;
  check: (username: string, password: string, mfacode: string) => void;
}

function LoginDialog(props: LoginDialogProps) {
  let warningText = <></>;
  if (props.warning != "") {
    warningText = <DialogContentText color={"red"}>{props.warning}</DialogContentText>;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries((formData as any).entries());
    const username = formJson.username;
    const password = formJson.password;
    const mfacode = formJson.mfacode;
    props.check(username, password, mfacode);
  };

  return (
    <Dialog open={props.open}>
      <DialogTitle>Login</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} id="login-form">
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
          <TextField
            required
            id="mfacode"
            name="mfacode"
            label="Authenticator Code"
            fullWidth
            variant="standard"
            sx={{ marginBottom: "12px" }}
          />
        </form>
        {warningText}
      </DialogContent>
      <DialogActions>
        <Button type="submit" form="login-form">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LoginDialog;
