# PicoCSS Theme Customization

Monorail uses PicoCSS v2 (classless version) for styling. This guide explains how to customize the theme.

## How PicoCSS Theming Works

PicoCSS uses CSS custom properties (variables) prefixed with `--pico-`. You can override these in your app's CSS to customize the look and feel.

## Adding Custom Theme CSS

Theme customizations go in the `web.page.css.raw` function in your app. The CSS is injected into the `<head>` via a `<style>` tag.

### Basic Structure

Use triple quotes for multi-line CSS:

```unison
web.page.css.raw : Text
web.page.css.raw = """
:not(:defined) { visibility: hidden; }
[data-loading] { display: none; }
.htmx-indicator { opacity: 0; transition: opacity 500ms ease-in; }
.htmx-request .htmx-indicator { opacity: 1; }
.htmx-request.htmx-indicator { opacity: 1; }

/* Custom theme overrides */
:root {
  --pico-primary: #7c3aed;
  --pico-primary-hover: #5b21b6;
  --pico-primary-focus: rgba(124, 58, 237, 0.25);
  --pico-primary-background: #7c3aed;
}
"""
```

## Common Theme Variables

### Primary Colors

The most impactful customizations:

| Variable | Purpose | Default (Light) |
|----------|---------|-----------------|
| `--pico-primary` | Primary brand color (links, buttons) | `#1095c1` |
| `--pico-primary-hover` | Primary color on hover | `#08769b` |
| `--pico-primary-focus` | Focus ring color | `rgba(16, 149, 193, 0.25)` |
| `--pico-primary-background` | Primary button background | `#1095c1` |

### Background & Text

| Variable | Purpose |
|----------|---------|
| `--pico-background-color` | Page background |
| `--pico-color` | Default text color |
| `--pico-muted-color` | Secondary/muted text |
| `--pico-muted-border-color` | Border colors |

### Typography

| Variable | Purpose | Default |
|----------|---------|---------|
| `--pico-font-family` | Main font stack | system fonts |
| `--pico-font-size` | Base font size | `100%` |
| `--pico-line-height` | Line height | `1.5` |
| `--pico-font-weight` | Base font weight | `400` |

### Spacing

| Variable | Purpose | Default |
|----------|---------|---------|
| `--pico-spacing` | Base spacing unit | `1rem` |
| `--pico-block-spacing-vertical` | Vertical margins | `var(--pico-spacing)` |
| `--pico-block-spacing-horizontal` | Horizontal margins | `var(--pico-spacing)` |

### Borders & Radius

| Variable | Purpose | Default |
|----------|---------|---------|
| `--pico-border-radius` | Corner radius | `0.25rem` |
| `--pico-border-width` | Border thickness | `1px` |
| `--pico-outline-width` | Focus outline width | `3px` |

### Form Elements

| Variable | Purpose |
|----------|---------|
| `--pico-form-element-background-color` | Input backgrounds |
| `--pico-form-element-border-color` | Input borders |
| `--pico-form-element-focus-color` | Focus state color |
| `--pico-form-element-spacing-vertical` | Input padding (vertical) |
| `--pico-form-element-spacing-horizontal` | Input padding (horizontal) |

### Cards & Containers

| Variable | Purpose |
|----------|---------|
| `--pico-card-background-color` | Card/article background |
| `--pico-card-border-color` | Card borders |
| `--pico-card-box-shadow` | Card shadow |
| `--pico-card-sectioning-background-color` | Header/footer in cards |

## Dark Mode Support

PicoCSS automatically supports dark mode via `prefers-color-scheme`. To customize dark mode separately:

```unison
web.page.css.raw : Text
web.page.css.raw = """
:root {
  --pico-primary: #1095c1;
}

@media (prefers-color-scheme: dark) {
  :root {
    --pico-primary: #4ecdc4;
  }
}
"""
```

Or use data attributes for manual control:

```unison
web.page.css.raw : Text
web.page.css.raw = """
[data-theme="light"] {
  --pico-primary: #1095c1;
}

[data-theme="dark"] {
  --pico-primary: #4ecdc4;
}
"""
```

## Example Theme Presets

### Warm/Orange Theme

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

### Cool/Purple Theme

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

### Nature/Green Theme

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

### Minimal/Gray Theme

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

## Custom Fonts

To use custom fonts from Google Fonts:

1. Add the font link in your page template
2. Override the font family variable

```unison
-- In page.full, add to <head>:
link [rel "stylesheet", href "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"]

-- In css.raw:
web.page.css.raw : Text
web.page.css.raw = """
:not(:defined) { visibility: hidden; }
[data-loading] { display: none; }
.htmx-indicator { opacity: 0; transition: opacity 500ms ease-in; }
.htmx-request .htmx-indicator { opacity: 1; }
.htmx-request.htmx-indicator { opacity: 1; }

:root {
  --pico-font-family: 'Inter', system-ui, sans-serif;
}
"""
```

## Complete Reference

For all 130+ CSS variables, see:
- https://picocss.com/docs/css-variables

## Using the Theme Command

Use the `/customize-theme` command to generate custom theme CSS:

```
/customize-theme purple
/customize-theme --primary "#e07020" --font "Inter"
```

This generates the CSS code to replace your `web.page.css.raw` function.
