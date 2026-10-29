// Text made safe for XML: escaped for element content and attribute values, with the characters
// XML 1.0 can't hold at all taken out.

/** Characters XML 1.0 forbids anywhere (the C0 controls but tab, line feed and return; lone surrogates; U+FFFE/F). */
const NOT_XML = /[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;

/** Text for element content. */
export function xmlText(s: string): string {
  return s.replace(NOT_XML, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Text for a double-quoted attribute value. */
export function xmlAttr(s: string): string {
  return xmlText(s).replace(/"/g, '&quot;');
}
