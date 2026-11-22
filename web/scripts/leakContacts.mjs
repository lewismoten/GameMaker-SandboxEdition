// Classify network addresses and email domains in text files selected by the build sweep.
import { readFileSync } from 'node:fs';
import { isIP } from 'node:net';

const { mockDomains, sites } = JSON.parse(readFileSync(new URL('../src/manual/magazine/mockSites.json', import.meta.url), 'utf8'));
const allowedDomains = new Set([...mockDomains.map(({ domain }) => domain), 'example.org', 'example.net', 'example.com', 'users.noreply.github.com']);
const allowedEmails = new Set(['git@github.com', ...sites.flatMap(({ contact }) => (contact ? [contact.toLowerCase()] : []))]);
const unknownEmails = new Set();
let addressFiles = 0;
for (const file of readFileSync(0, 'utf8').split('\0').filter(Boolean)) {
  const text = readFileSync(file, 'utf8');
  // Browser and OS identification strings can contain dotted version quads, including version comparisons.
  const networkText = text.replace(/\b(?:chrome|firefox|version|windows nt)[ /]+\d+(?:\.\d+){3}(?:\s+\/\s+\d+(?:\.\d+){3})?(?![\w.:])/gi, '');
  const privateAddress =
    /\b[\w-]+\.ts\.net\b/i.test(networkText) ||
    [...networkText.matchAll(/(?<![\w.:])fe[89ab][\da-f]:[\da-f:]+/gi)].some(([ip]) => isIP(ip) === 6) ||
    [...networkText.matchAll(/(?<![\w.])\d{1,3}(?:\.\d{1,3}){3}(?!\w|\.\d)/g)].some(([ip]) => {
      if (isIP(ip) !== 4) return false;
      const [a, b] = ip.split('.').map(Number);
      return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
    }) ||
    /\b127\.0\.0\.1:\d+\b/.test(networkText);
  if (privateAddress) {
    addressFiles++;
    console.log('     ' + file);
  }
  for (const [email, domain] of text.matchAll(/[\w.%+-]+@([\w-]+(?:\.[\w-]+)*\.[a-z]{2,})/gi)) {
    if (!allowedEmails.has(email.toLowerCase()) && !allowedDomains.has(domain.toLowerCase())) unknownEmails.add(email.toLowerCase());
  }
}
console.log('-- private network addresses: ' + addressFiles + ' file(s)');
console.log('-- unrecognized email addresses: ' + unknownEmails.size);
process.exitCode = Number(addressFiles > 0 || unknownEmails.size > 0);
