import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import type { Store } from "../store";
import { KeyValueExtractor } from "../extractor";

export const AddFromLines = (props: { store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
  const [lines, setLines] = useState<string>("");
  const [pattern, setPattern] = useState<string>("");

  const [extractor, patternError] = KeyValueExtractor.compile(pattern, 'string');
  const parsed = lines.split('\n')
    .filter(x => x.trim() !== '')
    .map(x => extractor.extractFromFile(x));

  const columns = [...new Set(parsed.flatMap(x => [...x.result.keys()])).values()];

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Paste items (one per line)</Form.Label>
        <Form.Control as="textarea" rows={5} value={lines} onChange={ev => setLines(ev.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Pattern{patternError !== null ? ` ({patternError})` : ''}</Form.Label>
        <Form.Control type="text" value={pattern} onChange={ev => setPattern(ev.target.value)} placeholder="Enter pattern" />
      </Form.Group>
      <div className="mb-3">
        <table className="table table-striped table-bordered align-middle">
          <thead>
            <tr>
              {columns.map((col, col_index) => <th key={col_index}>{col}</th>)}
              {columns.length == 0 && <th>Error</th>}
            </tr>
          </thead>
          <tbody>
            {parsed.map((item, item_index) => (
              <tr key={item_index}>
                {columns.map((column, column_index) => <td key={column_index}>{item.result.get(column)}</td>)}
                {item.message !== null && <td className="fw-bold" colSpan={Math.min(1, columns.length)}>{item.message}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="success" className="me-2" onClick={() => {
        const s = structuredClone(props.store);
        for (const prop of parsed) {
          const oprop = prop.result;
          s.items.push({ properties: oprop, tags: [] });
        }
        props.setStore(s);
        props.onClose();
      }}>OK</Button>
      <Button variant="secondary" onClick={props.onClose}>Abort</Button>
    </>
  );
}