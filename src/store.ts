const LOCAL_STORAGE_KEY = "store";
const MODE_STORAGE_KEY = "mode";

export type Mode = "list" | "add" | "add_many";

export interface Item {
  name: string;
  url: string;
  tags: string[];
}

export interface Store {
  items: Item[];
}

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
  const parsed = object as Store | null | undefined;
  if (parsed === null || parsed === undefined) {
    console.warn("Failed to parse local storage json", source, parsed);
    return null;
  }

  return parsed;
};
export const save_store = (theme: Store) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(theme));
  } catch (x) {
    console.warn("Failure to save to local storage", x);
  }
};
