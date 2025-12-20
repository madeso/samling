const LOCAL_STORAGE_KEY = "store";
const MODE_STORAGE_KEY = "mode";

export type Mode = "list" | "add" | "add_pattern" | "add_tags" | "from_html";

interface GenericItem<T> {
  properties: T;
  tags: string[];
}

interface GenericStore<T> {
  items: GenericItem<T>[];
}

type AppProperties = Map<string, string>;
export type Item = GenericItem<AppProperties>;
export type Store = GenericStore<AppProperties>;

export const get_mode = (): Mode | null => {
  try {
    return localStorage.getItem(MODE_STORAGE_KEY) as Mode | null;
  } catch (x) {
    console.warn("Failure to get from local storage", x);
    return null;
  }
};
export const save_mode = (str: Mode) => {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, str);
  } catch (x) {
    console.warn("Failure to save to local storage", x);
  }
};

type SerializedProps = [string, string][];
const export_props = (value: AppProperties): SerializedProps => [
  ...value.entries(),
];
const import_props = (value: SerializedProps): AppProperties => new Map(value);

export const load_store = (): Store | null => {
  const source = (() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEY);
    } catch (x) {
      console.warn("Failure to get from local storage", x);
      return null;
    }
  })();
  if (source === null) return null;
  const object = JSON.parse(source);
  const parsed = object as GenericStore<SerializedProps> | null | undefined;
  if (parsed === null || parsed === undefined) {
    console.warn("Failed to parse local storage json", source, parsed);
    return null;
  }

  return {
    ...parsed,
    items: parsed.items.map((item) => {
      return { ...item, properties: import_props(item.properties) };
    }),
  };
};
export const save_store = (store: Store) => {
  try {
    const exported_store: GenericStore<SerializedProps> = {
      ...store,
      items: store.items.map((item) => {
        return { ...item, properties: export_props(item.properties) };
      }),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(exported_store));
  } catch (x) {
    console.warn("Failure to save to local storage", x);
  }
};
