# Snippets & Scaffolds (Unison Web Framework)

These are canonical scaffolds used across generators.

They reflect:

- No newtypes by default
- Ports & Adapters architecture
- PicoCSS (classless version) + htmx - use semantic HTML without CSS classes

---

# Ability Scaffold (Port)

```unison
ability <Name> where
  operation1 : Input1 ->{<Name>} Output1
  operation2 : Input2 ->{<Name>} Output2
```

Ports are _dependency interfaces_ for services.

---

# Repository Scaffold (Port + Adapter)

```unison
ability <Entity>Repository where
  get     : Text ->{<Entity>Repository} (Optional <Entity>)
  listAll : '{<Entity>Repository} [<Entity>]
  upsert  : <Entity> ->{<Entity>Repository} ()
  delete  : Text ->{<Entity>Repository} ()
```

Adapter:

```unison
<Entity>Repository.run db p =
  table = OrderedTable.named db "<entities>" Universal.ordering

  get' id = OrderedTable.tryRead table id
  listAll' =
    do OrderedTable.toStream table |> Stream.map at2 |> Stream.toList
  upsert' e = OrderedTable.write table e.id e
  delete' id = OrderedTable.delete table id

  go p = handle !p with cases
    {get id -> resume}      -> go '(resume (get' id))
    {listAll _ -> resume}   -> go '(resume (listAll' ()))
    {upsert e -> resume}    -> go '(resume (upsert' e))
    {delete id -> resume}   -> go '(resume (delete' id))
    {k} -> k

  go p
```

---

# Service Scaffold

```unison
app.services.<Entity>Service.create :
  Create<Entity>Input ->
  {<Entity>Repository, Clock, UuidGenerator} <Entity>

app.services.<Entity>Service.create input =
  id = UuidGenerator.new
  now = Clock.now
  e = { id, createdAt = now, ... }
  <Entity>Repository.upsert e
  e
```

---

# Controller Scaffold

```unison
app.controllers.<Entity>Controller.create db =
  form = getFormData()
  input = parse form
  e = app.services.<Entity>Service.create input
  html = app.pages.<entity>.ShowPage.view e
  ok.html (page.full html)
```

---

# Route Scaffold

```unison
use Route <|>
use Parser / s

routes db =
  index = do
    _ = route GET (s "<entities>")
    app.controllers.<Entity>Controller.index db

  create = do
    _ = route POST (s "<entities>")
    app.controllers.<Entity>Controller.create db

  index <|> create
```

---

# Deploy Scaffold

```unison
deploy.deploy = Cloud.main do
  env = !Environment.default
  db  = main.initializeStorage env
  serviceName = ServiceName.create "app"
  serviceHash = deployHttp env (main.main db)
  ServiceName.assign serviceName serviceHash

main.initializeStorage env =
  db = Database.create "appDB"
  Database.assign db env
  db
```

---

# Page Scaffold (PicoCSS + htmx)

```unison
view items =
  div []
    [ h1 [] [ text "Items" ]
    , button [ hxGet "/items/new", hxTarget "#main" ] [ text "New Item" ]
    , ul [] (List.map itemView items)
    ]

itemView item =
  li []
    [ text item.name
    , button
        [ hxDelete ("/items/" ++ item.id)
        , hxTarget "#main"
        , hxSwap "innerHTML"
        ]
        [ text "Delete" ]
    ]
```

---

# JSON Mapper Scaffold

```unison
<Entity>.encoder e =
  object.empty
    |> addText "id" e.id
    |> addText "name" e.name

<Entity>.decoder = do
  use object at!
  id   = at! "id" Decoder.text
  name = at! "name" Decoder.text
  { id, name }
```
