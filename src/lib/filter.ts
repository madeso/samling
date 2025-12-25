import type { EvalFunction } from "../pattern";
import type { Item } from "../store";
import { evaluation } from "./eval";

export const is_excluded = (evala: EvalFunction, item: Item, contains: string) => {
  const name = evaluation(evala, item.properties);
  if (name === undefined) return false;
  const item_name = name.toLowerCase();
  const search_term = contains.toLowerCase();
  const index = item_name.indexOf(search_term);
  return index < 0;
}
