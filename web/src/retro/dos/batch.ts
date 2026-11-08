// A small batch-file interpreter for the retro PC's COMMAND.COM, after MS-DOS 3.30 to 5.0.
// It runs what RSD's .BAT files in C:\GM use (ECHO, REM, CLS, PAUSE, labels, GOTO, IF EXIST,
// IF "a"=="b", IF ERRORLEVEL, CALL, SHIFT, %0-%9) and hands every other line to the shell, so
// built-ins and programs behave exactly as typed at the prompt. Running one .BAT by name from
// another (GMMENU.BAT at the end of PL.BAT) chains: the new file replaces the old, as in DOS,
// while CALL runs it and comes back.

/** What the interpreter needs from the shell and the screen. */
export interface BatchHost {
  /** The line with its newline. */
  out(text: string): void;
  print(text: string): void;
  /** The prompt as it stands now, shown before each line while ECHO is on. */
  prompt(): string;
  clear(): void;
  /** Runs one command as if typed at the prompt (built-ins, programs). */
  execute(line: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  /** The text of the .BAT the word names (current folder, then PATH), or undefined. */
  findBat(word: string): Promise<string | undefined>;
  /** Waits for a key; true when it was Ctrl+C or Ctrl+Break. */
  waitKey(): Promise<boolean>;
  /** True when Ctrl+C or Ctrl+Break was typed since the last look (the key is used up). */
  breakTyped(): boolean;
  /** Asks "Terminate batch job (Y/N)?"; true for Y. */
  terminate(): Promise<boolean>;
}

/** ECHO state is shared with CALLed files, as in DOS. */
interface Ctx {
  echo: boolean;
  depth: number;
}

const MAX_DEPTH = 16;
const UNSUPPORTED = new Set(['SET', 'FOR']);

/** Splits a file's text into lines (CR LF, LF; a Ctrl-Z ends it). */
function split(text: string): string[] {
  const end = text.indexOf('\x1a');
  return (end < 0 ? text : text.slice(0, end)).split(/\r?\n/);
}

/** %0 to %9 and %%; unset parameters are empty. */
function expand(line: string, params: string[]): string {
  return line.replace(/%(%|[0-9])/g, (_, c: string) => (c === '%' ? '%' : (params[Number(c)] ?? '')));
}

/** A label's name: the word after the colon, 8 characters, any case. */
function labelOf(line: string): string | undefined {
  const t = line.trim();
  return t.startsWith(':') ? t.slice(1).trim().split(/[\s]/)[0].slice(0, 8).toUpperCase() : undefined;
}

type Step = { kind: 'next' } | { kind: 'goto'; label: string } | { kind: 'end' } | { kind: 'chain'; text: string; params: string[] };

class Batch {
  private lines: string[];
  private params: string[];
  private ip = 0;

  constructor(
    private host: BatchHost,
    private ctx: Ctx,
    text: string,
    params: string[],
  ) {
    this.lines = split(text);
    this.params = params;
  }

  /** Runs to the end; false when Ctrl+C ended it. */
  async run(): Promise<boolean> {
    while (this.ip < this.lines.length) {
      if (this.host.breakTyped() && (await this.host.terminate())) return false;
      const raw = this.lines[this.ip++];
      let line = expand(raw, this.params).trim();
      const quiet = line.startsWith('@');
      if (quiet) line = line.slice(1).trim();
      if (!line || line.startsWith(':')) continue;
      if (this.ctx.echo && !quiet) this.host.out(this.host.prompt() + line);
      const step = await this.line(line);
      if (step.kind === 'end') return !this.aborted;
      if (step.kind === 'goto') {
        const to = this.lines.findIndex((l) => labelOf(l) === step.label);
        if (to < 0) {
          this.host.out('Label not found');
          return true;
        }
        this.ip = to + 1;
      } else if (step.kind === 'chain') {
        this.lines = split(step.text);
        this.params = step.params;
        this.ip = 0;
      }
      if (step.kind === 'next' && this.aborted) return false;
    }
    return true;
  }

  /** Set when a CALLed file was ended by Ctrl+C: this one ends too. */
  private aborted = false;

  /** One line, already expanded. The first word may be glued to its argument ("echo.", "cd.."). */
  private async line(line: string): Promise<Step> {
    const m = /^([A-Za-z]+)(.*)$/.exec(line);
    const word = m?.[1].toUpperCase() ?? '';
    const rest = m?.[2] ?? '';
    // a command word ends at a space or one of . \ / : [ + ; anything else glued on makes it a different name
    const ends = rest === '' || /^[\s.\\/:[+=]/.test(rest);
    if (m && ends) {
      switch (word) {
        case 'REM':
          return { kind: 'next' };
        case 'ECHO':
          return this.echo(rest);
        case 'CLS':
          this.host.clear();
          return { kind: 'next' };
        case 'PAUSE':
          return this.pause();
        case 'GOTO':
          return rest.trim() ? { kind: 'goto', label: rest.trim().replace(/^:/, '').split(/\s/)[0].slice(0, 8).toUpperCase() } : { kind: 'next' };
        case 'SHIFT':
          this.params.splice(1, 1);
          return { kind: 'next' };
        case 'IF':
          return this.if(rest.trim());
        case 'CALL':
          return this.call(rest.trim());
      }
      if (UNSUPPORTED.has(word)) {
        this.host.out(`${word} is not supported in this PC's batch files`);
        return { kind: 'next' };
      }
    }
    if (/[<>|]/.test(line)) {
      this.host.out('Redirection and pipes are not supported in this PC');
      return { kind: 'next' };
    }
    // a .BAT named without CALL replaces this one
    const first = line.split(/\s+/)[0];
    const text = await this.host.findBat(first);
    if (text !== undefined) return { kind: 'chain', text, params: [first, ...line.split(/\s+/).slice(1)] };
    await this.host.execute(line);
    return { kind: 'next' };
  }

  private echo(rest: string): Step {
    const t = rest.trim().toLowerCase();
    if (rest === '' || (/^\s/.test(rest) && t === '')) this.host.out(`ECHO is ${this.ctx.echo ? 'on' : 'off'}`);
    else if (/^\s/.test(rest) && t === 'off') this.ctx.echo = false;
    else if (/^\s/.test(rest) && t === 'on') this.ctx.echo = true;
    // ECHO. and ECHO: print what follows the dot, spaces and all; ECHO text drops the one space after ECHO
    else this.host.out(rest.slice(1));
    return { kind: 'next' };
  }

  private async pause(): Promise<Step> {
    this.host.print('Press any key to continue . . .');
    const brk = await this.host.waitKey();
    this.host.print('\n');
    if (brk && (await this.host.terminate())) {
      this.aborted = true;
      return { kind: 'end' };
    }
    return { kind: 'next' };
  }

  private async if(rest: string): Promise<Step> {
    const neg = /^not\s+/i.exec(rest);
    const body = neg ? rest.slice(neg[0].length) : rest;
    const test = (v: boolean): boolean => v !== !!neg;
    let m = /^exist\s+(\S+)\s+(.+)$/i.exec(body);
    if (m) return test(await this.host.exists(m[1])) ? this.line(m[2].trim()) : { kind: 'next' };
    m = /^errorlevel\s+(\d+)\s+(.+)$/i.exec(body);
    // programs here return no error level, so it is always 0 ("IF ERRORLEVEL 0" is true, as in DOS)
    if (m) return test(Number(m[1]) <= 0) ? this.line(m[2].trim()) : { kind: 'next' };
    m = /^(\S*?)==(\S*)\s+(.+)$/.exec(body);
    if (m) return test(m[1] === m[2]) ? this.line(m[3].trim()) : { kind: 'next' };
    this.host.out('Syntax error');
    return { kind: 'next' };
  }

  private async call(rest: string): Promise<Step> {
    if (!rest) return { kind: 'next' };
    const words = rest.split(/\s+/);
    const text = await this.host.findBat(words[0]);
    if (text === undefined) {
      await this.line(rest);
      return { kind: 'next' };
    }
    if (this.ctx.depth >= MAX_DEPTH) {
      this.host.out('Batch file too deeply nested');
      return { kind: 'end' };
    }
    this.ctx.depth++;
    const ok = await new Batch(this.host, this.ctx, text, words).run();
    this.ctx.depth--;
    if (!ok) this.aborted = true;
    return { kind: 'next' };
  }
}

/** Runs a batch file's text; args are the words after its name, name is %0. */
export async function runBatch(host: BatchHost, text: string, name: string, args: string[]): Promise<void> {
  await new Batch(host, { echo: true, depth: 0 }, text, [name, ...args]).run();
}
