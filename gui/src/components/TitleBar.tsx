import Grid from "@mui/material/Grid";
import ExitIcon from "@mui/icons-material/ExitToApp";

interface Props {
  configname: string;
  current_user: string;
  onLogout: () => void;
}

function TitleBar(props: Props) {
  let tb = (
    <Grid
      container
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
      }}
      id="titlebar"
    >
      <Grid
        container
        spacing={5}
        direction="row"
        sx={{
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <img id="logo" src="img/fw36.png" />

        <h1>Nftables Builder - Configuration {props.configname}</h1>
      </Grid>
      <Grid
        container
        spacing={5}
        direction="row"
        sx={{
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        {props.current_user}
        <ExitIcon className="clickable primary" onClick={props.onLogout} />
      </Grid>
    </Grid>
  );
  return tb;
}

export default TitleBar;
