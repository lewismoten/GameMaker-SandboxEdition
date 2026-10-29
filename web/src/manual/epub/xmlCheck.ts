// A small XML well-formedness check for the ePub tests (check.ts): one root element, every tag
// closed in order, attributes quoted and not repeated, and only the five predefined entities
// or character references (XHTML in an ePub has no DTD, so &nbsp; and the like are errors).
// Also hands back each element's name and attributes, for checking what they refer to.

export interface XmlElement {
  name: string;
  attrs: Record<string, string>;
}

export interface XmlResult {
  errors: string[];
  elements: XmlElement[];
}

const NAME = /^[A-Za-z_][\w.:-]*$/;
const ENTITY = /&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);/y;

/** Errors in the text between tags, or in an attribute value: a bare < or an unknown entity. */
function textProblem(s: string, at: number): string | undefined {
  if (s.includes('<')) return `"<" in text near ${at}`;
  for (let i = s.indexOf('&'); i >= 0; i = s.indexOf('&', i + 1)) {
    ENTITY.lastIndex = i;
    if (!ENTITY.test(s)) return `unknown or bare entity "${s.slice(i, i + 12)}" near ${at + i}`;
  }
  return undefined;
}

export function checkXml(xml: string): XmlResult {
  const errors: string[] = [];
  const elements: XmlElement[] = [];
  const open: string[] = [];
  let roots = 0;
  let i = 0;
  const fail = (msg: string) => errors.push(msg);
  while (i < xml.length && errors.length < 20) {
    const lt = xml.indexOf('<', i);
    const text = xml.slice(i, lt < 0 ? xml.length : lt);
    const bad = textProblem(text, i);
    if (bad) fail(bad);
    if (text.trim() && !open.length) fail(`text outside the root element near ${i}`);
    if (lt < 0) break;
    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt + 4);
      if (end < 0) return (fail('unclosed comment'), { errors, elements });
      i = end + 3;
    } else if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt);
      if (end < 0) return (fail('unclosed CDATA'), { errors, elements });
      i = end + 3;
    } else if (xml.startsWith('<?', lt)) {
      const end = xml.indexOf('?>', lt);
      if (end < 0) return (fail('unclosed processing instruction'), { errors, elements });
      i = end + 2;
    } else if (xml.startsWith('<!DOCTYPE', lt)) {
      if (roots || open.length) fail('DOCTYPE after the root element');
      const end = xml.indexOf('>', lt);
      if (end < 0 || xml.slice(lt, end).includes('[')) return (fail('a DOCTYPE this check does not read'), { errors, elements });
      i = end + 1;
    } else if (xml[lt + 1] === '/') {
      const end = xml.indexOf('>', lt);
      const name = xml.slice(lt + 2, end).trim();
      const top = open.pop();
      if (top !== name) fail(`</${name}> closes <${top ?? 'nothing'}> near ${lt}`);
      i = end + 1;
    } else {
      // a start tag: its name, then name="value" pairs, then > or />
      let j = lt + 1;
      const m = /^[^\s/>]+/.exec(xml.slice(j, j + 200));
      const name = m?.[0] ?? '';
      if (!NAME.test(name)) fail(`bad element name "${name}" near ${lt}`);
      j += name.length;
      const attrs: Record<string, string> = {};
      for (;;) {
        const ws = /^\s*/.exec(xml.slice(j, j + 400))![0];
        j += ws.length;
        if (xml.startsWith('/>', j) || xml[j] === '>') break;
        const a = /^([^\s=/>]+)\s*=\s*(["'])/.exec(xml.slice(j, j + 400));
        if (!a || !ws) return (fail(`bad attribute in <${name}> near ${j}`), { errors, elements });
        const close = xml.indexOf(a[2], j + a[0].length);
        if (close < 0) return (fail(`unclosed attribute in <${name}>`), { errors, elements });
        const value = xml.slice(j + a[0].length, close);
        if (!NAME.test(a[1])) fail(`bad attribute name "${a[1]}" near ${j}`);
        if (a[1] in attrs) fail(`<${name}> repeats ${a[1]} near ${j}`);
        const badValue = textProblem(value, j);
        if (badValue) fail(`in ${a[1]}: ${badValue}`);
        attrs[a[1]] = value
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        j = close + 1;
      }
      if (!open.length && roots++) fail(`a second root element <${name}>`);
      elements.push({ name, attrs });
      if (xml[j] === '>') {
        open.push(name);
        i = j + 1;
      } else i = j + 2;
    }
  }
  if (open.length) fail(`unclosed <${open.join('>, <')}>`);
  if (!roots) fail('no root element');
  return { errors, elements };
}
