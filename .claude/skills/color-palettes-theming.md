# Color Palettes & PicoCSS Theming

This skill describes how to generate PicoCSS themes from the curated color palettes.

## Palette Data Location

Color palettes are stored in `.claude/data/color-palettes.jsonl` (JSON Lines format).

## Palette Schema

Each palette has:
```json
{
  "name": "Cool Modern Blue",
  "id": "cool_blue",
  "description": "A clean modern palette built around bright ocean blue...",
  "light": {
    "primary": "#3A7AFE",
    "primary_contrast": "#FFFFFF",
    "surface": "#FFFFFF",
    "text": "#1A1A1A",
    "muted": "#F2F4F7",
    "border": "#D0D5DD"
  },
  "dark": {
    "primary": "#6CA8FF",
    "primary_contrast": "#0A0A0A",
    "surface": "#0D1117",
    "text": "#E6E6E6",
    "muted": "#1B1F27",
    "border": "#2E3642"
  }
}
```

## Available Palettes

| ID | Name | Description |
|----|------|-------------|
| `cool_blue` | Cool Modern Blue | Clean modern palette with bright ocean blue |
| `salmon_charcoal` | Warm Salmon & Charcoal | Warm salmon accent with deep grayscale |
| `teal_stone` | Teal & Stone | Refreshing teal with stone-gray neutrals |
| `purple_soft_gray` | Purple & Soft Gray | Strong purple accent for creative/SaaS |
| `lime_graphite` | Lime & Deep Graphite | Lively green with deep graphite |
| `sunset_gold_navy` | Sunset Gold & Navy | Golden accent with deep blue shadows |
| `mint_ink` | Mint & Ink | Fresh mint for calm, clinical UIs |
| `rose_slate` | Rose & Slate | Romantic rose with cool slate neutrals |
| `cyber_grape` | Cyber Grape & Ice Gray | Violet-forward for developer tooling |
| `earthy_rust_olive` | Earthy Rust & Olive | Rich organic tones for earthy brands |
| `christmas` | Christmas Forest | Festive forest green with red accents |

## Generating a Theme

When asked to create or apply a theme:

1. **Read the palette file** at `.claude/data/color-palettes.jsonl`
2. **Find the requested palette** by id or name
3. **Generate PicoCSS CSS variables** mapping the 6 palette colors to PicoCSS variables

### Color Mapping

Map palette colors to PicoCSS variables:

| Palette Color | PicoCSS Variable(s) |
|---------------|---------------------|
| `primary` | `--pico-primary`, `--pico-primary-hover` (slightly lighter) |
| `primary_contrast` | `--pico-primary-inverse` |
| `surface` | `--pico-background-color`, `--pico-card-background-color`, `--pico-form-element-background-color` |
| `text` | `--pico-color` |
| `muted` | `--pico-muted-color`, `--pico-secondary` |
| `border` | `--pico-muted-border-color`, `--pico-form-element-border-color`, `--pico-card-border-color` |

### Theme Template

Generate a Unison function like this:

```unison
web.theme.{id} : Text
web.theme.{id} = """
:root {
  --pico-background-color: {surface};
  --pico-color: {text};
  --pico-primary: {primary};
  --pico-primary-hover: {primary_lighter};
  --pico-primary-inverse: {primary_contrast};
  --pico-secondary: {muted};
  --pico-secondary-hover: {muted_lighter};
  --pico-muted-color: {muted};
  --pico-muted-border-color: {border};
  --pico-card-background-color: {surface};
  --pico-card-border-color: {border};
  --pico-form-element-background-color: {surface};
  --pico-form-element-border-color: {border};
  --pico-form-element-focus-color: {primary};
}
"""
```

### Light vs Dark Mode

- Use `light` colors for light mode themes (default)
- Use `dark` colors for dark mode themes
- Can generate both: `web.theme.{id}.light` and `web.theme.{id}.dark`

### Applying a Theme

Add the theme CSS to the page's `<head>`:

```unison
web.page.page.full children =
  use Html style

  html [lang "en"]
    [ head []
        [ -- ... other head elements
        , style [] [unsafeText web.theme.coolBlue]  -- Apply theme
        , page.css
        ]
    , body [] [main [] children]
    ]
```

Or add it to `web.page.css.raw` for global application.

## Workflow

When user asks for a theme:

1. "Apply the teal theme" → Find `teal_stone` palette, generate CSS, add to page
2. "Make it dark mode" → Use `dark` colors from the palette
3. "Show me available themes" → List the palettes from this skill
4. "Create a custom theme" → Can add new palette to the JSONL file

## Example: Generating Cool Blue Theme

```unison
web.theme.coolBlue : Text
web.theme.coolBlue = """
:root {
  --pico-background-color: #FFFFFF;
  --pico-color: #1A1A1A;
  --pico-primary: #3A7AFE;
  --pico-primary-hover: #5A94FF;
  --pico-primary-inverse: #FFFFFF;
  --pico-secondary: #F2F4F7;
  --pico-secondary-hover: #E5E9EE;
  --pico-muted-color: #F2F4F7;
  --pico-muted-border-color: #D0D5DD;
  --pico-card-background-color: #FFFFFF;
  --pico-card-border-color: #D0D5DD;
  --pico-form-element-background-color: #FFFFFF;
  --pico-form-element-border-color: #D0D5DD;
  --pico-form-element-focus-color: #3A7AFE;
}
"""
```

## Adding Custom Palettes

To add new palettes (e.g., Halloween, Valentine's Day):

1. Open `.claude/data/color-palettes.jsonl`
2. Add a new JSON line with the schema above
3. Include both `light` and `dark` variants

Example:
```json
{"name": "Halloween", "id": "halloween", "description": "Spooky orange and purple for Halloween.", "light": {...}, "dark": {...}}
```
