import { FormControl, RadioGroup, FormControlLabel, Radio, Grid, FormLabel } from "@mui/material";

export interface LogPanelProps {
  loggingtype: string;
  onChange: (value: string) => void;
}

function LogPanel(props: LogPanelProps) {
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
        <h2>Logging</h2>
        <FormControl>
          <FormLabel>For dropped packets:</FormLabel>
          <RadioGroup
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={props.loggingtype}
            onChange={(e) => {
              props.onChange(e.target.value);
            }}
          >
            <FormControlLabel value="none" control={<Radio />} label="None" />
            <FormControlLabel value="counter" control={<Radio />} label="Counter" />
            <FormControlLabel value="log" control={<Radio />} label="Log" />
          </RadioGroup>
        </FormControl>
      </Grid>
    </>
  );
}

export default LogPanel;
