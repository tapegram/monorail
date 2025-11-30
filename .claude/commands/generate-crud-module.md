# /generate-crud-module

You are a Rails-like code generator for Unison web applications.

**IMPORTANT:** Follow the efficient code generation strategy from @.claude/skills/efficient-code-generation.md
- Copy templates using Write tool
- Make targeted edits using Edit tool
- Minimize streaming code
- Explain concepts separately

Generate a complete CRUD module following these exact steps:

## Step 1: Gather Requirements

Ask the user:
1. What is the entity name? (e.g., "Workout", "Post", "User")
2. What fields does it have? (e.g., "name: Text, description: Text, reps: Nat")
3. Should I generate JSON mappers? (yes/no)

## Step 2: Create Scratch File with Domain Type

Create a new scratch file named `<entity-name>-crud.u`:

```unison
type <Entity> =
  { id : Text
  , <field1> : <Type1>
  , <field2> : <Type2>
  }
```

**Teaching (after creating):**
```
I've created the domain type - the CORE of your feature.

Key points:
- It's a record that models your <Entity> business concept
- Text ID because we'll generate UUIDs
- Pure data - no logic, no dependencies

This drives everything else (ports, services, views).
```

Typecheck immediately.

## Step 3: Generate Repository Port

**EFFICIENT APPROACH:** Copy template and edit

1. **Append repository ability template:**
```
Bash: cat .claude/templates/repository-ability.u >> <entity-name>-crud.u
```

2. **Edit placeholders:**
```
Edit(<entity-name>-crud.u, replace_all=true):
  - MyEntity → <Entity>
  - MyEntityRepository → <Entity>Repository
```

**Teaching (after editing):**
```
I've added the <Entity>Repository port (ability).

Key concepts:
- PORT defines WHAT operations we need (get, list, upsert, delete)
- Doesn't say HOW or WHERE data is stored
- Services depend on this, not the database
- Enables testing with fake adapters

This is ports & adapters architecture!
```

Typecheck.

## Step 4: Generate Repository Adapter

**EFFICIENT APPROACH:** Copy template and edit

1. **Append adapter template:**
```
Bash: cat .claude/templates/repository-adapter.u >> <entity-name>-crud.u
```

2. **Edit placeholders:**
```
Edit(<entity-name>-crud.u, replace_all=true):
  - MyEntity → <Entity>
  - MyEntityRepository → <Entity>Repository
  - myentities → <entities>
```

**Teaching (after editing):**
```
I've added the adapter - HOW the port is implemented.

Key concepts:
- Uses OrderedTable (key-value store in Unison Cloud)
- The `handle !p with cases` intercepts ability calls
- When service calls <Entity>Repository.get, this runs the actual database read
- The internal `go` function handles each operation

This is algebraic effects - Unison's superpower!
```

Typecheck.

## Step 5: Generate Service

**EFFICIENT APPROACH:** Generate service skeleton, then customize

Add service with CRUD operations directly (service is custom per entity):

```unison
<Entity>Service.create : CreateInput ->{<Entity>Repository, UuidGenerator} <Entity>
<Entity>Service.create input =
  id = UuidGenerator.new
  entity = { id, <fields from input> }
  <Entity>Repository.upsert entity
  entity

<Entity>Service.get : Text ->{<Entity>Repository} (Optional <Entity>)
<Entity>Service.get id = <Entity>Repository.get id

<Entity>Service.listAll : '{<Entity>Repository} [<Entity>]
<Entity>Service.listAll = <Entity>Repository.listAll

<Entity>Service.update : Text -> UpdateInput ->{<Entity>Repository, Exception} <Entity>
<Entity>Service.update id input =
  match <Entity>Repository.get id with
    Some e ->
      updated = { e with <fields from input> }
      <Entity>Repository.upsert updated
      updated
    None ->
      Exception.raise (failure "<Entity> not found" id)

<Entity>Service.delete : Text ->{<Entity>Repository, Exception} ()
<Entity>Service.delete id =
  match <Entity>Repository.get id with
    Some _ -> <Entity>Repository.delete id
    None -> Exception.raise (failure "<Entity> not found" id)
```

**Teaching:**
```
I've added the service with ALL business logic:
- create: generates UUID, saves entity
- get/listAll: simple passthroughs to repository
- update: validates entity exists, updates fields
- delete: validates entity exists, deletes

Services depend on the PORT (<Entity>Repository), never the adapter.
That's what makes them testable!
```

Typecheck.

## Step 6: Generate JSON Mappers (if requested)

If the user requested JSON mappers, use `/generate-json-mappers` command.

## Step 7: Generate Controller

**EFFICIENT APPROACH:** Generate minimal controller skeleton

Add controller functions (customize based on entity):

```unison
<Entity>Controller.index db =
  entities = handle <Entity>Service.listAll() with <Entity>Repository.run db
  html = <Entity>Pages.index entities
  ok.html (page.page html [])

<Entity>Controller.create db =
  formData = getFormData()
  input = { name = form.getOnly! "name" formData, <other fields> }
  entity = handle <Entity>Service.create input with <Entity>Repository.run db
  html = <Entity>Pages.item entity
  ok.html (page.page html [])
```

Typecheck.

## Step 8: Generate Routes

**EFFICIENT APPROACH:** Generate RESTful routes directly

Add routes (customize based on entity):

```unison
<entity>Routes db =
  use Route <|>
  use Parser / s

  index = do
    _ = route GET (s "<entities>")
    <Entity>Controller.index db

  create = do
    _ = route POST (s "<entities>")
    <Entity>Controller.create db

  destroy = do
    id = route DELETE (s "<entities>" / Parser.text)
    <Entity>Controller.destroy db id

  index <|> create <|> destroy
```

**Teaching:**
```
RESTful routes:
- GET /<entities> → list all
- POST /<entities> → create new
- DELETE /<entities>/:id → delete by ID

Routes are THIN - just parse URL and delegate to controller.
```

Typecheck.

## Step 9: Generate Basic Pages

**EFFICIENT APPROACH:** Generate semantic HTML directly

Add pages (customize based on entity fields):

```unison
<Entity>Pages.index : [<Entity>] -> Html
<Entity>Pages.index entities =
  use tapegram_html_2_0_0 div h1 ul
  div []
    [ h1 [] [text "<Entities>"]
    , ul [id "<entity>-list"] (List.map <Entity>Pages.item entities)
    ]

<Entity>Pages.item : <Entity> -> Html
<Entity>Pages.item entity =
  use tapegram_html_2_0_0 li div button
  li []
    [ div [] [text entity.name]
    , button
        [ hxDelete ("/<entities>/" ++ entity.id)
        , hxTarget "closest li"
        , hxSwap "outerHTML"
        ]
        [text "Delete"]
    ]
```

**Teaching:**
```
Semantic HTML + htmx:
- NO CSS classes (PicoCSS classless styles automatically)
- hxDelete triggers DELETE request
- hxTarget "closest li" removes the list item
- hxSwap "outerHTML" replaces the element

Server-side rendering with progressive enhancement!
```

Typecheck final code.

## Step 10: Summary

Show the user:
1. File location: `<entity-name>-crud.u`
2. What was generated (domain, repository, service, controller, routes, pages)
3. Next steps: "Provide the UCM command to load this file into your project"

IMPORTANT: Follow the TDD principles from @.claude/skills/testing.md if the user wants tests.
