import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export interface SettingsDialogProps {
  open: boolean;
  users: string[];
  addUser: () => void;
  deleteUser: (username: string) => void;
  onClose: () => void;
}

function SettingsDialog(props: SettingsDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent sx={{ minWidth: "400px", minHeight: "300px" }}>
        <TableContainer>
          <Table sx={{ width: "auto", border: 0 }} size="small" aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell align="left" colSpan={3} sx={{ border: 0 }}>
                  <h2>Users</h2>
                </TableCell>
                <TableCell align="right" colSpan={2} sx={{ border: 0 }}>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={props.addUser}>
                    Add
                  </Button>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ border: 0 }}>
              {props.users.map((user) => (
                <TableRow key={user}>
                  <TableCell sx={{ border: 0 }}>{user}</TableCell>

                  <TableCell align="left" sx={{ border: 0 }}>
                    <IconButton aria-label="delete" color="primary" onClick={() => props.deleteUser(user)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default SettingsDialog;
