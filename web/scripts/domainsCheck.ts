// `npm run domains:check`: confirms every made-up domain in the registry
// (src/manual/magazine/mockSites.json) is still unregistered. For each one it asks the
// registry's whois server (.edu EDUCAUSE, .gov dotgov, .nz irs.net.nz, .com/.net Verisign, others
// through whois.iana.org's referral) plus DNS, and for each TLD it asks about a nonsense name first
// as a control, so a changed "not found" wording shows up as CONTROL FAILED instead of a false OK.
// Needs the network, so it is not part of CI or vitest. Exit 0 all free, 1 a domain is taken or a
// control failed, 2 a lookup could not run (offline). Run from web/.
import { promises as dns } from 'node:dns';
import net from 'node:net';
import registry from '../src/manual/magazine/mockSites.json';

const TIMEOUT = 8000;
const FIXED: Record<string, string> = {
  edu: 'whois.educause.edu',
  gov: 'whois.dotgov.gov',
  nz: 'whois.irs.net.nz',
  com: 'whois.verisign-grs.com',
  net: 'whois.verisign-grs.com',
};
const NOT_FOUND = /no match|not found|no object found|no data found|no entries found|status:\s*available|query_status:\s*220|is available|domain not found/i;
const FOUND = /domain name:|domain_name|query_status:\s*200|^domain:|registrar:|status:\s*(active|registered)/im;

function whoisRaw(server: string, query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const sock = net.connect(43, server);
    let out = '';
    sock.setTimeout(TIMEOUT, () => sock.destroy(new Error('timeout')));
    sock.on('connect', () => sock.write(`${query}\r\n`));
    sock.on('data', (d: Buffer) => (out += d.toString()));
    sock.on('end', () => resolve(out));
    sock.on('error', reject);
  });
}

const serverCache = new Map<string, Promise<string>>();
function serverFor(tld: string): Promise<string> {
  const fixed = FIXED[tld];
  if (fixed) return Promise.resolve(fixed);
  let p = serverCache.get(tld);
  if (!p) {
    p = whoisRaw('whois.iana.org', tld).then((t) => {
      const m = /^(?:whois|refer):\s*(\S+)/im.exec(t);
      if (!m) throw new Error(`no whois server for .${tld}`);
      return m[1];
    });
    serverCache.set(tld, p);
  }
  return p;
}

type Verdict = 'free' | 'taken' | 'unclear' | 'offline';
async function whoisVerdict(domain: string): Promise<{ verdict: Verdict; note: string }> {
  try {
    const server = await serverFor(domain.slice(domain.lastIndexOf('.') + 1));
    const text = await whoisRaw(server, domain);
    if (NOT_FOUND.test(text)) return { verdict: 'free', note: 'not found' };
    if (FOUND.test(text)) return { verdict: 'taken', note: 'registered' };
    return { verdict: 'unclear', note: 'unrecognized reply' };
  } catch (e) {
    return { verdict: 'offline', note: (e as Error).message };
  }
}

async function dnsResult(domain: string): Promise<string> {
  const tries = await Promise.all(
    [dns.resolveNs(domain), dns.resolve4(domain)].map((p) =>
      p.then(
        () => 'ok',
        (e: NodeJS.ErrnoException) => e.code ?? 'error',
      ),
    ),
  );
  if (tries.includes('ok')) return 'RESOLVES';
  if (tries.every((c) => c === 'ENOTFOUND' || c === 'ENODATA')) return tries.includes('ENOTFOUND') ? 'NXDOMAIN' : 'no records';
  return `error (${tries.join('/')})`;
}

interface Row {
  domain: string;
  dns: string;
  whois: string;
  status: string;
}
const mocks = registry.mockDomains as { domain: string; check?: string }[];
const tlds = [...new Set(mocks.filter((m) => m.check !== 'dns').map((m) => m.domain.slice(m.domain.lastIndexOf('.') + 1)))];

const controls = await Promise.all(
  tlds.map(async (tld): Promise<Row> => {
    const domain = `zz-no-such-domain-q7x9k2.${tld}`;
    const w = await whoisVerdict(domain);
    const status = w.verdict === 'free' ? 'control ok' : w.verdict === 'offline' ? 'COULD NOT RUN' : 'CONTROL FAILED';
    return { domain, dns: '-', whois: w.verdict === 'free' ? w.note : `${w.verdict}: ${w.note}`, status };
  }),
);
const controlOk = new Set(controls.filter((c) => c.status === 'control ok').map((c) => c.domain.slice(c.domain.lastIndexOf('.') + 1)));

const rows = await Promise.all(
  mocks.map(async (m): Promise<Row> => {
    const tld = m.domain.slice(m.domain.lastIndexOf('.') + 1);
    const d = await dnsResult(m.domain);
    if (m.check === 'dns')
      return { domain: m.domain, dns: d, whois: 'n/a (DNS only)', status: d === 'RESOLVES' ? 'TAKEN' : d.startsWith('error') ? 'COULD NOT RUN' : 'OK' };
    const w = await whoisVerdict(m.domain);
    let status = 'OK';
    if (w.verdict === 'offline') status = 'COULD NOT RUN';
    else if (w.verdict === 'taken' || d === 'RESOLVES') status = 'TAKEN';
    else if (w.verdict === 'unclear') status = 'UNCLEAR';
    else if (!controlOk.has(tld)) status = 'UNTRUSTED (control failed)';
    return { domain: m.domain, dns: d, whois: w.verdict === 'free' ? w.note : `${w.verdict}: ${w.note}`, status };
  }),
);

const all = [...rows, ...controls];
const width = (k: keyof Row): number => Math.max(k.length, ...all.map((r) => r[k].length));
const line = (r: Row): string => (['domain', 'dns', 'whois', 'status'] as const).map((k) => r[k].padEnd(width(k))).join('  ');
console.log(line({ domain: 'domain', dns: 'dns', whois: 'whois', status: 'status' }));
for (const r of rows) console.log(line(r));
console.log(`\ncontrols (nonsense names, must be "not found"):`);
for (const r of controls) console.log(line(r));

const bad = all.some((r) => /TAKEN|CONTROL FAILED|UNCLEAR|UNTRUSTED/.test(r.status));
const offline = all.some((r) => r.status === 'COULD NOT RUN');
if (bad) console.log('\nFAIL: a made-up domain is registered, or a lookup could not be trusted. Pick another in mockSites.json.');
else if (offline) console.log('\nCOULD NOT RUN: some lookups failed (offline or a registry timed out). Nothing was confirmed for those.');
else console.log('\nAll made-up domains are still unregistered.');
process.exit(bad ? 1 : offline ? 2 : 0);
