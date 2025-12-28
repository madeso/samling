import { Button, ListGroup } from "react-bootstrap";
import type { EvalFunction } from "../pattern";
import type { Item, Store } from "../store";
import { DeleteIcon } from "./icons";
import { AddEdit } from "./AddEdit";
import { useState } from "react";
import { evaluation } from "../lib/eval";

const ItemDisplay = (props: { eval: EvalFunction, item: Item, item_index: number, store: Store, setStore: (store: Store) => void }) => {
  const [editing, setEditing] = useState(false);

  const display = evaluation(props.eval, props.item.properties);

  const item = editing
    ? <AddEdit index={props.item_index} store={props.store} setStore={props.setStore} onClose={() => { setEditing(false); }} />
    : (
      <div className="w-100">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center flex-wrap text-start">
            <a href="#" className="fw-bold text-decoration-none me-3" onClick={(ev) => {
              ev.preventDefault();
              setEditing(true);
            }}>{display}</a>
            {props.item.tags && props.item.tags.length > 0 && (
              props.item.tags.map((tag, idx) => (
                <span key={idx} className="badge bg-primary me-2">{tag}</span>
              ))
            )}
          </div>
          <Button variant="outline-danger" size="sm" onClick={() => {
            const x = structuredClone(props.store);
            x.items.splice(props.item_index, 1);
            props.setStore(x);
          }}><DeleteIcon /></Button>
        </div>
      </div>
    );

  return <ListGroup.Item key={props.item_index} className="d-flex flex-column align-items-stretch">
    {item}
  </ListGroup.Item>
}

export const StoreList = (props: { eval: EvalFunction, store: Store, setStore: (store: Store) => void }) => {
  return (
    <ListGroup>
      {props.store.items.map((item, item_index) => (
        <ItemDisplay eval={props.eval} key={item_index} item={item} item_index={item_index} store={props.store} setStore={props.setStore} />
      ))}
    </ListGroup>
  );
}

