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

  const [newPropKey, setNewPropKey] = useState("");
  const [newPropValue, setNewPropValue] = useState("");

  const handleAddProperty = () => {
    if (!newPropKey.trim()) return;
    setItem(i => {
      const newMap = new Map(i.properties);
      newMap.set(newPropKey, newPropValue);
      return { ...i, properties: newMap };
    });
    setNewPropKey("");
    setNewPropValue("");
  };

  return (
    <Form>
      {/* Existing properties */}
      {
        [...item.properties.entries()].map(([key, value], prop_index) => {
          const handleRemoveProperty = () => {
            setItem(i => {
              const newMap = new Map(i.properties);
              newMap.delete(key);
              return { ...i, properties: newMap };
            });
          };
          return <Form.Group className="mb-3 d-flex align-items-center" key={prop_index}>
            <Form.Label className="fw-bold me-2 mb-0" style={{ minWidth: 80 }}>{key}</Form.Label>
            <Form.Control type="text" value={value} onChange={ev => setItem(i => {
              const newMap = new Map(i.properties);
              newMap.set(key, ev.target.value);
              return { ...i, properties: newMap };
            })} placeholder={`Enter ${key}`} className="me-2" />
            <Button variant="outline-danger" size="sm" onClick={handleRemoveProperty} title="Remove property">&times;</Button>
          </Form.Group>
        })
      }
      {/* Add new property */}
      <Form.Group className="mb-3 d-flex align-items-center">
        <Form.Control type="text" value={newPropKey} onChange={ev => setNewPropKey(ev.target.value)} placeholder="New property name" className="me-2" />
        <Form.Control type="text" value={newPropValue} onChange={ev => setNewPropValue(ev.target.value)} placeholder="New property value" className="me-2" />
        <Button variant="primary" onClick={handleAddProperty} disabled={!newPropKey.trim()}>Add</Button>
      </Form.Group>
      {/* Tags */}
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Tags</Form.Label>
        <TagEdit tags={item.tags} setTags={setTags} />
      </Form.Group>
      {/* OK/close */}
      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button variant="success" onClick={onOk}>OK</Button>
        <Button variant="secondary" onClick={props.onClose}>Abort</Button>
      </div>
    </Form>
  );
}