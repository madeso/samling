import { useState } from "react";
import { parse_pattern } from "../pattern";
import { CardDialog } from "./CardDialog";
import { Form } from "react-bootstrap";


export const useStoreListConfig = () => {
  const [pattern, setPattern] = useState<string>("%name%");
  const [parsed_pattern, parse_error] = parse_pattern(pattern);

  const ui = <>
      <CardDialog>
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Pattern</Form.Label>
          <Form.Control type="text" value={pattern} onChange={ev => setPattern(ev.target.value)} placeholder="Enter pattern" />
          {parse_error && <div className="text-danger mt-2">Error: {parse_error.type}</div>}
        </Form.Group>
      </CardDialog>
    </>;
    return {pattern: parsed_pattern, ui};
};