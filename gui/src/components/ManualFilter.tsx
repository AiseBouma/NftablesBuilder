import { Grid, TextField } from "@mui/material";

export interface ManualFilterProps {
  pre: string;
  post: string;
  onChangePre: (text: string) => void;
  onChangePost: (text: string) => void;
}

function ManualFilter(props: ManualFilterProps) {
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
        <h2>Manual Filter Rules</h2>
        <div className="ManualFilterHeader">At the start:</div>
        <div className="ThinLine">
          <TextField
            id="standard-multiline-static"
            multiline
            variant="standard"
            className="ManualFilter"
            minRows={10}
            value={props.pre}
            onChange={(e) => {
              props.onChangePre(e.target.value);
            }}
          />
        </div>
        <div className="ManualFilterHeader">At the end:</div>
        <div className="ThinLine">
          <TextField
            id="standard-multiline-static"
            multiline
            variant="standard"
            className="ManualFilter"
            minRows={10}
            value={props.post}
            onChange={(e) => {
              props.onChangePost(e.target.value);
            }}
          />
        </div>
      </Grid>
    </>
  );
}

export default ManualFilter;
