import { useState } from 'react'
import logo from '/logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Navbar, Nav, Form, Image, ListGroup } from 'react-bootstrap';
import { get_mode, load_store, save_mode, save_store, type Item, type Mode, type Store } from './store';

const ItemDisplay = (props: { item: Item, item_index: number, store: Store, setStore: (store: Store) => void }) => {
  const [editing, setEditing] = useState(false);

  const item = editing
    ? <AddEdit index={props.item_index} store={props.store} setStore={props.setStore} onClose={() => { setEditing(false); }} />
    : (
      <div className="w-100">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center flex-wrap text-start">
            <a href="#" className="fw-bold text-decoration-none me-3" onClick={(ev) => {
              ev.preventDefault();
              setEditing(true);
            }}>{props.item.name}</a>
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
          }}>Remove</Button>
        </div>
      </div>
    );

  return <ListGroup.Item key={props.item_index} className="d-flex flex-column align-items-stretch">
    {item}
  </ListGroup.Item>
}

const StoreList = (props: { store: Store, setStore: (store: Store) => void }) => {
  return (
    <ListGroup>
      {props.store.items.map((item, item_index) => (
        <ItemDisplay key={item_index} item={item} item_index={item_index} store={props.store} setStore={props.setStore} />
      ))}
    </ListGroup>
  );
}

const AddMany = (props: { store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
  const [lines, setLines] = useState<string>("");
  const parsed = lines.split('\n')
    .map(x => x.trim())
    .filter(x => x !== '')
    .map(x => {
      const [parsedName, parsedUrl] = x.split(']', 2);
      return {
        name: parsedName.trim().replace(/^([0-9]+\s*\.\s*\[)/, ""),
        url: parsedUrl?.trim().replace(/^(\()/, "").replace(/\)\s*$/, "") ?? "",
        tags: []
      };
    });
  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Paste items (one per line)</Form.Label>
        <Form.Control as="textarea" rows={5} value={lines} onChange={ev => setLines(ev.target.value)} />
      </Form.Group>
      <div className="mb-3">
        <table className="table table-striped table-bordered align-middle">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Name</th>
              <th style={{ width: '60%' }}>URL</th>
            </tr>
          </thead>
          <tbody>
            {parsed.map((item, item_index) => (
              <tr key={item_index}>
                <td className="fw-bold">{item.name}</td>
                <td>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
                  ) : <span className="text-muted">(none)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="success" className="me-2" onClick={() => {
        const s = structuredClone(props.store);
        for (const i of parsed) {
          s.items.push(i);
        }
        props.setStore(s);
        props.onClose();
      }}>OK</Button>
      <Button variant="secondary" onClick={props.onClose}>Abort</Button>
    </>
  );
}

const CardDialog = (props: React.PropsWithChildren) =>
  <Card className="mt-3 shadow-sm">
    <Card.Body>{props.children}</Card.Body>
  </Card>;

const TagEdit = (props: { tags: string[], setTags: (tags: string[]) => void }) => {
  const [tagInput, setTagInput] = useState("");

  const addTag = (tagToAdd: string) => {
    // remove tag if it exist, then add it last
    props.setTags([...props.tags.filter(tag => tag !== tagToAdd), tagToAdd]);
  };
  const removeTag = (tagToRemove: string) => {
    props.setTags(props.tags.filter(t => t !== tagToRemove));
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter' || ev.key === ',' || ev.key === ' ') {
      ev.preventDefault();
      (() => {
        const newTag = tagInput.trim();
        if (newTag) {
          addTag(newTag);
          setTagInput("");
        }
      })();
    } else if (ev.key === 'Backspace' && tagInput === "" && props.tags.length > 0) {
      ev.preventDefault();
      props.setTags(props.tags.slice(0, -1));
    }
  };
  return (
    <div className="d-flex flex-wrap align-items-center gap-2" style={{ minHeight: '38px', border: '1px solid #ced4da', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', background: '#fff' }}>
      {props.tags.map((tag) => (
        <span key={tag} className="badge bg-primary d-flex align-items-center" style={{ fontSize: '1em', paddingRight: '0.5em' }}>
          {tag}
          <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: '0.7em' }} aria-label="Remove" onClick={() => removeTag(tag)}></button>
        </span>
      ))}
      <input
        type="text"
        className="form-control border-0 shadow-none p-0 m-0"
        style={{ width: 'auto', minWidth: '80px', flex: '1 0 120px' }}
        value={tagInput}
        onChange={ev => setTagInput(ev.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Add tag"
        autoComplete="off"
      />
    </div>
  );
}

const AddEdit = (props: { index: number | null, store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
  const [item, setItem] = useState<Item>(() => props.index !== null ? structuredClone(props.store.items[props.index]) : { name: "", url: "", tags: [] });

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
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Name</Form.Label>
        <Form.Control type="text" value={item.name} onChange={ev => setItem(i => ({ ...i, name: ev.target.value }))} placeholder="Enter item name" />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Url</Form.Label>
        <Form.Control type="text" value={item.url} onChange={ev => setItem(i => ({ ...i, url: ev.target.value }))} placeholder="Enter item URL" />
      </Form.Group>
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

function App() {
  const [store, setStoreData] = useState<Store>(() => {
    const loaded = load_store();
    if (loaded !== null) return loaded;
    return { items: [] };
  });
  const setStore = (new_store: Store) => {
    setStoreData(new_store);
    save_store(new_store);
  }
  const [mode, setModeData] = useState<Mode>(() => get_mode() ?? "list");
  const setMode = (m: Mode) => {
    setModeData(m);
    save_mode(m);
  }

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home" className="d-flex align-items-center">
            <Image src={logo} alt="Vite logo" rounded style={{ width: '32px', height: '32px', marginRight: '10px' }} />
            Samling
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => setMode("list")}>List</Nav.Link>
              <Nav.Link onClick={() => setMode("add")}>Add</Nav.Link>
              <Nav.Link onClick={() => setMode("add_many")}>Add Many</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <Row className="justify-content-md-center">
          <Col md={8}>
            <main>
              <>
                {mode === 'add' && (<CardDialog><AddEdit index={null} store={store} setStore={setStore} onClose={() => { setMode('list'); }} /></CardDialog>)}
                {mode === 'list' && (<StoreList store={store} setStore={setStore} />)}
                {mode === 'add_many' && (<CardDialog><AddMany store={store} setStore={setStore} onClose={() => { setMode('list'); }} /></CardDialog>)}
              </>
            </main>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App
