import { useState } from 'react'
import logo from '/logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Navbar, Nav, Form, Image, ListGroup } from 'react-bootstrap';
import { get_mode, load_store, save_mode, save_store, type Item, type Mode, type Store } from './store';


const StoreList = (props: { store: Store, setStore: (store: Store) => void }) => {
  return (
    <ListGroup>
      {props.store.items.map((item, item_index) => (
        <ListGroup.Item key={item_index} className="d-flex justify-content-between align-items-center">
          <span>{item.name}</span>
          <Button variant="outline-danger" size="sm" onClick={() => {
            const x = structuredClone(props.store);
            x.items.splice(item_index, 1);
            props.setStore(x);
          }}>Remove</Button>
        </ListGroup.Item>
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
        tags: [] };
    });
  return (
    <Card className="mt-3">
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label>Paste items (one per line)</Form.Label>
          <Form.Control as="textarea" rows={5} value={lines} onChange={ev => setLines(ev.target.value)} />
        </Form.Group>
        <div className="mb-3">
          <table className="table table-striped table-bordered align-middle">
            <thead>
              <tr>
                <th style={{width: '40%'}}>Name</th>
                <th style={{width: '60%'}}>URL</th>
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
      </Card.Body>
    </Card>
  );
}

const AddEdit = (props: { store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
  const [item, setItem] = useState<Item>({ name: "", url: "", tags: [] });
  return (
    <Card className="mt-3 shadow-sm">
      <Card.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Name</Form.Label>
            <Form.Control type="text" value={item.name} onChange={ev => setItem(i => ({ ...i, name: ev.target.value }))} placeholder="Enter item name" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Url</Form.Label>
            <Form.Control type="text" value={item.url} onChange={ev => setItem(i => ({ ...i, url: ev.target.value }))} placeholder="Enter item URL" />
          </Form.Group>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="success" onClick={() => {
              const s = structuredClone(props.store);
              s.items.push(structuredClone(item));
              props.setStore(s);
              props.onClose();
            }}>OK</Button>
            <Button variant="secondary" onClick={props.onClose}>Abort</Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
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
              {mode === 'add' && (<AddEdit store={store} setStore={setStore} onClose={() => { setMode('list'); }} />)}
              {mode === 'list' && (<StoreList store={store} setStore={setStore} />)}
              {mode === 'add_many' && (<AddMany store={store} setStore={setStore} onClose={() => { setMode('list'); }} />)}
            </main>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App
