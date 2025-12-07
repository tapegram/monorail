# htmx Reference Guide

When working with htmx in Monorail applications, use these official resources for accurate information.

## Official Documentation

### Core Docs
- **Main Documentation:** https://htmx.org/docs/
  - Installation, AJAX requests, triggers, targets, swapping
  - CSS transitions, history support, requests & responses
  - Validation, animations, extensions

### Reference
- **Attribute Reference:** https://htmx.org/reference/
  - All `hx-*` attributes with descriptions
  - Request headers, response headers
  - Events, JavaScript API, configuration

### Examples
- **Interactive Examples:** https://htmx.org/examples/
  - Click to edit, bulk update, delete row
  - Lazy loading, infinite scroll, active search
  - Progress bars, file upload, dialogs
  - Tabs, keyboard shortcuts, sortable tables

## htmx Extensions

**Extensions Index:** https://htmx.org/extensions/

Common extensions:
- `json-enc` - JSON encoding for request bodies
- `loading-states` - Loading state management
- `preload` - Preload links on hover
- `response-targets` - Different targets for different response codes
- `ws` - WebSocket support
- `sse` - Server-Sent Events support

## Community Resources

**Awesome htmx:** https://github.com/rajasegar/awesome-htmx
- Server-side framework integrations
- Tools and utilities
- Articles and tutorials
- Videos and courses
- Example applications

---

## Quick Reference for Monorail

### Common Attributes (from @tapegram/htmx library)

```unison
-- Triggers
hx_get : Text -> Attribute      -- GET request to URL
hx_post : Text -> Attribute     -- POST request to URL
hx_put : Text -> Attribute      -- PUT request to URL
hx_delete : Text -> Attribute   -- DELETE request to URL
hx_patch : Text -> Attribute    -- PATCH request to URL

-- Targeting
hx_target : Text -> Attribute   -- CSS selector for response target
hx_swap : AdjacentHtml -> Optional Text -> Attribute  -- How to swap content

-- Triggers
hx_trigger : Text -> Attribute  -- Event that triggers request

-- Other
hx_confirm : Text -> Attribute  -- Confirmation dialog
hx_indicator : Text -> Attribute -- Loading indicator selector
hx_push_url : Text -> Attribute  -- Push URL to history
hx_select : Text -> Attribute    -- Select content from response
hx_vals : Text -> Attribute      -- Add values to request
```

### Swap Options (AdjacentHtml type)

```unison
AdjacentHtml.InnerHtml    -- Replace inner content (default)
AdjacentHtml.OuterHtml    -- Replace entire element
AdjacentHtml.BeforeBegin  -- Insert before element
AdjacentHtml.AfterBegin   -- Insert at start of element
AdjacentHtml.BeforeEnd    -- Insert at end of element (append)
AdjacentHtml.AfterEnd     -- Insert after element
AdjacentHtml.Delete       -- Delete element
AdjacentHtml.None         -- No swap
```

### Common Patterns

**Delete with confirmation:**
```unison
button
  [ hx_delete deleteUrl
  , hx_target "closest li"
  , hx_swap AdjacentHtml.OuterHtml Optional.None
  , hx_confirm "Are you sure?"
  ]
  [text "Delete"]
```

**Append to list:**
```unison
form
  [ hx_post createUrl
  , hx_target "#item-list"
  , hx_swap AdjacentHtml.BeforeEnd Optional.None
  ]
  [...]
```

**Toggle/update in place:**
```unison
input
  [ type_ "checkbox"
  , hx_post toggleUrl
  , hx_target "closest li"
  , hx_swap AdjacentHtml.OuterHtml Optional.None
  ]
```

**Lazy load content:**
```unison
div
  [ hx_get contentUrl
  , hx_trigger "load"
  , hx_swap AdjacentHtml.InnerHtml Optional.None
  ]
  [text "Loading..."]
```

---

## When to Fetch Docs

Use `WebFetch` to get current htmx documentation when:
1. User asks about an htmx feature not covered here
2. Need details on a specific attribute or event
3. Looking for an example pattern
4. Debugging htmx behavior

Example:
```
WebFetch https://htmx.org/attributes/hx-trigger/ "Explain the hx-trigger attribute syntax"
```
