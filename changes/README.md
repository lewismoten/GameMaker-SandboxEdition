# Release-note fragments

Branch work adds `unreleased/<target>/<unique-slug>.md` instead of editing a shared changelog.
Targets are `pages`, `engine`, `archives`, and `tools`. A fragment contains one category
heading, a blank line, and one bullet on a single line:

```md
### Fixed

- Describe the change a user or package consumer sees.
```

Categories are Added, Changed, Fixed, Removed, and Security. Keep private game details out.
Internal changes need no fragment. Use a separate fragment for each affected release target.

`release:draft` prints these entries with legacy Unreleased notes, then commit suggestions
for review. `release:check` accepts either source. `release:cut` incorporates both into the
changelog and removes only that target’s fragments after successful writes. Include those
deletions in the release commit. The full list of each released version lives in
`release/<target>/<version>.md`, and the changelog keeps a summary and the most important
changes with a link to it. See [package releases](../docs/package-releases.md).
