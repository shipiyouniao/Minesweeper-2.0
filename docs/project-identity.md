# Minefarer identity and URL migration

The approved name is **Minefarer**, spelled identically in English, Chinese and Japanese. The repository slug and new Pages base are `minefarer`. The project remains a TypeScript 7 native compiler experiment as it expands into a story-driven Minesweeper adventure.

## Migration

- New game URL: `https://shipiyouniao.github.io/minefarer/`.
- Legacy game URL: `https://shipiyouniao.github.io/Minesweeper-2.0/`.
- Preserve the original repository history, issues, PRs and contribution records through GitHub's repository rename.
- Keep the old repository name unused so GitHub's old repository/issue/PR redirects remain in place.
- Serve a static redirect at `Minesweeper-2.0/index.html` from the account-level Pages repository `shipiyouniao.github.io`. This bridge preserves search parameters and fragments with replacement navigation and supplies a visible fallback link.
- A browser-side static redirect is not an HTTP 301 configuration. [GitHub's rename rules](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository) do not automatically redirect project Pages URLs.
- Preserve all `minesweeper.*` storage namespaces. Both addresses remain on the same HTTPS origin, so changing the path must not reset preferences, puzzle saves, camp purchases or active attempts.
- Update package metadata, visible branding, browser titles, maintained repository links, Vite base paths, build verification and browser-test defaults together.

## Cutover checks

Prepare and test the new game and redirect before changing the remote identity. Verify deployment under the new base, the old base and old `index.html` entry points, mode/language query parameters, fragments, browser history, stored data and old GitHub issue/PR URLs. Record the actual production results in the PR and Roadmap II; prepared files alone do not establish successful migration.

The initial name search found no obvious same-name game or public repository. This is a naming search, not a trademark clearance or a reservation of third-party domains.
