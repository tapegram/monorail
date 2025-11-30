# HTML Patterns in Unison

## Semantic HTML with PicoCSS

Monorail uses semantic HTML styled by PicoCSS classless version. This means NO CSS classes.

## Element Reference

### Structural Elements

```unison
-- Page wrapper
main [] [content]

-- Content sections
article [] [...]  -- Self-contained content (cards, posts)
section [] [...]  -- Thematic grouping
aside [] [...]    -- Sidebar or tangential content

-- Headers and footers
header [] [...]   -- Section/article/page header
footer [] [...]   -- Section/article/page footer
```

### Navigation

```unison
nav []
  [ ul []
    [ li [] [a [href "/"] [text "Home"]]
    , li [] [a [href "/tasks"] [text "Tasks"]]
    ]
  ]
```

### Forms

```unison
form [action submitUrl, method "POST"]
  [ label [for' "title"] [text "Title"]
  , input [type_ "text", name "title", id "title"]
  , label [for' "completed"] [text "Completed"]
  , input [type_ "checkbox", name "completed", id "completed"]
  , button [type_ "submit"] [text "Create"]
  ]
```

### Lists

```unison
-- Unordered
ul []
  [ li [] [text "Item 1"]
  , li [] [text "Item 2"]
  ]

-- Ordered
ol []
  [ li [] [text "First"]
  , li [] [text "Second"]
  ]
```

### Tables

```unison
table []
  [ thead []
    [ tr []
      [ th [] [text "Name"]
      , th [] [text "Status"]
      ]
    ]
  , tbody []
    [ tr []
      [ td [] [text "Task 1"]
      , td [] [text "Done"]
      ]
    ]
  ]
```

## Conditional Attributes

**Problem:** You can't use `if` expressions directly in attribute lists.

**Solution:** Build the attribute list conditionally using `List.++`

### Pattern

```unison
elementAttrs =
  baseAttrs List.++ (if condition then extraAttrs else [])

element elementAttrs children
```

### Example: Conditional Checkbox

```unison
app.pages.tasks.taskCheckbox : Task -> '{Route} Html
app.pages.tasks.taskCheckbox task = do
  use Path /
  use Text ++

  taskId = Task.id task
  isCompleted = Task.completed task
  toggleUrl = baseUrl() / "tasks" / taskId / "toggle" |> Path.toText

  checkboxAttrs =
    [ type_ "checkbox"
    , hx_post toggleUrl
    , hx_target ("#task-" ++ taskId)
    , hx_swap OuterHtml None
    ] List.++ (if isCompleted then [checked true] else [])

  input checkboxAttrs []
```

### Example: Conditional CSS Properties (for custom styles)

```unison
buttonAttrs =
  [ type_ "button"
  , hx_post createUrl
  ] List.++ (if isPrimary then [role "button"] else [])
```

### Example: Multiple Conditional Attributes

```unison
inputAttrs =
  [ type_ "text"
  , name "title"
  ]
  List.++ (if isRequired then [required true] else [])
  List.++ (if isDisabled then [disabled true] else [])
  List.++ (if hasError then [Attribute.class "error"] else [])
  -- Note: avoid classes when possible, but if needed, use sparingly
```

## Conditional Rendering

### Conditionally Include Elements

```unison
div []
  ([ h1 [] [text "Title"]
   , p [] [text "Content"]
   ]
   List.++ (if showFooter then [footer [] [text "Footer"]] else [])
  )
```

### Pattern Match to Choose Elements

```unison
app.pages.tasks.statusBadge : TaskStatus -> Html
app.pages.tasks.statusBadge status =
  match status with
    Pending -> span [] [text "⏳ Pending"]
    InProgress -> span [] [text "🔄 In Progress"]
    Completed -> span [] [text "✅ Completed"]
```

### Optional Content

```unison
app.pages.tasks.showError : Optional Text -> Html
app.pages.tasks.showError maybeError =
  use Optional None Some
  match maybeError with
    Some errorMsg -> div [] [text errorMsg]
    None -> html.empty
```

## Lists of Dynamic Content

### Rendering a List of Items

```unison
app.pages.tasks.index : [Task] -> '{Route} Html
app.pages.tasks.index tasks = do
  taskItems = List.map taskItem tasks

  div []
    [ h1 [] [text "Tasks"]
    , ul [id "task-list"] taskItems
    ]
```

### Empty State Handling

```unison
app.pages.tasks.index : [Task] -> '{Route} Html
app.pages.tasks.index tasks = do
  content =
    if List.isEmpty tasks then
      [p [] [text "No tasks yet. Create one!"]]
    else
      List.map taskItem tasks

  div []
    ([ h1 [] [text "Tasks"]
     ] List.++ content
    )
```

### With Alternating Styles (if needed)

```unison
app.pages.tasks.taskList : [Task] -> '{Route} [Html]
app.pages.tasks.taskList tasks = do
  List.indexedMap (i task ->
    isEven = Nat.mod i 2 == 0
    attrs = if isEven then [] else [Attribute.class "odd"]
    li attrs [taskItem task ()]
  ) tasks
```

## HTMX Patterns

### Basic AJAX Request

```unison
button
  [ hx_get fetchUrl
  , hx_target "#result"
  , hx_swap InnerHtml None
  ]
  [text "Load Data"]
```

### Form Submission

```unison
form
  [ hx_post submitUrl
  , hx_target "#list"
  , hx_swap BeforeEnd None
  ]
  [ input [type_ "text", name "title"]
  , button [type_ "submit"] [text "Add"]
  ]
```

### Delete with Confirmation

```unison
button
  [ hx_delete deleteUrl
  , hx_confirm "Are you sure?"
  , hx_target ("#item-" Text.++ itemId)
  , hx_swap OuterHtml None
  ]
  [text "Delete"]
```

### Swap Options

```unison
-- Replace inner HTML
hx_swap InnerHtml None

-- Replace outer HTML (including element itself)
hx_swap OuterHtml None

-- Append to end of target
hx_swap BeforeEnd None

-- Prepend to start of target
hx_swap AfterBegin None

-- Insert before target
hx_swap BeforeBegin None

-- Insert after target
hx_swap AfterEnd None
```

### Loading States

```unison
button
  [ hx_post createUrl
  , hx_indicator "#spinner"
  ]
  [ text "Create"
  , span [id "spinner", Attribute.class "htmx-indicator"] [text "..."]
  ]
```

## Common Patterns

### Card Layout

```unison
app.pages.tasks.taskCard : Task -> '{Route} Html
app.pages.tasks.taskCard task = do
  use Text ++

  article []
    [ header [] [h3 [] [text (Task.title task)]]
    , section []
      [ p [] [text (Task.description task)]
      ]
    , footer []
      [ button [hx_delete deleteUrl] [text "Delete"]
      ]
    ]
```

### Navigation Bar

```unison
app.pages.navbar : '{Route} Html
app.pages.navbar = do
  use Path /
  homeUrl = baseUrl() / "" |> Path.toText
  tasksUrl = baseUrl() / "tasks" |> Path.toText

  nav []
    [ ul []
      [ li [] [a [href homeUrl] [text "Home"]]
      , li [] [a [href tasksUrl] [text "Tasks"]]
      ]
    ]
```

### Grid Layout

```unison
-- PicoCSS automatically creates responsive grids with <article> in a container
div []
  [ article [] [text "Card 1"]
  , article [] [text "Card 2"]
  , article [] [text "Card 3"]
  ]
```

### Modal/Dialog Pattern (with htmx)

```unison
-- Button to open modal
button
  [ hx_get modalContentUrl
  , hx_target "#modal"
  , hx_swap InnerHtml None
  ]
  [text "Open Modal"]

-- Modal container (initially empty)
div [id "modal"] []

-- Modal content (returned by server)
dialog [open true]
  [ article []
    [ header []
      [ h3 [] [text "Modal Title"]
      , button
        [ hx_get emptyUrl  -- Returns empty content
        , hx_target "#modal"
        ]
        [text "×"]
      ]
    , section [] [p [] [text "Modal content"]]
    ]
  ]
```

## Accessibility Best Practices

### Always Use Labels

```unison
-- GOOD
label [for' "email"] [text "Email"]
input [type_ "email", id "email", name "email"]

-- BAD
input [type_ "email", name "email", placeholder "Email"]
```

### Button vs Link

```unison
-- Use <a> for navigation
a [href targetUrl] [text "Go to Tasks"]

-- Use <button> for actions
button [hx_post createUrl] [text "Create Task"]
```

### Semantic Headings

```unison
-- Use heading hierarchy (h1, h2, h3...)
main []
  [ h1 [] [text "Page Title"]        -- One h1 per page
  , section []
    [ h2 [] [text "Section Title"]   -- h2 for sections
    , article []
      [ h3 [] [text "Article Title"] -- h3 for subsections
      ]
    ]
  ]
```

## Integration with baseUrl()

**CRITICAL:** All internal URLs must use `baseUrl()`

```unison
app.pages.tasks.taskItem : Task -> '{Route} Html
app.pages.tasks.taskItem task = do
  use Path /
  use Text ++

  taskId = Task.id task
  taskUrl = baseUrl() / "tasks" / taskId |> Path.toText
  deleteUrl = taskUrl  -- Same URL, different method
  toggleUrl = baseUrl() / "tasks" / taskId / "toggle" |> Path.toText

  li [id ("task-" ++ taskId)]
    [ input
      [ type_ "checkbox"
      , hx_post toggleUrl
      , hx_target ("#task-" ++ taskId)
      , hx_swap OuterHtml None
      ] List.++ (if Task.completed task then [checked true] else [])
    , a [href taskUrl] [text (Task.title task)]
    , button
      [ hx_delete deleteUrl
      , hx_target ("#task-" ++ taskId)
      , hx_swap OuterHtml None
      ]
      [text "Delete"]
    ]
```

## Summary

**The Patterns:**

1. **Semantic HTML** - Use meaningful elements, no divs everywhere
2. **No CSS classes** - Let PicoCSS style semantic elements
3. **Conditional attributes** - Build attribute lists with `List.++`
4. **Conditional rendering** - Use `if` expressions for element lists
5. **Dynamic lists** - Use `List.map` to render collections
6. **htmx for interactivity** - Server returns HTML, htmx swaps it in
7. **baseUrl() everywhere** - All internal URLs must use it

**The Result:** Clean, accessible, interactive HTML without writing JavaScript or CSS.
