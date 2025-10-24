export interface FloatingValueProps {
  visible: boolean;
  top: number;
  left: number;
  value: string;
  type: string;
  from_cell: HTMLElement;
  fromchain: string;
  fromrow: number;
  cursor: string;
}

function FloatingValue(props: FloatingValueProps) {
  if (props.visible) {
    return (
      <div
        style={{
          top: props.top,
          left: props.left,
          cursor: props.cursor,
        }}
        className="floatingvalue"
      >
        {props.value}
      </div>
    );
  } else {
    return <></>;
  }
}
export default FloatingValue;
