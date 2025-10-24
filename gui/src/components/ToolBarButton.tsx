import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import { type ReactNode } from "react";

interface Props {
  label: string;
  icon: ReactNode;
  badge: boolean;
  onClick: () => void;
}

function ToolBarButton(props: Props) {
  let button = (
    <Button
      variant="contained"
      startIcon={props.icon}
      sx={{ width: "130px" }}
      onClick={props.onClick}
    >
      {props.label}
    </Button>
  );
  if (props.badge) {
    button = (
      <Badge color="error" variant="dot">
        {button}
      </Badge>
    );
  }
  return button;
}

export default ToolBarButton;
