# How I built this

Game-Maker: Sandbox Edition is a fork of RSD Game-Maker 3.0, a DOS game-making kit from the early 1990s. It
keeps every original file format working, and adds a web port of the engine, an in-browser editor, a
1994-style desk PC, and a set of new games built in code.

## The experiment

I keep my hands off the code on purpose. It is an experiment to see how far development can go when all of
the work is done by models, and my part is the conversation with them.

I have two more aims. Critics of agentic programming tend to treat anything made by agents as low quality, so
I try to hold the agents to a higher standard wherever I can find room. And I want the repository to stay
maintainable by a person, and not be an embarrassment.

## Where my rules come from

Many of my suggestions come from agile practices and my past experience with extreme programming. Other parts
come from research into agentic programming and from watching what the industry is doing. The largest share
comes from experience: seeing how things break, and correcting course.

That last part shows in `AGENTS.md`. Most of it is corrections, each added once, after something went wrong.

## How the work is organized

- **At first, one branch.** For the first few weeks, the parallel work happened on the `develop` branch, on
  one machine.
- **Then feature branches.** Once remote workers came in, I switched to feature branches. Every task gets its
  own `feature/` branch from `develop`, and nobody commits on `develop` or `master` directly.
- **Commit small, commit often.** This comes from red-green-refactor experiments, which often end up as
  sludge. Small commits make a wrong turn cheap to undo.
- **Short, narrow briefs.** An agent gets a goal, the files it may touch, and what has already been ruled out.
- **One rules file.** A correction becomes a rule that the next agent starts with.

## Evidence before building

The original C source in `code/` is the reference for how the engine behaves. An agent reads it before
changing the engine. File formats are checked by reading real files and writing them back, then counting what
comes back identical.

## Checks that play the games

Every new game is built in code and has a bot that plays it headless on the real engine. A bot winning is the
minimum, not proof that a game is fun. Check results are suggestions an author can dismiss, and every report
keeps "checked" apart from "still needs a person to try it".

## Handoffs

Sessions end, so each one leaves a note for the next: what is done, what was checked, what was not, and what
to do first.

## What went wrong, and what it taught

- Agents reloaded a page I had open. Now nothing touches my dev server, and merges happen in a separate
  worktree.
- Reports sounded sure about results nobody had looked at. Now the rule is: look, listen, play, then report.
- A check for the light theme was really running in dark, because the theme is a site setting. Now a check
  sets it, then confirms it.
- Some generated art could be read in ways nobody intended. Now every picture gets a look as a stranger would
  see it.
- Background facts I gave the agents ended up in game text. Now background is for the author, not the player.
