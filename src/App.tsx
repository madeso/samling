import { useState } from 'react'
import logo from '/logo.svg'
import './App.css'
import { get_mode, load_store, save_mode, save_store, type Item, type Mode, type Store } from './store';


const StoreList = (props: { store: Store, setStore: (store: Store) => void }) => {
  return <ul>
    {
      props.store.items.map((item, item_index) => {
        return <li key={item_index}>
          {item.name}
          <button onClick={() => {
            const x = structuredClone(props.store);
            x.items.splice(item_index, 1);
            console.log(x.items.length);
            props.setStore(x);
          }}>x</button>
        </li>
      })
    }
  </ul>;
}

const AddMany = (props: { store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
  const [lines, setLines] = useState<string>("");
  const parsed = lines.split('\n')
    .map(x => x.trim())
    .filter(x => x !== '')
    .map(x => {
      const [parsedName, parsedUrl] = x.split(']', 2);
      return {
        name: parsedName.trim().replace(/^([0-9]+\s*\.\s*\[)/,"").trim(),
        url: parsedUrl.trim().replace(/^(\()/,"").replace(/\)\s*$/,"").trim(),
        tags: [] }
    });
  return <>
    <div><textarea value={lines} onChange={(ev) => {
      const v = ev.target.value;
      setLines(v);
    }} /></div>
    <ul>
      {parsed.map((item, item_index) => <li key={item_index}><b>{item.name}</b> | {item.url}</li>)}
    </ul>
    <button onClick={() => {
      const s = structuredClone(props.store);
      for (const i of parsed) {
        s.items.push(i)
      }
      props.setStore(s);
      props.onClose();
    }}>OK</button>
    <button onClick={() => {
      props.onClose();
    }}>abort</button>
  </>;
}

const AddEdit = (props: { store: Store, setStore: (store: Store) => void, onClose: () => void }) => {
  const [item, setItem] = useState<Item>({ name: "", url: "", tags: [] });
  return <div>
    <div>Name</div>
    <div><input type='text' value={item.name} onChange={(ev) => {
      const v = ev.target.value;
      setItem(i => { return { ...i, name: v }; });
    }} /></div>
    <div>Url</div>
    <div><input type='text' value={item.url} onChange={(ev) => {
      const v = ev.target.value;
      setItem(i => { return { ...i, url: v }; });
    }} /></div>
    <button onClick={() => {
      const s = structuredClone(props.store);
      s.items.push(structuredClone(item));
      props.setStore(s);
      props.onClose();
    }}>OK</button>
    <button onClick={() => {
      props.onClose();
    }}>abort</button>
  </div>;
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
      <div>
        <img src={logo} className="logo" alt="Vite logo" />
      </div>
      <h1>Samling</h1>
      <div>
        <button onClick={() => setMode("list")}>List</button>
        <button onClick={() => setMode("add")}>Add</button>
        <button onClick={() => setMode("add_many")}>Add Many</button>
      </div>
      <main>
        {mode === 'add' && (<AddEdit store={store} setStore={setStore} onClose={() => { setMode('list'); }} />)}
        {mode === 'list' && (<StoreList store={store} setStore={setStore} />)}
        {mode === 'add_many' && (<AddMany store={store} setStore={setStore} onClose={() => { setMode('list'); }} />)}
      </main>
    </>
  )
}

export default App
