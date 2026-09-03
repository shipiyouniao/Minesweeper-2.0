# Security policy

## Supported code

Security fixes target the current `main` branch and the game deployed from it. Historical commits, the original desktop edition, and experimental branches are not maintained as separate release lines.

## Report a vulnerability

Use [GitHub's private vulnerability report form](https://github.com/shipiyouniao/Minesweeper-2.0/security/advisories/new). Include the affected commit or deployed URL, browser or Node.js version, reproduction steps, impact, and a minimal proof of concept when possible.

Keep exploitable details out of public issues and pull requests while the report is being assessed. If the private form is unavailable, open a public issue asking for a private reporting channel without including exploit details or sensitive information.

This is a volunteer-maintained project; there is no guaranteed response time or bug bounty. The maintainer will coordinate a fix and disclosure when a report is confirmed.

## Relevant boundaries

The game is a static browser application without accounts or a backend. Progress, preferences, and local records are stored in the browser. Stored text and user-supplied names still need validation and safe rendering. Build dependencies and GitHub Actions are also part of the project's security surface.

Use your own browser profile and local data when testing. Do not access another person's data or disrupt shared services. Ordinary gameplay bugs and feature requests belong in [public issues](https://github.com/shipiyouniao/Minesweeper-2.0/issues).
