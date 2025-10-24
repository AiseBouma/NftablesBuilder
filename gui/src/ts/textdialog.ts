import type { TextDialogProps } from "../components/TextDialog";

interface StateType {
  setfunction: (props: TextDialogProps) => void;
  current: TextDialogProps;
}

const empty = {
  open: false,
  title: "",
  text: "",
  value: "",
  multiline: false,
  warning: "",
  onChange: (text: string) => {
    if (text.endsWith("\n")) {
      state.current.onOK();
    } else {
      state.current.value = text;
      state.setfunction(state.current);
    }
  },
  onOK: () => {},
  onCancel: CloseTextDialog,
} as TextDialogProps;
const state: StateType = {
  setfunction: function (_props: TextDialogProps) {},
  current: { ...empty },
};

export function InitTextDialogState(setfn: (props: TextDialogProps) => void) {
  state.setfunction = function (props: TextDialogProps) {
    setfn({ ...props });
  };
}

export function TextDialogDefaultProps(): TextDialogProps {
  return empty;
}

function Open(title: string, text: string, value: string, multiline: boolean, callback: () => void) {
  state.current.open = true;
  state.current.title = title;
  state.current.value = value;
  state.current.text = text;
  state.current.multiline = multiline;
  state.current.onOK = callback;
  state.setfunction(state.current);
}

export function OpenTextDialog(title: string, text: string, value: string, callback: () => void) {
  Open(title, text, value, false, callback);
}

export function OpenMultiLineTextDialog(title: string, text: string, value: string, callback: () => void) {
  Open(title, text, value, true, callback);
}

export function TextDialogGetTitle(): string {
  return state.current.title;
}

export function TextDialogGetValue(): string {
  return state.current.value;
}

export function TextDialogSetWarning(text: string) {
  state.current.warning = text;
  state.setfunction(state.current);
}

export function CloseTextDialog() {
  state.current = { ...empty };
  state.setfunction(state.current);
}
