import { DialogContent } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";

interface LoadingProps {
  open: boolean;
}

function Loading(props: LoadingProps) {
  let output = <></>;
  if (props.open) {
    output = (
      <Dialog open={true}>
        <DialogTitle>Loading data</DialogTitle>
        <DialogContent sx={{ width: "400px", margin: "50px" }}>
          <LinearProgress />
        </DialogContent>
      </Dialog>
    );
  }
  return output;
}

export default Loading;
