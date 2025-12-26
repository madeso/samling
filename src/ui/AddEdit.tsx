import { useState } from "react";
import type { Item, Store } from "../store";
import { Button, Form } from "react-bootstrap";
import { TagEdit } from "./TagEdit";

export const AddEdit = (props: { index: number | null, store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
  const [item, setItem] = useState<Item>(() => props.index !== null ? structuredClone(props.store.items[props.index]) : { properties: new Map<string, string>(), tags: [] });

  const setTags = (newTags: string[]) => {
    setItem(i => ({ ...i, tags: newTags }));
  };
  const onOk = () => {
    const s = structuredClone(props.store);
    if (props.index !== null) {
      s.items[props.index] = structuredClone(item);
    }
    else {
      s.items.push(structuredClone(item));
    }
    props.setStore(s);
    props.onClose();
  };

  return (
    <Form>
      {
        [...item.properties.entries()].map(([key, value], prop_index) => {
          return <Form.Group className="mb-3" key={prop_index}>
            <Form.Label className="fw-bold">{key}</Form.Label>
            <Form.Control type="text" value={value} onChange={ev => setItem(i => ({ ...i, properties: new Map<string, string>([...i.properties, [key, ev.target.value]]) }))} placeholder={`Enter item ${key}`} />
          </Form.Group>
        })
      }
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Tags</Form.Label>
        <TagEdit tags={item.tags} setTags={setTags} />
      </Form.Group>
      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button variant="success" onClick={onOk}>OK</Button>
        <Button variant="secondary" onClick={props.onClose}>Abort</Button>
      </div>
    </Form>
  );
}