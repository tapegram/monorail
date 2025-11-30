# /generate-page-and-route

You are generating a new page, controller, and route for a Unison web application.

Follow these exact steps:

## Step 1: Gather Requirements

Ask the user:

1. What is the route path? (e.g., "/about", "/workouts/:id", "/dashboard")
2. What HTTP method? (GET, POST, PUT, DELETE)
3. What should the page display/do?
4. Should it be a full page or a partial (for htmx)?

## Step 2: Create Scratch File

Create a file named `<page-name>-feature.u`

## Step 3: Generate the Page

Create semantic HTML using PicoCSS classless version (NO CSS classes):

```unison
<Page>Page.view : <Data> -> Html
<Page>Page.view data =
  use tapegram_html_2_0_0 div h1 p article section
  article []
    [ h1 [] [text "<Page Title>"]
    , section []
        [ p [] [text "Content here"]
        -- Add more semantic HTML elements
        ]
    ]
```

**IMPORTANT:**

- Use ONLY semantic HTML: `<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`, `<header>`, `<footer>`
- DO NOT use CSS classes - PicoCSS classless version styles semantic HTML automatically
- For interactivity, use htmx attributes: `hxGet`, `hxPost`, `hxTarget`, `hxSwap`, `hxTrigger`
- Reference: @.claude/skills/web-stack-pico-htmx.md

Typecheck.

## Step 4: Generate the Controller

Create a thin controller that calls services and renders the page:

```unison
<Page>Controller.show : Database -> ... -> {Route, Exception, Storage, Remote, Random, Log} HttpResponse
<Page>Controller.show db <params> =
  -- Call service to get data
  data = handle <Service>.<operation> <params> with <Repository>.run db
  -- Render page
  html = <Page>Page.view data
  ok.html (page.page html [])
```

**IMPORTANT:**

- Controllers should be THIN - no business logic
- Use `page.page` which handles both full page and partial rendering
- Call services, not repositories directly
- Reference: @.claude/templates/page-layout.u

Typecheck.

## Step 5: Generate the Route

Add route using the Route ability:

```unison
<page>Route db =
  use Parser / s
  <method> = do
    <params> = route <HTTP_METHOD> (s "<path>" </ Parser.text if needed>)
    <Page>Controller.show db <params>
  <method>
```

**Examples:**

- GET /about: `route GET (s "about")`
- GET /users/:id: `id = route GET (s "users" / Parser.text)`
- POST /workouts: `route POST (s "workouts")`

Reference: @.claude/templates/routes.u

Typecheck.

## Step 6: Integration Instructions

Tell the user:

1. "Add this route to your main routes composition in `app.routes`:"

   ```unison
   app.routes db =
     use Route <|>
     -- existing routes
     <page>Route db <|> otherRoutes
   ```

2. "Load the file in UCM:"

   ```
   load <page-name>-feature.u
   ```

3. If they want to test it, provide the URL path they can visit.

## htmx Integration Examples

If the page uses htmx, show examples:

**For dynamic updates:**

```unison
button
  button
    [ hx_get (baseUrl Path./ "api" Path./ "data" |> Path.toText)
    , hx_target "#result"
    , hx_swap "innerHTML"
    ]
    [text "Load Data"]
  , hx_target "#result"
  , hx_swap "innerHTML"
  ]
  [text "Load Data"]
```

**For form submission:**

```unison
form
  [ hx_post (baseUrl Path./ "workouts")
  , hx_target "#workout-list"
  , hx_swap "beforeend"
  ]
  [ input [name "title"] []
  , button [type' "submit"] [text "Add"]
  ]
```

Reference: https://htmx.org/docs/

## Final Checklist

- [ ] Page uses semantic HTML (no CSS classes)
- [ ] Controller is thin (calls services)
- [ ] Route properly parses path and method
- [ ] All code typechecks
- [ ] Integration instructions provided
