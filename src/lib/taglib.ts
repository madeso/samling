export const add_tag = (tags: string[], tagToAdd: string): string[] =>
  [...tags.filter(tag => tag !== tagToAdd), tagToAdd];
