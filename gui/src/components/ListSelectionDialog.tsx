import Dialog from "@mui/material/Dialog";
import PaperComponent from "./PaperComponent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/material/styles";

export interface ListSelectionDialogProps {
  open: boolean;
  title: string;
  text_unselected: string;
  text_selected: string;
  unselected: string[];
  selected: string[];
  onSelect: (text: string) => void;
  onDeselect: (text: string) => void;
  onOK: () => void;
  onCancel: () => void;
}

const ListHeader = styled("div")(({ theme }) => ({
  color: theme.palette.primary.main,
  paddingBottom: theme.spacing(1),
  textAlign: "left",
}));

function ListSelectionDialog(props: ListSelectionDialogProps) {
  return (
    <Dialog
      disableRestoreFocus
      open={props.open}
      onClose={props.onCancel}
      PaperComponent={PaperComponent}
      maxWidth={false}
      aria-labelledby="draggable-dialog-title"
    >
      <DialogTitle style={{ cursor: "move" }} id="draggable-dialog-title">
        {props.title}
      </DialogTitle>
      <DialogContent sx={{ minWidth: "400px" }}>
        <Grid
          container
          direction="row"
          sx={{
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <Grid
            container
            direction="column"
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              minWidth: "200px",
            }}
          >
            <ListHeader>{props.text_unselected}</ListHeader>
            {props.unselected.map((unsel) => (
              <Grid
                container
                direction="row"
                key={unsel}
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  maxHeight: "23px",
                }}
              >
                <div>{unsel}</div>
                <ArrowRightIcon fontSize="large" color="primary" onClick={() => props.onSelect(unsel)} />
              </Grid>
            ))}
          </Grid>
          <Grid
            container
            direction="column"
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              minWidth: "200px",
            }}
          >
            <ListHeader sx={{ paddingLeft: "34px" }}>{props.text_selected}</ListHeader>
            {props.selected.map((sel) => (
              <Grid
                container
                direction="row"
                key={sel}
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  maxHeight: "23px",
                }}
              >
                <ArrowLeftIcon fontSize="large" color="primary" onClick={() => props.onDeselect(sel)} />

                <div>{sel}</div>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>Cancel</Button>
        <Button onClick={props.onOK}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ListSelectionDialog;
