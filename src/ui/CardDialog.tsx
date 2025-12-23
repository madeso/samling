import { Card } from "react-bootstrap";

export const CardDialog = (props: React.PropsWithChildren) =>
  <Card className="mt-3 shadow-sm">
    <Card.Body>{props.children}</Card.Body>
  </Card>;

