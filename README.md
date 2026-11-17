# action-cards

One renderer, many cards. Claude sends JSON, the card draws itself in your brand.

## Use in a chat widget

```html
<div id="c"></div>
<script src="https://cdn.jsdelivr.net/gh/USER/action-cards@v1.0.0/card.js"></script>
<script>
ActionCard.render("#c", SPEC, {
  brandBase: "https://cdn.jsdelivr.net/gh/USER/action-cards@v1.0.0/brands/"
});
</script>
```

`SPEC` is the only thing that changes per run. Everything else is fixed.

## Spec

| Field | What it does |
|---|---|
| `brand` | Brand slug (fetched from `brandBase`) or an inline brand object |
| `title` / `subtitle` | Card heading. Subtitle allows inline HTML |
| `meta` | Optional editable field top-right. `{type, value}`. Reachable as `{{META}}` |
| `body` | Optional HTML block instead of a table (use for simple prompt cards) |
| `lists` | Named option lists. Reference from a column as `"$name"` |
| `columns` | Column definitions, left to right |
| `rows` | Array of objects keyed by column `key` |
| `totals` | Summary row: `sum`, `count`, `countBy` |
| `addRows` | Show an add-row button |
| `removeRows` | Set `false` to hide per-row delete |
| `actions` | Buttons. `prompt` supports `{{ROWS}}` and `{{META}}` |

### Column

| Field | What it does |
|---|---|
| `key` | Matches the key in each row |
| `label` / `width` | Header text, px width (omit for flexible) |
| `type` | `text` (default), `time`, `number`, `select`, `static` |
| `required` | Empty value blocks any action with `requiresValid` |
| `options` | Array, or `"$listName"` |
| `invalidLabel` | What the blocking message calls this column |
| `derive` | Recomputes from another column until the user types over it |

### Derive ops

- `hoursAfter` — hours past `ref` time, floored at 0
- `hoursBetween` — hours between `from` and the column named in `and`
- `beforeAfter` — returns `before` or `after` depending on `ref`

A derived cell stops recomputing once edited by hand. Claude also sends computed
values in `rows`, so derive only matters for live edits.

### Totals

- `{type:"sum", key, label}`
- `{type:"count", label}`
- `{type:"countBy", key, match, label, warnIfAny}` — `match` accepts a literal
  value, `"@empty"` or `"@notEmpty"`

## Brands

`brands/<slug>.json`:

```json
{ "name": "...", "color": "#BA7517", "onColor": "#ffffff",
  "tint": "#FAEEDA", "ink": "#412402", "initials": "PC",
  "logo": "<svg ...>",
  "lists": { "statuses": ["Aberto", "Pago"] } }
```

`logo` takes inline SVG or an https URL. With no logo, `initials` on `tint`.
`lists` here are defaults; a spec's own `lists` override by name.

Adding a customer is one new file. No change to `card.js`.

## Publishing

```bash
git init && git add . && git commit -m "action cards v1"
gh repo create action-cards --public --source=. --push
git tag v1.0.0 && git push --tags
```

Served at `https://cdn.jsdelivr.net/gh/USER/action-cards@v1.0.0/card.js`

jsDelivr caches a tag permanently. Ship changes as a new tag (`v1.0.1`) and
update the URL. Never use `@latest` — cards would shift under you without warning.
