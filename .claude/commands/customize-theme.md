# /customize-theme

Customize the PicoCSS theme for a Monorail web application.

**Reference:** @.claude/skills/pico-theme-customization.md

## Usage

The user may specify:
- A preset theme name: `purple`, `orange`, `green`, `gray`
- Custom colors: `--primary "#7c3aed"`
- Custom font: `--font "Inter"`

## Step 1: Determine Theme Configuration

Ask the user what they want:

1. **Preset theme?** (purple, orange, green, gray, or custom)
2. **Custom primary color?** (hex code like #7c3aed)
3. **Custom font?** (Google Font name like "Inter")
4. **Dark mode customization?** (same as light, different colors, or skip)

## Step 2: Generate the CSS

Based on user input, generate the `web.page.css.raw` function.

### Preset: Purple

```unison
web.page.css.raw : Text
web.page.css.raw = """
:not(:defined) { visibility: hidden; }
[data-loading] { display: none; }
.htmx-indicator { opacity: 0; transition: opacity 500ms ease-in; }
.htmx-request .htmx-indicator { opacity: 1; }
.htmx-request.htmx-indicator { opacity: 1; }

:root {
  --pico-primary: #7c3aed;
  --pico-primary-hover: #5b21b6;
  --pico-primary-focus: rgba(124, 58, 237, 0.25);
  --pico-primary-background: #7c3aed;
}
"""
```

### Preset: Orange

```unison
web.page.css.raw : Text
web.page.css.raw = """
:not(:defined) { visibility: hidden; }
[data-loading] { display: none; }
.htmx-indicator { opacity: 0; transition: opacity 500ms ease-in; }
.htmx-request .htmx-indicator { opacity: 1; }
.htmx-request.htmx-indicator { opacity: 1; }

:root {
  --pico-primary: #e07020;
  --pico-primary-hover: #c05010;
  --pico-primary-focus: rgba(224, 112, 32, 0.25);
  --pico-primary-background: #e07020;
}
"""
```

### Preset: Green

```unison
web.page.css.raw : Text
web.page.css.raw = """
:not(:defined) { visibility: hidden; }
[data-loading] { display: none; }
.htmx-indicator { opacity: 0; transition: opacity 500ms ease-in; }
.htmx-request .htmx-indicator { opacity: 1; }
.htmx-request.htmx-indicator { opacity: 1; }

:root {
  --pico-primary: #059669;
  --pico-primary-hover: #047857;
  --pico-primary-focus: rgba(5, 150, 105, 0.25);
  --pico-primary-background: #059669;
}
"""
```

### Preset: Gray

```unison
web.page.css.raw : Text
web.page.css.raw = """
:not(:defined) { visibility: hidden; }
[data-loading] { display: none; }
.htmx-indicator { opacity: 0; transition: opacity 500ms ease-in; }
.htmx-request .htmx-indicator { opacity: 1; }
.htmx-request.htmx-indicator { opacity: 1; }

:root {
  --pico-primary: #374151;
  --pico-primary-hover: #1f2937;
  --pico-primary-focus: rgba(55, 65, 81, 0.25);
  --pico-primary-background: #374151;
}
"""
```

### Custom Primary Color

When user provides a hex color, calculate:
- `--pico-primary`: the provided color
- `--pico-primary-hover`: darken by ~15%
- `--pico-primary-focus`: same color with 0.25 alpha
- `--pico-primary-background`: same as primary

### Custom Font

If user wants a custom font:

1. Add the Google Font link to the page template:
```unison
link [rel "stylesheet", href "https://fonts.googleapis.com/css2?family=<FontName>:wght@400;500;600;700&display=swap"]
```

2. Add to the CSS:
```css
:root {
  --pico-font-family: '<FontName>', system-ui, sans-serif;
}
```

### Dark Mode Support

If user wants different dark mode colors:

```unison
web.page.css.raw : Text
web.page.css.raw = """
:not(:defined) { visibility: hidden; }
[data-loading] { display: none; }
.htmx-indicator { opacity: 0; transition: opacity 500ms ease-in; }
.htmx-request .htmx-indicator { opacity: 1; }
.htmx-request.htmx-indicator { opacity: 1; }

:root {
  --pico-primary: <light-color>;
  --pico-primary-hover: <light-hover>;
  --pico-primary-focus: <light-focus>;
  --pico-primary-background: <light-color>;
}

@media (prefers-color-scheme: dark) {
  :root {
    --pico-primary: <dark-color>;
    --pico-primary-hover: <dark-hover>;
    --pico-primary-focus: <dark-focus>;
    --pico-primary-background: <dark-color>;
  }
}
"""
```

## Step 3: Apply the Theme

1. **Find the app's css.raw function** in the scratch file (usually `app.u`)
2. **Replace the existing `web.page.css.raw` function** with the generated one
3. **If custom font**, also add the font link to `web.page.page.full`
4. **Typecheck** to ensure validity

## Step 4: Summary

Tell the user:
- What theme was applied
- Which CSS variables were customized
- If a custom font was added, remind them the Google Font link was added
- Suggest they deploy to see the changes: `run deploy.deployDev`

## Additional Customizations

If the user wants more advanced customizations, refer them to the full list of 130+ CSS variables:
- https://picocss.com/docs/css-variables

Common additional variables to suggest:
- `--pico-border-radius` (default: 0.25rem) - for more/less rounded corners
- `--pico-spacing` (default: 1rem) - for tighter/looser layouts
- `--pico-font-size` (default: 100%) - for larger/smaller base text
