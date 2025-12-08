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

## Critical: PicoCSS Specificity

PicoCSS v2 uses specific selectors that you MUST match to override defaults:

```css
/* PicoCSS light theme selector */
[data-theme=light],
:root:not([data-theme=dark]),
:host:not([data-theme=dark]) { ... }

/* PicoCSS dark theme (auto) selector */
@media only screen and (prefers-color-scheme: dark) {
  :root:not([data-theme]),
  :host:not([data-theme]) { ... }
}

/* PicoCSS dark theme (forced) selector */
[data-theme=dark] { ... }
```

**Key Rules:**
1. **DO NOT** add `data-theme="light"` to HTML - it triggers PicoCSS defaults that override your theme
2. Use `:root:not([data-theme=dark])` for light theme (matches PicoCSS specificity)
3. Use `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { ... } }` for auto dark
4. Use `[data-theme=dark]` for forced dark mode
5. No `!important` needed if selectors match PicoCSS specificity

## Color Mapping

Map palette colors to PicoCSS variables:

| Palette Color | PicoCSS Variable(s) |
|---------------|---------------------|
| `primary` | `--pico-primary`, `--pico-primary-background`, `--pico-primary-border` |
| `primary` (lighter) | `--pico-primary-hover`, `--pico-primary-hover-background`, `--pico-primary-hover-border` |
| `primary_contrast` | `--pico-primary-inverse` |
| `surface` | `--pico-background-color`, `--pico-card-background-color`, `--pico-form-element-background-color` |
| `text` | `--pico-color`, `--pico-h1-color`, `--pico-h2-color`, `--pico-h3-color` |
| `muted` | `--pico-muted-color`, `--pico-secondary`, `--pico-secondary-background` |
| `border` | `--pico-muted-border-color`, `--pico-form-element-border-color`, `--pico-card-border-color` |

## Complete Theme Template

Generate themes with BOTH light and dark modes:

```unison
web.page.css.raw : Text
web.page.css.raw =
  """
  /* ============================================
     Light Theme (default, follows system pref)
     ============================================ */
  :root:not([data-theme=dark]) {
    color-scheme: light;
    --pico-background-color: {light.surface};
    --pico-color: {light.text};

    /* Primary colors (links and buttons) */
    --pico-primary: {light.primary};
    --pico-primary-background: {light.primary};
    --pico-primary-border: {light.primary};
    --pico-primary-hover: {light.primary_hover};
    --pico-primary-hover-background: {light.primary_hover_dark};
    --pico-primary-hover-border: {light.primary_hover_dark};
    --pico-primary-focus: rgba({light.primary_rgb}, 0.5);
    --pico-primary-inverse: {light.primary_contrast};

    /* Secondary colors */
    --pico-secondary: {light.secondary};
    --pico-secondary-background: {light.secondary};
    --pico-secondary-border: {light.secondary};
    --pico-secondary-hover: {light.secondary_dark};
    --pico-secondary-hover-background: {light.secondary_dark};

    /* Muted/border colors */
    --pico-muted-color: {light.muted_text};
    --pico-muted-border-color: {light.border};

    /* Card colors */
    --pico-card-background-color: {light.surface};
    --pico-card-border-color: {light.border};

    /* Form element colors */
    --pico-form-element-background-color: {light.surface};
    --pico-form-element-border-color: {light.border};
    --pico-form-element-color: {light.text};
    --pico-form-element-focus-color: {light.primary};
    --pico-form-element-active-border-color: {light.primary};

    /* Heading colors */
    --pico-h1-color: {light.text};
    --pico-h2-color: {light.text};
    --pico-h3-color: {light.text};
  }

  /* ============================================
     Dark Theme (auto - follows system preference)
     ============================================ */
  @media only screen and (prefers-color-scheme: dark) {
    :root:not([data-theme]) {
      color-scheme: dark;
      --pico-background-color: {dark.surface};
      --pico-color: {dark.text};

      /* Primary colors (slightly brighter for dark bg) */
      --pico-primary: {dark.primary};
      --pico-primary-background: {dark.primary_bg};
      --pico-primary-border: {dark.primary_bg};
      --pico-primary-hover: {dark.primary_hover};
      --pico-primary-hover-background: {dark.primary_hover_bg};
      --pico-primary-hover-border: {dark.primary_hover_bg};
      --pico-primary-focus: rgba({dark.primary_rgb}, 0.5);
      --pico-primary-inverse: {dark.primary_contrast};

      /* Secondary colors */
      --pico-secondary: {dark.secondary};
      --pico-secondary-background: {dark.secondary_bg};
      --pico-secondary-border: {dark.secondary_bg};
      --pico-secondary-hover: {dark.secondary_hover};
      --pico-secondary-hover-background: {dark.secondary_hover_bg};

      /* Muted/border colors */
      --pico-muted-color: {dark.muted};
      --pico-muted-border-color: {dark.border};

      /* Card colors */
      --pico-card-background-color: {dark.card_bg};
      --pico-card-border-color: {dark.border};

      /* Form element colors */
      --pico-form-element-background-color: {dark.card_bg};
      --pico-form-element-border-color: {dark.border};
      --pico-form-element-color: {dark.text};
      --pico-form-element-focus-color: {dark.primary};
      --pico-form-element-active-border-color: {dark.primary};

      /* Heading colors */
      --pico-h1-color: {dark.heading};
      --pico-h2-color: {dark.heading};
      --pico-h3-color: {dark.heading_muted};
    }
  }

  /* ============================================
     Dark Theme (forced with data-theme="dark")
     ============================================ */
  [data-theme=dark] {
    /* Same as above @media block */
    color-scheme: dark;
    --pico-background-color: {dark.surface};
    /* ... rest of dark theme variables ... */
  }
  """
```

## HTML Element Setup

**DO NOT** add `data-theme` attribute for auto light/dark switching:

```unison
-- CORRECT: No data-theme, follows system preference
html [lang "en"]
  [ head [] [...]
  , body [] [...]
  ]

-- WRONG: This triggers PicoCSS defaults that override your theme!
html [lang "en", Attribute "data-theme" "light"]
  [ ... ]
```

**Only add `data-theme` if you want to FORCE a specific theme:**

```unison
-- Force dark mode regardless of system preference
html [lang "en", Attribute "data-theme" "dark"]
  [ ... ]
```

## Example: Christmas Forest Theme

```unison
web.page.css.raw : Text
web.page.css.raw =
  """
  :root:not([data-theme=dark]) {
    color-scheme: light;
    /* Christmas Forest Light Theme */
    --pico-background-color: #FFFFFF;
    --pico-color: #1b5e20;

    /* Primary (Christmas red) */
    --pico-primary: #c62828;
    --pico-primary-background: #c62828;
    --pico-primary-border: #c62828;
    --pico-primary-hover: #d32f2f;
    --pico-primary-hover-background: #b71c1c;
    --pico-primary-hover-border: #b71c1c;
    --pico-primary-focus: rgba(198, 40, 40, 0.5);
    --pico-primary-inverse: #FFFFFF;

    /* Secondary (forest green) */
    --pico-secondary: #2e7d32;
    --pico-secondary-background: #2e7d32;
    --pico-secondary-border: #2e7d32;
    --pico-secondary-hover: #1b5e20;
    --pico-secondary-hover-background: #1b5e20;

    /* Muted (light green tones) */
    --pico-muted-color: #4caf50;
    --pico-muted-border-color: #a5d6a7;

    /* Cards */
    --pico-card-background-color: #FFFFFF;
    --pico-card-border-color: #a5d6a7;

    /* Forms */
    --pico-form-element-background-color: #FFFFFF;
    --pico-form-element-border-color: #a5d6a7;
    --pico-form-element-color: #1b5e20;
    --pico-form-element-focus-color: #c62828;
    --pico-form-element-active-border-color: #c62828;

    /* Headings (forest green) */
    --pico-h1-color: #1b5e20;
    --pico-h2-color: #1b5e20;
    --pico-h3-color: #2e7d32;
  }

  /* Christmas Forest Dark Theme (Auto) */
  @media only screen and (prefers-color-scheme: dark) {
    :root:not([data-theme]) {
      color-scheme: dark;
      --pico-background-color: #0d2818;
      --pico-color: #e8f5e9;

      /* Primary (brighter red for dark bg) */
      --pico-primary: #ef5350;
      --pico-primary-background: #c62828;
      --pico-primary-border: #c62828;
      --pico-primary-hover: #f44336;
      --pico-primary-hover-background: #d32f2f;
      --pico-primary-hover-border: #d32f2f;
      --pico-primary-focus: rgba(239, 83, 80, 0.5);
      --pico-primary-inverse: #FFFFFF;

      /* Secondary (lighter green for dark bg) */
      --pico-secondary: #4caf50;
      --pico-secondary-background: #2e7d32;
      --pico-secondary-border: #2e7d32;
      --pico-secondary-hover: #66bb6a;
      --pico-secondary-hover-background: #388e3c;

      /* Muted */
      --pico-muted-color: #81c784;
      --pico-muted-border-color: #2e7d32;

      /* Cards */
      --pico-card-background-color: #1b5e20;
      --pico-card-border-color: #2e7d32;

      /* Forms */
      --pico-form-element-background-color: #1b5e20;
      --pico-form-element-border-color: #2e7d32;
      --pico-form-element-color: #e8f5e9;
      --pico-form-element-focus-color: #ef5350;
      --pico-form-element-active-border-color: #ef5350;

      /* Headings */
      --pico-h1-color: #a5d6a7;
      --pico-h2-color: #a5d6a7;
      --pico-h3-color: #81c784;
    }
  }

  /* Christmas Forest Dark Theme (Forced) */
  [data-theme=dark] {
    color-scheme: dark;
    --pico-background-color: #0d2818;
    --pico-color: #e8f5e9;
    /* ... same as @media block above ... */
  }
  """
```

## Workflow

When user asks for a theme:

1. "Apply the teal theme" → Find `teal_stone` palette, generate CSS with correct selectors
2. "Make it dark mode" → Use `dark` colors AND add both auto (@media) and forced ([data-theme=dark]) sections
3. "Show me available themes" → List the palettes from this skill
4. "Create a custom theme" → Add new palette to the JSONL file

## Adding Custom Palettes

To add new palettes:

1. Open `.claude/data/color-palettes.jsonl`
2. Add a new JSON line with the schema above
3. Include both `light` and `dark` variants

Example:
```json
{"name": "Halloween", "id": "halloween", "description": "Spooky orange and purple.", "light": {...}, "dark": {...}}
```

## Troubleshooting

**Theme not applying?**
1. Check browser dev tools - are your CSS variables being overridden (struck through)?
2. Ensure you're using `:root:not([data-theme=dark])` NOT just `:root`
3. Make sure you DON'T have `data-theme="light"` on the `<html>` element
4. Verify your CSS loads AFTER PicoCSS in the `<head>`

**Dark mode not working?**
1. Toggle your system to dark mode to test auto-switching
2. Ensure you have the `@media (prefers-color-scheme: dark)` block
3. The selector inside must be `:root:not([data-theme])` for auto mode
