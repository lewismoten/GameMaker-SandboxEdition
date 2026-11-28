// Format the dialog audit matrix in the order its cases ran.
export function formatSummary(themes: readonly string[], sizes: readonly string[], results: ReadonlyMap<string, { cells: string[]; notes: string[] }>): string {
  const columns = themes.flatMap((theme) => sizes.map((size) => `${theme} ${size}`));
  const row = (id: string, cells: string[]) => [id.padEnd(22), ...columns.map((label, i) => cells[i].padEnd(label.length))].join(' | ').trimEnd();
  const lines = [row('dialog', columns)];
  for (const [id, result] of results) {
    lines.push(row(id, result.cells), ...result.notes.slice(0, 4).map((note) => '    ' + note));
  }
  return lines.join('\n');
}
