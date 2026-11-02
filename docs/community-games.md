# Add a Community game

Community lists games that run on their creators' websites. To add one, open the
Community tab and choose **Add your game**, or edit
[`web/src/community/games.json`](../web/src/community/games.json) in a fork.

1. Add an object to the JSON list, with a comma between entries:

   ```json
   {
     "id": "my-game",
     "title": "My Game",
     "author": "Your name",
     "url": "https://example.com/my-game/",
     "summary": "A short description of the game."
   }
   ```

2. Optionally add `sourceUrl` for source and credits, `imageUrl` for a preview, and
   `archiveUrl` for a permanent game-file ZIP. All links use HTTPS. Preview images
   should support anonymous cross-origin loading. Keep the game on its own website;
   this repository needs only its metadata.
3. From `web/`, run `npx vitest run test/communityCatalog.test.ts`, format the change,
   and open a pull request. The Community form can generate the entry and link to the
   fork, editor and pull-request pages; it does not publish a submission itself.

IDs are unique lowercase words joined with hyphens, up to 48 characters. Titles are
up to 96 characters, author names 80, and summaries 400. Use plain text. A preview
image is optional; a title card appears when one is unavailable. Viewing the listing
does not download a game's ZIP. Players can open the creator's website or download
the optional archive; **Edit a copy** opens that archive through the site's existing
game-import flow.
