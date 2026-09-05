# Camp navigation and shop

The expedition landing screen shows the selected profession, departure equipment, route, supplies and a **Depart** button. Four entries open separate screens for professions, loadouts, routes and the shop. Each screen has a **Back to camp** action and navigation to the other sections. Changing screens preserves the current departure choices.

## Browsing and purchasing

The shop uses square artwork tiles with names, prices and an owned badge. Selecting a tile opens its description; only the **Purchase** button spends supplies. Owned and unaffordable items remain inspectable. The detail panel explains a missing Workshop requirement for equipment licenses and shows the exact shortfall when supplies are insufficient.

| Category        | Contents                                             |
| --------------- | ---------------------------------------------------- |
| All             | All 26 purchases, sorted by ascending price          |
| Professions     | Five additional professions                          |
| Equipment       | Six combat equipment licenses                        |
| Relics          | Ten relic packs, the Relic archive and Battle manual |
| Camp facilities | Workshop and the two one-time trainings              |

Every category uses the same ascending-price order; equal-price items retain their catalog order. Sorting only affects presentation. Prices, purchase validation and the three-point equipment budget retain their existing rules.

Desktop screens show details beside the item grid. Narrow screens insert details below the selected item's row, using ordinary page scrolling. The selected tile remains focused across updates; after a purchase disables its button, focus returns to that tile. The next Tab after selecting an available item reaches its purchase button. All navigation uses native buttons and supports mouse, touch and keyboard input.

## Implementation boundaries

`CampScreen` and its finite command unions live in `src/types/camp-navigation.d.ts`. `VariantApp` owns transient navigation state; `navigateCamp` derives the next screen and reconciles selection with category changes. `camp-template.ts` and `camp-copy.ts` render one screen with complete English, Chinese and Japanese copy. Domain purchases remain in `ExpeditionSession`, and game rules and stored expedition journals do not change.

Browser acceptance in `tests/browser/camp.mjs` covers category ordering, inspection without spending, keyboard purchases, persistence, loadout and route retention, starting a matching expedition, narrow layouts and touch navigation. Set `CAPTURE_SCREENSHOTS=1` to refresh the checked-in UI images deliberately.
