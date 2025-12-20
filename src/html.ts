
type MessageList = string[];

export interface ExtractionResult {
    results: Map<string, string>[];
    messages: MessageList;
};

export interface PatternExtractor {
    tag: string;
    pattern: string;
}

const validate_selector = (selector: string) => {
  try {
    document.createDocumentFragment().querySelector(selector);
    return null; // valid
  } catch (e) {
    if (e instanceof DOMException && e.name === "SyntaxError") {
      return `Invalid selector: ${e.message}`;
    }
    throw e; // rethrow unexpected errors
  }
}

// note: ':scope > div' select only the direct div and not all divs
export const extract_html = (data: string, tags: PatternExtractor[], child_selectors: string[]) : ExtractionResult => {
    const parsed = (new DOMParser()).parseFromString(data, "text/html");

    if(child_selectors.length === 0) {
        return {messages: ['missing selectors'], results: []};
    }

    const results: Map<string, string>[] = [];
    const messages : MessageList = [];

    const parsed_tags = tags.map(x => {return {extractor: x, error: validate_selector(x.pattern)}});
    for(const p of parsed_tags)
    {
        if(p.error === null) continue;
        messages.push(`Failed to parse ${p.extractor.pattern}: ${p.error}`);
    }
    const valid_tags = parsed_tags.filter(x => x.error === null).map(x => x.extractor);

    for(const cs of child_selectors)
    {
        // if the current selector is bad, report error and continue
        const validated_child_selector = validate_selector(cs);
        if(validated_child_selector !== null)
        {
            messages.push(validated_child_selector);
            continue;
        }

        parsed.body.querySelectorAll(cs).forEach(element => {
            const resultMap = new Map<string, string>();
            for(const extractor of valid_tags) {
                const target = element.querySelector(extractor.pattern);
                if(target === null) continue;
                resultMap.set(extractor.tag, target.textContent);
            }
            if (resultMap.size > 0) {
                results.push(resultMap);
            }
        });
    }

    return {messages, results};
}