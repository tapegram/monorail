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
| `primary` | `--pico-primary` (links), `--pico-primary-background` (buttons), `--pico-primary-border` |
| `primary_hover` | `--pico-primary-hover`, `--pico-primary-hover-background`, `--pico-primary-hover-border` |
| `primary_contrast` | `--pico-primary-inverse` |
| `surface` | `--pico-background-color`, `--pico-card-background-color`, `--pico-form-element-background-color`, `--pico-dropdown-background-color` |
| `text` | `--pico-color`, `--pico-h1-color`, `--pico-h2-color`, `--pico-h3-color` |
| `muted` | `--pico-muted-color`, `--pico-secondary`, `--pico-secondary-background` |
| `border` | `--pico-muted-border-color`, `--pico-form-element-border-color`, `--pico-card-border-color` |

**IMPORTANT:** PicoCSS uses `@media (prefers-color-scheme: dark)` to auto-switch themes. To force a theme regardless of system preference, use `[data-theme=light]` or `[data-theme=dark]` selectors AND add `data-theme="light"` to the `<html>` element.

### Theme Template

Generate a Unison function like this:

```unison
web.theme.{id} : Text
web.theme.{id} = """
/* Force light mode regardless of system preference */
:root,
[data-theme=light] {
  color-scheme: light;
  --pico-background-color: {surface};
  --pico-color: {text};

  /* Primary colors (links and buttons) */
  --pico-primary: {primary};
  --pico-primary-background: {primary};
  --pico-primary-border: {primary};
  --pico-primary-hover: {primary_hover};
  --pico-primary-hover-background: {primary_hover};
  --pico-primary-hover-border: {primary_hover};
  --pico-primary-focus: rgba({primary_rgb}, 0.5);
  --pico-primary-inverse: {primary_contrast};

  /* Secondary colors */
  --pico-secondary: {muted_dark};
  --pico-secondary-background: {muted_dark};
  --pico-secondary-border: {muted_dark};
  --pico-secondary-hover: {muted_darker};
  --pico-secondary-hover-background: {muted_darker};

  /* Muted/border colors */
  --pico-muted-color: {muted_text};
  --pico-muted-border-color: {border};

  /* Card colors */
  --pico-card-background-color: {surface};
  --pico-card-border-color: {border};

  /* Form element colors */
  --pico-form-element-background-color: {surface};
  --pico-form-element-border-color: {border};
  --pico-form-element-color: {text};
  --pico-form-element-focus-color: {primary};
  --pico-form-element-active-border-color: {primary};

  /* Heading colors */
  --pico-h1-color: {text};
  --pico-h2-color: {text};
  --pico-h3-color: {text};
  --pico-h4-color: {text_muted};
  --pico-h5-color: {text_muted};
  --pico-h6-color: {muted_text};
}
"""
```

### Light vs Dark Mode

PicoCSS automatically switches between light/dark based on `prefers-color-scheme`. To control this:

1. **Force light mode:** Add `data-theme="light"` to `<html>` element
2. **Force dark mode:** Add `data-theme="dark"` to `<html>` element
3. **Auto (system preference):** Don't add `data-theme` attribute

When generating themes, ALWAYS add the `data-theme` attribute to the HTML element:

```unison
html [lang "en", Attribute "data-theme" "light"]
  [ ... ]
```

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
:root,
[data-theme=light] {
  color-scheme: light;
  --pico-background-color: #FFFFFF;
  --pico-color: #1A1A1A;

  /* Primary (ocean blue) */
  --pico-primary: #3A7AFE;
  --pico-primary-background: #3A7AFE;
  --pico-primary-border: #3A7AFE;
  --pico-primary-hover: #5A94FF;
  --pico-primary-hover-background: #5A94FF;
  --pico-primary-hover-border: #5A94FF;
  --pico-primary-focus: rgba(58, 122, 254, 0.5);
  --pico-primary-inverse: #FFFFFF;

  /* Secondary */
  --pico-secondary: #6B7280;
  --pico-secondary-background: #6B7280;
  --pico-secondary-border: #6B7280;
  --pico-secondary-hover: #4B5563;
  --pico-secondary-hover-background: #4B5563;

  /* Muted */
  --pico-muted-color: #6B7280;
  --pico-muted-border-color: #D0D5DD;

  /* Cards */
  --pico-card-background-color: #FFFFFF;
  --pico-card-border-color: #D0D5DD;

  /* Forms */
  --pico-form-element-background-color: #FFFFFF;
  --pico-form-element-border-color: #D0D5DD;
  --pico-form-element-color: #1A1A1A;
  --pico-form-element-focus-color: #3A7AFE;
  --pico-form-element-active-border-color: #3A7AFE;

  /* Headings */
  --pico-h1-color: #1A1A1A;
  --pico-h2-color: #1A1A1A;
  --pico-h3-color: #1A1A1A;
}
"""
```

**Don't forget:** Add `data-theme="light"` to your `<html>` element:
```unison
html [lang "en", Attribute "data-theme" "light"]
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
