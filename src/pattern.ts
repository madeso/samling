//format:
// %arg% replaces arg with its value, error if missing
// [arg] replaces arg with its value, "" if missing
// $func(arg,arg,arg) calls func

type Func = (args: string[]) => string;

// ---------------------------------------------------------------------------

type Error =
  | { type: "MissingFunction"; name: string } // Missing function <name>
  | { type: "MissingAttribute"; name: string } // Missing attribute <name>
  | { type: "SyntaxError"; name: string } // Syntax error: <name>
  | { type: "InvalidState" }; // invalid state

// --------------------------------------------------------------------------------------------

// public abstract string evaluate_node(FunctionLibrary funcs, ObjectRecord data);

const evaluate_many = (
  many_nodes: _Node[],
  funcs: FunctionLibrary,
  data: ObjectRecord
): string[] | Error => {
  const result = new Array<string>();
  for (const node of many_nodes) {
    const eved = evaluate_node(node, funcs, data);
    if (typeof eved === "string") {
      result.push(eved);
    } else {
      return eved;
    }
  }
  return result;
};

const evaluate_node = (
  node: _Node,
  funcs: FunctionLibrary,
  data: ObjectRecord
): string | Error => {
  switch (node.type) {
    case "text":
      return node.text;
    case "attribute":
      return data.get(node.attribute) ?? "";
    case "function": {
      const found_function = funcs.get(node.name);
      if (found_function) {
        const arg_list = evaluate_many(node.args, funcs, data);
        if (Array.isArray(arg_list) == false) {
          return arg_list;
        }
        return found_function(arg_list);
      }
      return { type: "MissingFunction", name: node.name };
    }
    case "list": {
      const string_list = evaluate_many(node.nodes, funcs, data);
      if (Array.isArray(string_list) == false) {
        return string_list;
      }

      return string_list.join("");
    }
  }
};

type _Node =
  | { type: "text"; text: string }
  | { type: "attribute"; attribute: string }
  | _FunctionCall
  | { type: "list"; nodes: _Node[] };

type _FunctionCall = {
  type: "function";
  name: string;
  args: _Node[];
};

const _Parser = (pattern: string): _Node[] | Error => {
  let state: "TEXT" | "VAR" | "FUNC" = "TEXT";
  let mem = "";
  const nodes = new Array<_Node>();
  let first_error: Error | null = null;

  const set_error = (err: Error) => {
    if (first_error !== null) return;
    first_error = err;
  };

  const add = (args: string[] | null = null) => {
    switch (state) {
      case "TEXT":
        if (mem != "") nodes.push({ type: "text", text: mem });
        break;
      case "VAR":
        if (mem != "") nodes.push({ type: "attribute", attribute: mem });
        else nodes.push({ type: "text", text: _Syntax.VARSIGN });
        break;
      case "FUNC":
        {
          if (args == null) {
            set_error({ type: "SyntaxError", name: "weird func call" });
          } else {
            const parsed_args = new Array<_Node>();
            for (const single_arg of args) {
              const p = _CompileList(single_arg);
              if (p.type === "error") {
                set_error(p.error);
              } else {
                parsed_args.push(p.node);
              }
            }
            nodes.push({ type: "function", name: mem, args: parsed_args });
          }
        }
        break;
    }
    mem = "";
  };

  const _ParseArguments = (
    start: number,
    pattern: string
  ): [string[], number] => {
    // return new index, and a list of string arguments that need to be parsed
    const args = new Array<string>();
    let state = 0;
    let mem = "";
    for (let i = start; i < pattern.length; ++i) {
      const c = pattern[i];
      switch (c) {
        case _Syntax.BEGINSIGN:
          mem += c;
          state += 1;
          break;
        case _Syntax.ENDSIGN:
          if (state == 0) {
            if (mem != "") {
              args.push(mem);
            }
            return [args, i];
          } else {
            mem += c;
          }
          state -= 1;
          break;
        case _Syntax.SEPSIGN:
          if (state == 0) {
            args.push(mem);
            mem = "";
          } else {
            mem += c;
          }
          break;
        default:
          mem += c;
          break;
      }
    }
    set_error({
      type: "SyntaxError",
      name: "should have detected an end before eos",
    });
    return [args, pattern.length - 1];
  };

  let i = 0;
  while (i < pattern.length) {
    const c = pattern[i];
    i += 1;
    switch (state) {
      case "TEXT":
        if (c == _Syntax.VARSIGN) {
          add();
          state = "VAR";
        } else if (c == _Syntax.FUNCSIGN) {
          add();
          state = "FUNC";
        } else {
          mem += c;
        }
        break;
      case "VAR":
        if (c == _Syntax.VARSIGN) {
          add();
          state = "TEXT";
        } else {
          mem += c;
        }
        break;
      case "FUNC":
        if (mem == "") {
          if (char_IsLetter(c)) mem += c;
          else throw new SyntaxError("function name is empty");
        } else {
          if (char_IsLetterOrDigit(c)) {
            mem += c;
          } else if (c == _Syntax.BEGINSIGN) {
            const [args, next_i] = _ParseArguments(i, pattern);
            i = next_i + 1;
            add(args);
            state = "TEXT";
          } else {
            set_error({
              type: "SyntaxError",
              name: "function calls must end with () and, mus begin with a letter and can only continue with alphanumerics",
            });
          }
        }
        break;
    }
  }
  if (mem != "") add();

  if (first_error !== null) return first_error;
  else return nodes;
};

const char_IsLetter = (c: string): boolean => {
  return /^[A-Za-z]$/.test(c);
};

const char_IsLetterOrDigit = (c: string): boolean => {
  return /^[A-Za-z0-9]$/.test(c);
};

const _Syntax = {
  VARSIGN: "%",
  FUNCSIGN: "$",
  BEGINSIGN: "(",
  ENDSIGN: ")",
  SEPSIGN: ",",
};

const _CompileList = (
  patt: string
): { type: "node"; node: _Node } | { type: "error"; error: Error } => {
  const parsed = _Parser(patt);
  if (Array.isArray(parsed)) {
    return { type: "node", node: { type: "list", nodes: parsed } };
  } else {
    return { type: "error", error: parsed };
  }
};

type FunctionLibrary = Map<string, Func>;
type ObjectRecord = Map<string, string>;

// todo(Gustav): change so that the evaluate_node can evaluate all errors during parse
export type EvalFunction = (
  funcs: FunctionLibrary,
  data: ObjectRecord
) => string | Error;

export const parse_pattern = (
  pattern: string
): [EvalFunction, Error | null] => {
  const parsed = _CompileList(pattern);
  if (parsed.type === "error") {
    return [() => "", parsed.error];
  }

  const evaluator: EvalFunction = (funcs, data) =>
    evaluate_node(parsed.node, funcs, data);
  return [evaluator, null];
};

const _opt = (args: string[], i: number, d: string = ""): string => {
  if (i < args.length) {
    return args[i];
  } else {
    return d;
  }
};

const zfill = (str: string, scount: string): string => {
  const i = Number.parseInt(scount);
  return str.padStart(i, "0");
};

const stringTrimStart = (str: string, spaces: string): string => {
  if (spaces === "") return str.trimStart();
  const pattern = new RegExp(`^[${spaces}]+`);
  return str.replace(pattern, "");
};

const stringTrimEnd = (str: string, spaces: string): string => {
  if (spaces === "") return str.trimEnd();
  const pattern = new RegExp(`[${spaces}]+$`);
  return str.replace(pattern, "");
};

const stringTrim = (str: string, spaces: string): string => {
  if (spaces === "") return str.trim();
  const pattern = new RegExp(`^[${spaces}]+|[${spaces}]+$`, "g");
  return str.replace(pattern, "");
};

const Capitalize = (str: string): string => {
  if (str.length === 0) return str;
  return str[0].toLocaleUpperCase() + str.slice(1);
};

export const DefaultFunctions = (): FunctionLibrary => {
  const t: FunctionLibrary = new Map<string, Func>();
  //t.Add("title", args => args[0].title());
  t.set("capitalize", (args) =>
    args.length > 0 ? Capitalize(args[0]) : "ERR: missing required arguments"
  );
  t.set("lower", (args) =>
    args.length > 0
      ? args[0].toLocaleLowerCase()
      : "ERR: missing required arguments"
  );
  t.set("upper", (args) =>
    args.length > 0
      ? args[0].toLocaleUpperCase()
      : "ERR: missing required arguments"
  );
  t.set("rtrim", (args) =>
    args.length > 0
      ? stringTrimEnd(args[0], _opt(args, 1))
      : "ERR: missing required arguments"
  );
  t.set("ltrim", (args) =>
    args.length > 0
      ? stringTrimStart(args[0], _opt(args, 1))
      : "ERR: missing required arguments"
  );
  t.set("trim", (args) =>
    args.length > 0
      ? stringTrim(args[0], _opt(args, 1))
      : "ERR: missing required arguments"
  );
  t.set("zfill", (args) =>
    args.length > 0
      ? zfill(args[0], _opt(args, 1, "3"))
      : "ERR: missing required arguments"
  );
  t.set("replace", (args) =>
    args.length > 1
      ? args[0].replace(args[1], args[2])
      : "ERR: missing required arguments"
  );
  // t.set("substr", (args) =>
  //   args[0].Substring(int.Parse(args[1]), int.Parse(_opt(args, 2)))
  // );
  return t;
};

/*
if __name__ == "__main__":
    data = {"artist":"Zynic", "title":"dreams in black and white", "album":"Dreams In Black And White", "track":"1"}
    print Compile("%artist% - %title% (%album%)").evaluate_node(DefaultFunctions(), data)
    print Compile("%artist% - $title(%title%) (%album%)").evaluate_node(DefaultFunctions(), data)
    print Compile("$zfill(%track%,3). $title(%title%)").evaluate_node(DefaultFunctions(), data)
    #print _ParseArguments(0, "a,b(1, 3),c)")*/
