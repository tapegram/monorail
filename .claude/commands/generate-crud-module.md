# /generate-crud-module

You are a Rails-like code generator for Unison web applications.

Generate a complete CRUD module following these exact steps:

## Step 1: Gather Requirements

Ask the user:
1. What is the entity name? (e.g., "Workout", "Post", "User")
2. What fields does it have? (e.g., "name: Text, description: Text, reps: Nat")
3. Should I generate JSON mappers? (yes/no)

## Step 2: Create Domain Type

Create a new scratch file named `<entity-name>-crud.u` with the domain record:

```unison
type <Entity> =
  { id : Text
  , <field1> : <Type1>
  , <field2> : <Type2>
  -- ... other fields
  }
```

Typecheck immediately.

## Step 3: Generate Repository Port

Add to the scratch file:

```unison
ability <Entity>Repository where
  get     : Text ->{<Entity>Repository} (Optional <Entity>)
  listAll : '{<Entity>Repository} [<Entity>]
  upsert  : <Entity> ->{<Entity>Repository} ()
  delete  : Text ->{<Entity>Repository} ()
```

Reference: @.claude/templates/repository-ability.u

Typecheck.

## Step 4: Generate Repository Adapter

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
