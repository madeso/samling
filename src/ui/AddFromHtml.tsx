import { useState } from "react";
import type { Store } from "../store";
import { extract_html, type PatternExtractor } from "../html";
import { Button, Form } from "react-bootstrap";

export const AddFromHtml = (props: { store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
  const [lines, setLines] = useState<string>("");
  const [childSelector, setChildSelector] = useState<string>(":scope > div");
  const [extractors, setExtractors] = useState<PatternExtractor[]>([]);

  const {results:parsed, messages:patternErrors} = extract_html(lines, extractors, [childSelector]);
  const columns = [...new Set(parsed.flatMap(x => [...x.keys()])).values()];

  // State for new extractor input
  const [newTag, setNewTag] = useState<string>("");
  const [newPattern, setNewPattern] = useState<string>("");
  const [extractorError, setExtractorError] = useState<string | null>(null);

  // Add extractor handler
  const handleAddExtractor = () => {
    if (!newPattern.trim()) return;
    const extractor : PatternExtractor = {pattern: newPattern, tag: newTag};
    setExtractors(prev => [...prev, extractor]);
    setNewPattern("");
    setExtractorError(null);
  };

  // Remove extractor handler
  const handleRemoveExtractor = (idx: number) => {
    setExtractors(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Paste html</Form.Label>
        <Form.Control as="textarea" rows={5} value={lines} onChange={ev => setLines(ev.target.value)} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Child selector</Form.Label>
        <Form.Control type="text" value={childSelector} onChange={ev => setChildSelector(ev.target.value)} placeholder="Enter pattern" />
        {patternErrors && patternErrors.length > 0 && (
          <div className="text-danger mt-2">
            {patternErrors.map((err, idx) => <div key={idx}>{err}</div>)}
          </div>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Extractors</Form.Label>
        <div className="d-flex flex-column gap-2 mb-2">
          {extractors.length === 0 && <span className="text-muted">No extractors added</span>}
          {extractors.map((ex, idx) => (
            <div key={idx} className="d-flex align-items-center gap-2">
              <Form.Control
                type="text"
                value={ex.tag}
                onChange={ev => {
                  const updated = extractors.map((e, i) => i === idx ? { ...e, tag: ev.target.value } : e);
                  setExtractors(updated);
                }}
                placeholder="Tag"
                style={{ maxWidth: '120px' }}
                size="sm"
              />
              <Form.Control
                type="text"
                value={ex.pattern}
                onChange={ev => {
                  const updated = extractors.map((e, i) => i === idx ? { ...e, pattern: ev.target.value } : e);
                  setExtractors(updated);
                }}
                placeholder="Pattern"
                size="sm"
              />
              <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: '0.7em' }} aria-label="Remove" onClick={() => handleRemoveExtractor(idx)}></button>
            </div>
          ))}
        </div>
        <div className="d-flex gap-2">
          <Form.Control
            type="text"
            value={newTag}
            onChange={ev => setNewTag(ev.target.value)}
            placeholder="Tag"
            style={{ maxWidth: '120px' }}
          />
          <Form.Control
            type="text"
            value={newPattern}
            onChange={ev => setNewPattern(ev.target.value)}
            placeholder="Pattern"
            onKeyDown={ev => {
              if (ev.key === 'Enter') {
                ev.preventDefault();
                handleAddExtractor();
              }
            }}
          />
          <Button variant="outline-primary" onClick={handleAddExtractor}>Add</Button>
        </div>
        {extractorError && <div className="text-danger mt-2">{extractorError}</div>}
      </Form.Group>

      <Form.Group className="mb-3">
        <table className="table table-striped table-bordered align-middle">
          <thead>
            <tr>
              {columns.map((col, col_index) => <th key={col_index}>{col}</th>)}
              {columns.length == 0 && <th>No columns parsed</th>}
            </tr>
          </thead>
          <tbody>
            {parsed.map((item, item_index) => (
              <tr key={item_index}>
                {columns.map((column, column_index) => <td key={column_index}>{item.get(column)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Form.Group>

      <Form.Group className="mb-3">
        <Button variant="success" className="me-2" onClick={() => {
          const s = structuredClone(props.store);
          for (const oprop of parsed) {
            s.items.push({ properties: oprop, tags: [] });
          }
          props.setStore(s);
          props.onClose();
        }}>OK</Button>
        <Button variant="secondary" onClick={props.onClose}>Abort</Button>
      </Form.Group>
    </>
  );
}
