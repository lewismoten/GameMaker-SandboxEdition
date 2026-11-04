// PreToolUse hook: blocks `git commit -m ...` whose message has no `Co-Authored-By: Claude` line.
// Commits without -m (editor, -F, --amend --no-edit) and everything else are allowed.
import { isMain, runHook } from './lib.mjs';

const COMMIT = /(^|[;&|(\s])git\s+(?:-[A-Za-z]\s+\S+\s+)*commit\b/;
const HAS_M = /\s(-[A-Za-z]*m|--message)\b/;

export function decide({ command }) {
  if (!COMMIT.test(command) || !HAS_M.test(command)) return null;
  if (/Co-Authored-By:\s*Claude/i.test(command)) return null;
  return 'Blocked: this commit message has no "Co-Authored-By: Claude ..." line. End the message with "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" (see the attribution in your instructions).';
}

if (isMain(import.meta.url)) await runHook(decide);
