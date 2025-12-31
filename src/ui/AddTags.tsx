import { useState } from "react";
import type { Item, Store } from "../store";
import { is_excluded } from "../lib/filter";
import { add_tag } from "../lib/taglib";
import { Button, Form } from "react-bootstrap";
import { TagEdit } from "./TagEdit";
import type { Config } from "./StoreList.hooks";

export const AddTags = (props: { config: Config, store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
  const [contains, setContains] = useState("");
  const [newTags, setNewTags] = useState(new Array<string>());

  const onOk = () => {
    props.setStore({
      ...props.store, items: props.store.items.map((item): Item => {
        // todo(Gustav): if not a list, show a custom pattern editor?
        if (props.config.type ==='list' && is_excluded(props.config.pattern, item, contains)) {
          return item;
        }
        return { ...item, tags: item.tags.concat(newTags).reduce(add_tag, []) };
      })
    });
    props.onClose();
  };

  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Name</Form.Label>
        <Form.Control type="text" value={contains} onChange={ev => setContains(ev.target.value)} placeholder="Enter filter" />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Tags</Form.Label>
        <TagEdit tags={newTags} setTags={setNewTags} />
      </Form.Group>
      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button variant="success" onClick={onOk}>OK</Button>
        <Button variant="secondary" onClick={props.onClose}>Abort</Button>
      </div>
    </Form>
  );
}
