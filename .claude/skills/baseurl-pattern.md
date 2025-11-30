# baseUrl() Pattern for Internal URLs

## Critical Rule

**ALL internal URLs in your Unison web application MUST use `baseUrl()` as a prefix.**

## Why baseUrl() is Required

Unison Cloud deploys all applications on the same domain with unique path prefixes:

- Production: `/s/MyApp/...`
- Staging: `/s/stage-MyApp/...`
- Dev: `/s/dev-MyApp/...`
- By hash: `/h/<hash>/...`

Without `baseUrl()`, your links will 404 because they'll point to the root domain instead of the app's path.

## The baseUrl() Function

```unison
web.baseUrl : '{Route} Path
web.baseUrl = do basePath (Headers request.headers())
```

This helper extracts the correct base path from the request headers.

## Usage Patterns

### In HTML Links

❌ **WRONG:**
```unison
a [href "/tasks"] [text "View Tasks"]
```

✅ **CORRECT:**
```unison
app.pages.tasks.index : [Task] -> '{Route} Html
app.pages.tasks.index tasks = do
  use Path /
  use Text ++

  tasksUrl = baseUrl() / "tasks" |> Path.toText

  a [href tasksUrl] [text "View Tasks"]
```

### In htmx Attributes

❌ **WRONG:**
```unison
button
  [ hx_post "/tasks"
  , hx_target "#task-list"
  ]
  [text "Create"]
```

✅ **CORRECT:**
```unison
app.pages.tasks.newTaskButton : '{Route} Html
app.pages.tasks.newTaskButton = do
  use Path /

  createUrl = baseUrl() / "tasks" |> Path.toText

  button
    [ hx_post createUrl
    , hx_target "#task-list"
    ]
    [text "Create"]
```

### In Forms

❌ **WRONG:**
```unison
form [action "/tasks", method "POST"] [...]
```

✅ **CORRECT:**
```unison
app.pages.tasks.createForm : '{Route} Html
app.pages.tasks.createForm = do
  use Path /

  createUrl = baseUrl() / "tasks" |> Path.toText

  form [action createUrl, method "POST"] [...]
```

### With Dynamic IDs

✅ **CORRECT:**
```unison
app.pages.tasks.deleteButton : Text -> '{Route} Html
app.pages.tasks.deleteButton taskId = do
  use Path /
  use Text ++

  deleteUrl = baseUrl() / "tasks" / taskId |> Path.toText

  button
    [ hx_delete deleteUrl
    , hx_target ("#task-" ++ taskId)
    , hx_swap OuterHtml None
    ]
    [text "Delete"]
```

### With Multiple Path Segments

✅ **CORRECT:**
```unison
app.pages.tasks.toggleButton : Text -> '{Route} Html
app.pages.tasks.toggleButton taskId = do
  use Path /

  toggleUrl = baseUrl() / "tasks" / taskId / "toggle" |> Path.toText

  input
    [ type_ "checkbox"
    , hx_post toggleUrl
    ]
    []
```

## Pattern Template

For ANY page that generates HTML with links:

```unison
app.pages.<entity>.<pageName> : <Args> -> '{Route} Html
app.pages.<entity>.<pageName> args = do
  use Path /
  use Text ++  -- if concatenating strings

  -- Build URLs using baseUrl()
  indexUrl = baseUrl() / "<entity>" |> Path.toText
  detailUrl = baseUrl() / "<entity>" / someId |> Path.toText

  -- Use the URLs in HTML
  div []
    [ a [href indexUrl] [text "List"]
    , a [href detailUrl] [text "Detail"]
    ]
```

## Type Signature Pattern

Pages that use `baseUrl()` need the `Route` ability:

```unison
-- Correct type signature
app.pages.tasks.index : [Task] -> '{Route} Html

-- The function body uses 'do' to access Route ability
app.pages.tasks.index tasks = do
  use Path /
  tasksUrl = baseUrl() / "tasks" |> Path.toText
  -- ...
```

## Common Mistakes

### Mistake 1: Forgetting baseUrl() entirely

```unison
-- WRONG: Will 404 in deployed apps
button [hx_post "/tasks"] [text "Create"]

-- RIGHT: Works in all deployment environments
do
  createUrl = baseUrl() / "tasks" |> Path.toText
  button [hx_post createUrl] [text "Create"]
```

### Mistake 2: Not using `do` syntax

```unison
-- WRONG: Can't call baseUrl() without 'do'
app.pages.tasks.index tasks =
  url = baseUrl() / "tasks" |> Path.toText  -- ERROR!

-- RIGHT: Use 'do' to access Route ability
app.pages.tasks.index tasks = do
  url = baseUrl() / "tasks" |> Path.toText  -- Works!
```

### Mistake 3: Mixing string concatenation

```unison
-- WRONG: Don't concatenate paths as strings
url = baseUrl() ++ "/tasks/" ++ taskId

-- RIGHT: Use Path operators
use Path /
url = baseUrl() / "tasks" / taskId |> Path.toText
```

## Checklist for Every Page

Before showing any page code to the user:

- [ ] Does it use the `Route` ability? (`'{Route} Html`)
- [ ] Does it use `do` syntax?
- [ ] Does it call `baseUrl()` for ALL internal URLs?
- [ ] Does it use `Path /` operator for path construction?
- [ ] Does it call `Path.toText` to convert to string?
- [ ] Are ALL links, forms, and htmx attributes using the constructed URLs?

## External URLs

You do NOT use `baseUrl()` for external URLs:

```unison
-- External URLs - no baseUrl()
link [href "https://picocss.com"] [text "PicoCSS"]
script [src "https://unpkg.com/htmx.org@1.9.12"] []
```

## Summary

**The Rule:** Every internal URL must be prefixed with `baseUrl()`.

**The Pattern:**
1. Add `'{Route}` to your page's type signature
2. Use `do` syntax in the function body
3. Build URLs: `baseUrl() / "path" / "segments" |> Path.toText`
4. Use the URL variables in your HTML

**The Result:** Your app works in all deployment environments (dev, stage, prod, by-hash).
