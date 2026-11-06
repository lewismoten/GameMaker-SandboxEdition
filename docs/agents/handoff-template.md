# Handoff note template

A handoff is a note an agent leaves so the next session can continue without the conversation. It is read
once, at the start, so it has to be short and true. Aim for one page and never more than two. A running log is a
different thing: keep it in its own file, and do not paste commit hashes the repository already holds.

## Rules for the note

1. Start with a real time (from the `date` command, not a guess), the branch and the head commit.
2. Put the first action at the top. A reader who stops after ten lines should still know what to do.
3. Write **Not checked** every time. It is the most useful section and the hardest to find later.
4. When an item is finished, strike it in place and name the commit. A stale list should look stale.
5. Link to rules; do not copy them. Restate a rule only if it changed this session, with why.
6. State that changes (a server, a port, load, which agents run) gets a "checked at" time and the command to
   check it again.
7. Delete rather than append. Write the Next list last.
8. No secrets, keys, device ids, hosts, schedules or chat text.
9. Name the file by time and add an exact "Follows" line.

## Template

```
# Handoff: <topic>

Written: <date and time from `date`> | Branch: <name> | Head: <short hash>
Follows: <exact filename, or "none">

## Start here
1. The first action, with the command to run.
2. The second.
3. The third.

## Waiting on the owner
- [W1] Question, asked <date>. What each answer would change.

## Not checked
- What still needs a person, a device or a live test, and why it was not checked.

## Done (for the reader, not a log)
- One line per outcome, with a branch or commit range. Struck items stay struck.

## Decisions made without asking
- The choice, the reason, and how to reverse it.

## Rules that changed this session
- The rule, the date, and what went wrong. Everything else: see the rules file.

## State (check again before trusting)
- Item, value, checked at <time>, re-check with `<command>`.

## Do not
- Things tried that failed, or that are off limits, and why.

## Pointers
- Paths to reports, plans and scripts. Only paths that outlive this session.
```

## Invented example

```
# Handoff: level-select screen

Written: Tue 14:20 | Branch: feature/level-select | Head: 3fa91c2
Follows: none

## Start here
1. Play the select screen with arrow keys only (`npm run dev`, then open the demo game).
2. Decide whether the title music should continue under it (see W1).
3. Run the demo game's checks, then merge.

## Waiting on the owner
- [W1] Should title music continue under the select screen? Asked Tue. Yes: remove the fade. No: keep it.

## Not checked
- Touch input on a tablet. No device was available.
- The walkthrough was not re-recorded, so its length is unchanged on paper only.

## Done
- Level-select scene added to the demo game (3fa91c2).
- ~~Reader and writer tests for the scene file~~ passed (b71e0d4).

## Decisions made without asking
- Locked levels show a gray padlock instead of hiding. Easy to switch back in `select.ts`.

## Rules that changed this session
- Build packages before the typecheck after export changes. A stale `dist` gave 22 false errors.

## State (check again before trusting)
- Dev server: not mine to touch. Re-check with `lsof -i :5173`.
- Leftover scratch server on port 5191, checked 14:15. Stop it.

## Do not
- Do not widen the font: the text then misses the 80-column DOS screen.

## Pointers
- Plan: notes/level-select-plan.md
```

## Tips that held up

- A short note beats a thorough one. The best ones were 4 to 5 KB and told the reader what to do in the first lines.
- Say "unproven" when a cause is unproven.
- If the same question has gone unanswered for two days, move it to a decisions file and stop repeating it.
- If a script is needed later, copy it somewhere permanent with relative paths, or leave it out.
