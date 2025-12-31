import { Button, ListGroup } from "react-bootstrap";
import { type EvalFunction } from "../pattern";
import type { Item, Store } from "../store";
import { DeleteIcon } from "./icons";
import { AddEdit } from "./AddEdit";
import { useState } from "react";
import { evaluation } from "../lib/eval";
import type { Config } from "./StoreList.hooks";
import { CardDialog } from "./CardDialog";

const DeleteItem = (props: { item_index: number, store: Store, setStore: (store: Store) => void }) => {
    return <Button variant="outline-danger" size="sm" onClick={() => {
        const x = structuredClone(props.store);
        x.items.splice(props.item_index, 1);
        props.setStore(x);
    }}><DeleteIcon /></Button>;
}

const TagDisplay = (props: { item: Item }) => {
    return <>{
        props.item.tags && props.item.tags.length > 0 && (
            props.item.tags.map((tag, idx) => (
                <span key={idx} className="badge bg-primary me-2">{tag}</span>
            ))
        )
    }</>;
}

type DisplayConfig = { type: 'list', pattern: EvalFunction } | { type: 'table', columns: string[] };

const ItemListDisplay = (props: { pattern: EvalFunction, editing: boolean, setEditing: (edit: boolean) => void, item: Item, item_index: number, store: Store, setStore: (store: Store) => void }) => {
    const display = evaluation(props.pattern, props.item.properties);

    const item = props.editing
        ? <AddEdit index={props.item_index} store={props.store} setStore={props.setStore} onClose={() => { props.setEditing(false); }} />
        : (
            <div className="w-100">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center flex-wrap text-start">
                        <a href="#" className="fw-bold text-decoration-none me-3" onClick={(ev) => {
                            ev.preventDefault();
                            props.setEditing(true);
                        }}>{display}</a>
                        <TagDisplay item={props.item} />
                    </div>
                    <DeleteItem store={props.store} setStore={props.setStore} item_index={props.item_index} />
                </div>
            </div>
        );

    return <ListGroup.Item key={props.item_index} className="d-flex flex-column align-items-stretch">
        {item}
    </ListGroup.Item>
}
const ItemTableDisplay = (props: { columns: string[], editing: boolean, setEditing: (edit: boolean) => void, item: Item, item_index: number, store: Store, setStore: (store: Store) => void }) => {
    return props.editing
        ? <tr>
            <td colSpan={props.columns.length + 2}>
                <CardDialog>
                    <AddEdit index={props.item_index} store={props.store} setStore={props.setStore} onClose={() => { props.setEditing(false); }} />
                </CardDialog>
            </td>
        </tr>
        : (
            <tr>
                {props.columns.map((column, column_index) => <td key={column_index}><a href="#" className="fw-bold text-decoration-none me-3" onClick={(ev) => {
                    ev.preventDefault();
                    props.setEditing(true);
                }}>{props.item.properties.get(column)}</a></td>)}
                <td>
                    <TagDisplay item={props.item} />
                </td>
                <td>
                    <DeleteItem store={props.store} setStore={props.setStore} item_index={props.item_index} />
                </td>
            </tr>
        );
}

const ItemDisplay = (props: { config: DisplayConfig, item: Item, item_index: number, store: Store, setStore: (store: Store) => void }) => {
    const [editing, setEditing] = useState(false);

    const config = props.config;

    switch (config.type) {
        case 'list':
            return <ItemListDisplay pattern={config.pattern}
                editing={editing} setEditing={setEditing}
                store={props.store} setStore={props.setStore}
                item={props.item} item_index={props.item_index} />;
        case 'table':
            return <ItemTableDisplay columns={config.columns}
                editing={editing} setEditing={setEditing}
                store={props.store} setStore={props.setStore}
                item={props.item} item_index={props.item_index} />;
    }
}

export const TableStoreList = (props: { store: Store, setStore: (store: Store) => void }) => {
    const columns = [...new Set(props.store.items.flatMap(x => [...x.properties.keys()])).values()];

    return (
        <table>
            <thead>
                {columns.map((col, col_index) => <th key={col_index}>{col}</th>)}
                <th>Tag</th>
                <th>Delete</th>
            </thead>
            <tbody>
                {props.store.items.map((item, item_index) => (
                    <ItemDisplay config={{ type: 'table', columns }} key={item_index} item={item} item_index={item_index} store={props.store} setStore={props.setStore} />
                ))}
            </tbody>
        </table>
    )
}

export const StoreList = (props: { config: Config, store: Store, setStore: (store: Store) => void }) => {
    const config = props.config;
    switch (config.type) {
        case 'list':
            return (
                <ListGroup>
                    {props.store.items.map((item, item_index) => (
                        <ItemDisplay config={{ type: 'list', pattern: config.pattern }} key={item_index} item={item} item_index={item_index} store={props.store} setStore={props.setStore} />
                    ))}
                </ListGroup>
            );
        case 'table':
            return <TableStoreList setStore={props.setStore} store={props.store} />
    }
}
