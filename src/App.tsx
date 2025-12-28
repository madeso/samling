import { useState } from 'react'
import logo from '/logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Navbar, Nav, Form, Image } from 'react-bootstrap';
import { get_mode, load_store, save_mode, save_store, type Mode, type Store } from './store';

import { parse_pattern } from './pattern';
import { CardDialog } from './ui/CardDialog';
import { AddFromHtml } from './ui/AddFromHtml';
import { AddFromLines } from './ui/AddFromLines';
import { AddEdit } from './ui/AddEdit';
import { AddTags } from './ui/AddTags';
import { StoreList } from './ui/StoreList';





function App() {
  const [pattern, setPattern] = useState<string>("%name%");
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

  const [patt, err] = parse_pattern(pattern);

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
              <Nav.Link onClick={() => setMode("add_from_lines")}>From Lines</Nav.Link>
              <Nav.Link onClick={() => setMode("add_from_html")}>From Html</Nav.Link>
              <Nav.Link onClick={() => setMode("add_tags")}>Add Tags</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <Row className="justify-content-md-center">
          <Col md={8}>
            <main>
              {mode === 'list' && 
              <CardDialog>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Pattern</Form.Label>
                  <Form.Control type="text" value={pattern} onChange={ev => setPattern(ev.target.value)} placeholder="Enter pattern" />
                  {err && <div className="text-danger mt-2">Error: {err.type}</div>}
                </Form.Group>
              </CardDialog>}
              <>
                {mode === 'add' && (<CardDialog><AddEdit index={null} store={store} setStore={setStore} onClose={() => { setMode('list'); }} /></CardDialog>)}
                {mode === 'list' && (<StoreList eval={patt} store={store} setStore={setStore} />)}
                {mode === 'add_from_lines' && (<CardDialog><AddFromLines store={store} setStore={setStore} onClose={() => { setMode('list'); }} /></CardDialog>)}
                {mode === 'add_from_html' && (<CardDialog><AddFromHtml store={store} setStore={setStore} onClose={() => { setMode('list'); }} /></CardDialog>)}
                {mode === 'add_tags' && (<><CardDialog><AddTags eval={patt} store={store} setStore={setStore} onClose={() => { setMode('list'); }} /></CardDialog>
                  <StoreList eval={patt} store={store} setStore={setStore} />
                </>)}
              </>
            </main>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App
