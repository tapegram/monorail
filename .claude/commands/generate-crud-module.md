# /generate-crud-module

You are a Rails-like code generator for Unison web applications.

Generate a complete CRUD module following these exact steps:

## Step 1: Gather Requirements

Ask the user:
1. What is the entity name? (e.g., "Workout", "Post", "User")
2. What fields does it have? (e.g., "name: Text, description: Text, reps: Nat")
3. Should I generate JSON mappers? (yes/no)

## Step 2: Create Domain Type

**Teach First:**
```
Let's start by defining the domain type - this represents a <Entity> in our system.

## What is a Domain Type?

It's a record that models your business concept. In this case, a <Entity> with:
- id: Text - We use Text for IDs (will be UUIDs later)
- [field1]: [Type1] - [explain what this field represents]
- [field2]: [Type2] - [explain what this field represents]

## Why start with the domain type?

1. It's the CORE of your feature - everything else revolves around it
2. It's pure data - no dependencies, easy to understand
3. It drives the design of everything else (ports, services, views)

This is "domain-driven design" - start with the business concept!
```

Create a new scratch file named `<entity-name>-crud.u` with the domain record:

```unison
-- This represents a <Entity> in our system
-- The id is Text because we'll generate UUIDs for each <entity>
type <Entity> =
  { id : Text
  , <field1> : <Type1>  -- [explain purpose]
  , <field2> : <Type2>  -- [explain purpose]
  -- ... other fields
  }
```

**After showing code:**
```
Notice:
- Simple record type - just data, no logic
- Text ID - we'll generate UUIDs when creating <entities>
- Clear field names - self-documenting

This is the foundation. Everything else will work with this type!
```

Typecheck immediately.

## Step 3: Generate Repository Port

**Teach First:**
```
Now let's create the <Entity>Repository - this is a PORT (ability).

## What is a Port?

A port defines WHAT operations we need, not HOW they work.

Think of it as a contract:
- "I need to get a <entity> by ID"
- "I need to list all <entities>"
- "I need to save a <entity>"
- "I need to delete a <entity>"

But it DOESN'T say:
- WHERE <entities> are stored (database? memory? file?)
- HOW they're stored (SQL? OrderedTable? JSON?)

That's decided by the ADAPTER (coming next), not the port.

## Why use a Port?

1. **Testability**: Services can use a FAKE repository for tests
2. **Flexibility**: Swap storage (in-memory → database) without changing services
3. **Clarity**: Services declare exactly what they need

This is the "ports & adapters" architecture!
```

Add to the scratch file:

```unison
-- This is a PORT (ability) - defines WHAT operations we need for <Entity>
-- The actual implementation (HOW) is decided by the adapter
ability <Entity>Repository where
  -- Get a single <entity> by ID
  -- Returns Optional because the <entity> might not exist
  get     : Text ->{<Entity>Repository} (Optional <Entity>)

  -- Get all <entities>
  -- Delayed computation (') because it might do I/O
  listAll : '{<Entity>Repository} [<Entity>]

  -- Save (insert or update) a <entity>
  -- Takes the full <entity> to save
  upsert  : <Entity> ->{<Entity>Repository} ()

  -- Delete a <entity> by ID
  delete  : Text ->{<Entity>Repository} ()
```

**After showing code:**
```
Key insights:
- get returns Optional - the <entity> might not exist!
- listAll uses ' (delayed) - will run when forced
- upsert handles both create AND update
- All operations use the <Entity>Repository ability

Services will depend on THIS port, not the database directly.
That's what makes them testable!
```

Reference: @.claude/templates/repository-ability.u

Typecheck.

## Step 4: Generate Repository Adapter

**Teach First:**
```
Now we create the ADAPTER - this is HOW the port is implemented.

## What is an Adapter?

While the port says "I need these operations", the adapter says "Here's how to do them".

For <Entity>Repository, we'll use OrderedTable:
- A key-value store in Unison Cloud
- Stores <entities> by their ID
- Supports read, write, delete operations

## How does a Handler Work?

The pattern:
1. Define `<Repository>.run` that takes the Database
2. Create the OrderedTable for storing <entities>
3. Define an internal `go` function
4. Pattern match on ability operations
5. Do the actual work (read/write to OrderedTable)
6. Resume with the result

The magic: `handle !p with cases` intercepts ability calls!

When a service calls `<Entity>Repository.get id`, this handler:
1. Intercepts that call
2. Reads from OrderedTable
3. Resumes the service with the result

This is "algebraic effects" - Unison's superpower!
```

Add the adapter using OrderedTable:

```unison
<Entity>Repository.run :
  Database ->
  '{g, <Entity>Repository} a ->
  {g, Remote} a
<Entity>Repository.run db p =
  table = OrderedTable.named db "<entities>" Universal.ordering

  go : '{g, <Entity>Repository} a -> {g, Remote} a
  go p = handle !p with cases
    {get id -> resume} ->
      go '(resume (OrderedTable.tryRead table id))
    {listAll _ -> resume} ->
      list = do OrderedTable.toStream table |> Stream.map at2 |> Stream.toList
      go '(resume list)
    {upsert e -> resume} ->
      go '(resume (OrderedTable.write table e.id e))
    {delete id -> resume} ->
      go '(resume (OrderedTable.delete table id))
    {k} -> k

  go p
```

Reference: @.claude/templates/repository-adapter.u

Typecheck.

## Step 5: Generate Service

Add the service with all CRUD operations:

```unison
<Entity>Service.create : CreateInput ->{<Entity>Repository, UuidGenerator} <Entity>
<Entity>Service.create input =
  id = UuidGenerator.new
  entity = { id, <fields from input> }
  <Entity>Repository.upsert entity
  entity

<Entity>Service.update : Text -> UpdateInput ->{<Entity>Repository, Exception} <Entity>
<Entity>Service.update id input =
  existing = <Entity>Repository.get id
  match existing with
    Some e ->
      updated = { e with <fields from input> }
      <Entity>Repository.upsert updated
      updated
    None ->
      Exception.raise (failure "Entity not found" id)

<Entity>Service.delete : Text ->{<Entity>Repository, Exception} ()
<Entity>Service.delete id =
  existing = <Entity>Repository.get id
  match existing with
    Some _ -> <Entity>Repository.delete id
    None -> Exception.raise (failure "Entity not found" id)

<Entity>Service.get : Text ->{<Entity>Repository} (Optional <Entity>)
<Entity>Service.get id = <Entity>Repository.get id

<Entity>Service.listAll : '{<Entity>Repository} [<Entity>]
<Entity>Service.listAll = <Entity>Repository.listAll
```

Reference: @.claude/templates/service.u

Typecheck.

## Step 6: Generate JSON Mappers (if requested)

If the user requested JSON mappers, use `/generate-json-mappers` command.

## Step 7: Generate Controller

Add controller functions for each endpoint:

```unison
<Entity>Controller.index db =
  entities = handle <Entity>Service.listAll() with <Entity>Repository.run db
  html = <Entity>Pages.index entities
  ok.html (page.full html)

<Entity>Controller.create db =
  formData = getFormData()
  -- Parse form data and call service
  -- Return appropriate response
```

Typecheck.

## Step 8: Generate Routes

Add routes following the RESTful pattern:

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

  show = do
    id = route GET (s "<entities>" / Parser.text)
    <Entity>Controller.show db id

  update = do
    id = route PUT (s "<entities>" / Parser.text)
    <Entity>Controller.update db id

  destroy = do
    id = route DELETE (s "<entities>" / Parser.text)
    <Entity>Controller.destroy db id

  index <|> create <|> show <|> update <|> destroy
```

Reference: @.claude/templates/routes.u

Typecheck.

## Step 9: Generate Basic Pages

Create semantic HTML pages using PicoCSS and htmx:

```unison
<Entity>Pages.index : [<Entity>] -> Html
<Entity>Pages.index entities =
  use tapegram_html_2_0_0 div h1 ul li a button
  div []
    [ h1 [] [text "<Entities>"]
    , a [href "/<entities>/new"] [text "New <Entity>"]
    , ul [] (List.map <Entity>Pages.item entities)
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

Reference: @.claude/skills/web-stack-pico-htmx.md

Typecheck final code.

## Step 10: Summary

Show the user:
1. File location: `<entity-name>-crud.u`
2. What was generated (domain, repository, service, controller, routes, pages)
3. Next steps: "Provide the UCM command to load this file into your project"

IMPORTANT: Follow the TDD principles from @.claude/skills/testing.md if the user wants tests.
