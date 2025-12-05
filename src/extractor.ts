type Complexity = {
  Arguments: number;
  Verifiers: number;
};

type Match = {
  isText: boolean;
  data: string;
};

export class KeyValueExtractor {
  private matchers: Match[] = [];
  private numberOfDirectorySeparators = 0;
  private support: "path" | "string";

  private constructor(s: "path" | "string") {
    this.support = s;
  }

  static compile(
    pattern: string,
    type: "path" | "string"
  ): [KeyValueExtractor, string | null] {
    const p = new KeyValueExtractor(type);
    const k = "%";
    let special = false;
    let mem = "";

    for (const c of pattern) {
      if (c === k) {
        const t = mem;
        mem = "";
        if (special) {
          if (t === "") {
            mem += k;
          } else {
            p.addArgument(t);
          }
        } else {
          if (t !== "") {
            p.addText(t);
          }
        }
        special = !special;
      } else {
        mem += c;
      }
    }

    let error: string | null = null;
    if (special) {
      error = "Format error";
    }
    if (mem !== "") p.addText(mem);
    return [p, error];
  }

  addText(t: string): this {
    this.matchers.push({ isText: true, data: t });
    this.numberOfDirectorySeparators += (t.match(/[\\/]/g) || []).length;
    return this;
  }

  addArgument(t: string): this {
    this.matchers.push({ isText: false, data: t });
    return this;
  }

  private getText(filePath: string): string {
    // filePath: full path to file
    const parts = filePath.replace(/\\/g, "/").split("/");
    let s = parts.pop() || "";
    s = s.replace(/\.[^/.]+$/, ""); // remove extension
    for (let i = 0; i < this.numberOfDirectorySeparators; ++i) {
      const d = parts.pop();
      if (d) s = d + "/" + s;
    }
    return s;
  }

  extractFromFile(filePath: string): {
    result: Map<string, string>;
    message: string | null;
  } {
    const t = this.support === "path" ? this.getText(filePath) : filePath;
    return this.extract(t);
  }

  toString(): string {
    return this.matchers
      .map((m) => (m.isText ? m.data.replace(/%/g, "%%") : `%${m.data}%`))
      .join("");
  }

  private extract(t: string): {
    result: Map<string, string>;
    message: string | null;
  } {
    let start = 0;
    let arg = "";
    const r = new Map<string, string>();
    for (const m of this.matchers) {
      if (m.isText) {
        const end = t.indexOf(m.data, start);
        if (end === -1) {
          return {
            result: r,
            message: `Unable to find ${m.data} in ${t.substring(start)}`,
          };
        }
        if (arg !== "") {
          const val = t.substring(start, end);
          if (!this.apply(r, arg, val)) {
            return { result: r, message: `Unable to apply <${val}> to ${arg}` };
          }
          arg = "";
        }
        start = end + m.data.length;
      } else {
        if (arg !== "") throw new Error("bad format");
        arg = m.data;
      }
    }
    if (arg !== "") {
      const val = t.substring(start);
      if (!this.apply(r, arg, val)) {
        return { result: r, message: `Unable to apply <${val}> to ${arg}` };
      }
    }
    return { result: r, message: null };
  }

  private apply(r: Map<string, string>, arg: string, p: string): boolean {
    const found = r.get(arg);
    if (found !== undefined) {
      const a = found.toLowerCase().replace(/_/g, "").replace(/^0+/, "").trim();
      const b = p.toLowerCase().replace(/_/g, "").replace(/^0+/, "").trim();
      if (a !== b) return false;
    }
    r.set(arg, p);
    return true;
  }

  calculateComplexity(): Complexity {
    const counts: Record<string, number> = {};
    for (const m of this.matchers) {
      if (!m.isText) {
        const arg = m.data.toLowerCase();
        counts[arg] = (counts[arg] || 0) + 1;
      }
    }
    return {
      Arguments: Object.values(counts).filter((v) => v > 0).length,
      Verifiers: Object.values(counts).filter((v) => v > 1).length,
    };
  }

  countInText(calculator: (s: string) => number): number {
    return this.matchers.reduce(
      (c, m) => c + (m.isText ? calculator(m.data) : 0),
      0
    );
  }
}
