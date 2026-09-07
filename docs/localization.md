# Localization

All player-facing translations live in `src/locales`. `en.ts`, `zh.ts` and `ja.ts` implement the explicit `MessageCatalog` contract. The existing common board dictionary is in the corresponding `*-base.ts` files and retains its `Messages` contract. Autonyms are in `native-names.ts`.

UI code calls `message(language, 'namespace.key', { count: value })`. Keys are checked by TypeScript; the function replaces named fields once, including zero, and throws for a missing field. It returns text and does not interpret HTML. As before, callers must escape untrusted text when inserting it into HTML. Locale resources are trusted application copy. Language selection, URL precedence, saved preference and browser fallback remain centralized in `src/i18n.ts`. There is no mutable global language: simultaneous renders cannot change each other's locale.

To change or add a message:

1. Add an explicit key to `src/types/message-catalog.d.ts` and provide it in all three locale files. Keep existing keys stable when rewording text.
2. Keep the same named fields in every language; translations may reorder or repeat them. Existing numbered fields (`p0`, `p1`) identify migrated arguments; use descriptive names for new messages.
3. Call `message` with that key and its exact parameter object. Do not embed language-specific sentences or ternary translation branches in UI modules.
4. Run `npm run check:i18n` and `npm run check`, then check the affected screen in each language and on a narrow viewport.

`check:i18n` checks key parity, nonempty messages, placeholder parity, actual UI call arguments and inline multilingual strings. It is part of CI's ordinary `npm run check`. Unit tests cover every catalog entry, language independence and single-pass interpolation. These checks detect missing translations and inconsistent parameters; they cannot judge translation quality or whether a description matches changed gameplay rules. Review those alongside each gameplay change.

This implementation uses plain TypeScript resources and does not add an external runtime dependency. If future languages require grammatical plural categories, add explicit `Intl.PluralRules` handling and catalog variants rather than English-only string concatenation.
