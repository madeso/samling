import { useState } from "react";
import { add_tag } from "../lib/taglib";


export const TagEdit = (props: { tags: string[], setTags: (tags: string[]) => void }) => {
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