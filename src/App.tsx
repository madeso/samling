import { useState } from 'react'
import logo from '/logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Navbar, Nav, Form, Image, ListGroup } from 'react-bootstrap';
import { get_mode, load_store, save_mode, save_store, type Item, type Mode, type Store } from './store';

import Icon from '@mdi/react';
import { mdiDelete } from '@mdi/js';
import { KeyValueExtractor } from './extractor';
import { DefaultFunctions, parse_pattern, type EvalFunction } from './pattern';
import { extract_html, type PatternExtractor } from './html';

const DeleteIcon = () => <Icon path={mdiDelete} size={1} color="red" title={"Delete"} />;

const evaluation = (evala: EvalFunction, properties: Map<string, string>): string => {
  const display = evala(DefaultFunctions(), properties);
  return typeof display === 'string' ? display : display.type
}

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

const StoreList = (props: { eval: EvalFunction, store: Store, setStore: (store: Store) => void }) => {
  return (
    <ListGroup>
      {props.store.items.map((item, item_index) => (
        <ItemDisplay eval={props.eval} key={item_index} item={item} item_index={item_index} store={props.store} setStore={props.setStore} />
      ))}
    </ListGroup>
  );
}

const AddAdvanced = (props: { store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
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


const AddFromHtml = (props: { store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
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

const CardDialog = (props: React.PropsWithChildren) =>
  <Card className="mt-3 shadow-sm">
    <Card.Body>{props.children}</Card.Body>
  </Card>;

const add_tag = (tags: string[], tagToAdd: string): string[] =>
  [...tags.filter(tag => tag !== tagToAdd), tagToAdd];

const TagEdit = (props: { tags: string[], setTags: (tags: string[]) => void }) => {
  const [tagInput, setTagInput] = useState("");

  const addTag = (tagToAdd: string) => {
    // remove tag if it exist, then add it last
    props.setTags(add_tag(props.tags, tagToAdd));
  };
  const removeTag = (tagToRemove: string) => {
    props.setTags(props.tags.filter(t => t !== tagToRemove));
  };

  const add_item_to_tag = () => {
    const newTag = tagInput.trim();
    if (newTag) {
      addTag(newTag);
      setTagInput("");
    }
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter' || ev.key === ',' || ev.key === ' ') {
      ev.preventDefault();
      add_item_to_tag();
    } else if (ev.key === 'Backspace' && tagInput === "" && props.tags.length > 0) {
      ev.preventDefault();
      props.setTags(props.tags.slice(0, -1));
    }
  };
  return (
    <div
      className="d-flex flex-wrap align-items-center gap-2"
      style={{ minHeight: '38px', border: '1px solid #ced4da', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', background: '#fff' }}>
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
        onBlur={() => {
          add_item_to_tag();
        }}
        placeholder="Add tag"
        autoComplete="off"
      />
    </div>
  );
}

const is_excluded = (evala: EvalFunction, item: Item, contains: string) => {
  const name = evaluation(evala, item.properties);
  if (name === undefined) return false;
  const item_name = name.toLowerCase();
  const search_term = contains.toLowerCase();
  const index = item_name.indexOf(search_term);
  return index < 0;
}

const AddTagsToFiltered = (props: { eval: EvalFunction, store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
  const [contains, setContains] = useState("");
  const [newTags, setNewTags] = useState(new Array<string>());

  const onOk = () => {
    props.setStore({
      ...props.store, items: props.store.items.map((item): Item => {
        if (is_excluded(props.eval, item, contains)) {
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


const AddEdit = (props: { index: number | null, store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
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
              <Nav.Link onClick={() => setMode("add_pattern")}>From Lines</Nav.Link>
              <Nav.Link onClick={() => setMode("from_html")}>From Html</Nav.Link>
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
                {mode === 'add_pattern' && (<CardDialog><AddAdvanced store={store} setStore={setStore} onClose={() => { setMode('list'); }} /></CardDialog>)}
                {mode === 'from_html' && (<CardDialog><AddFromHtml store={store} setStore={setStore} onClose={() => { setMode('list'); }} /></CardDialog>)}
                {mode === 'add_tags' && (<><CardDialog><AddTagsToFiltered eval={patt} store={store} setStore={setStore} onClose={() => { setMode('list'); }} /></CardDialog>
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
