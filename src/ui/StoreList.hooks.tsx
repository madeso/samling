import { useState } from "react";
import { parse_pattern, type EvalFunction } from "../pattern";
import { CardDialog } from "./CardDialog";
import { Form } from "react-bootstrap";

export type ConfigList = { type: "list", pattern: EvalFunction };
export type ConfigTable = { type: 'table' };
export type Config = ConfigList | ConfigTable;
type TypeOfConfig = Config["type"];

export const useStoreListConfig = () => {
  const [type, setType] = useState<TypeOfConfig>("table");
  const [pattern, setPattern] = useState<string>("%name%");
  const [parsed_pattern, parse_error] = parse_pattern(pattern);

  const ui = <>
    <CardDialog>
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Type</Form.Label>
        <Form.Select value={type} onChange={ev => setType(ev.target.value as TypeOfConfig)}>
          <option value="table">Table</option>
          <option value="list">List</option>
        </Form.Select>
      </Form.Group>
      {type === "list" && (
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Pattern</Form.Label>
          <Form.Control type="text" value={pattern} onChange={ev => setPattern(ev.target.value)} placeholder="Enter pattern" />
          {parse_error && <div className="text-danger mt-2">Error: {parse_error.type}</div>}
        </Form.Group>
      )}
    </CardDialog>
  </>;
  const config: Config = type === "list"
    ? { type: "list", pattern: parsed_pattern }
    : { type: "table" };
  return { config, ui };
};