# Example Architecture: Unison Web App (PicoCSS + htmx)

This file describes the _recommended_ architecture for small-to-medium
Unison web applications built using:

- Semantic HTML rendered by Unison
- **PicoCSS (Classless version)** for styling (https://picocss.com/docs/)
- **htmx** for interactivity (https://htmx.org/docs/)
- Controllers → Services → Ports & Adapters pattern
- JSON for data transfer
- TDD-first use-case-level tests

The goal is a clean, simple, Rails-like structure with a functional
Unison flavor and a strong testing story.

---

# High-Level Structure

app/
routes/
_.u -- URL routing definitions
controllers/
_.u -- "thin" request handlers that call services
pages/
_.u -- HTML page builders (semantic + Pico + htmx)
components/
_.u -- HTML components which are used to build pages or to be returned from routes as partials.
services/
_.u -- all business logic; primary testing target
domain/
_.u -- domain types, invariants, helpers
ports/
_.u -- ability definitions (repositories, clients)
adapters/
storage/
_.u -- OrderedTable / Database adapters
http/
_.u -- Http ability adapters for API clients
deploy/
_.u -- deploy functions and related infra
main/
_.u -- main.main where the app and anything else needed is composed together to be used by deploys
web/
_.u -- generic functions representing web concepts, such as a page, form utilities, etc.

---

# Routing

- Routes live in `app.routes`.
- They parse **params** and **HTTP method** using the `Route` ability.
- They **do not** contain business logic.
- They call _controllers_.

Example:

```unison
-- app.routes.workouts
workoutRoutes db =
  use Route <|>
  use Parser / s

  index = do
    _ = route GET (s "workouts")
    app.controllers.WorkoutController.index db

  create = do
    _ = route POST (s "workouts")
    app.controllers.WorkoutController.create db

  index <|> create
```

---

# Controllers

Controllers:

- Handle request inputs (params, path IDs, form submissions)
- Call services
- Choose what page/partial to render

They should contain no domain logic.

Example:

```unison
app.controllers.WorkoutController.index db =
  workouts = app.services.WorkoutService.listAll ()
  html = app.pages.workouts.IndexPage.view workouts
  ok.html (page.full html)
```

---

# Services

Services contain all business logic.

Rules:

- Pure or nearly pure functions
- Depend on ports (abilities) like:
  ** WorkoutRepository
  ** Clock
  \*\* UuidGenerator
- Tests focus solely on services (TDD-first)
- Controllers + adapters stay thin

Example:

```unison
app.services.WorkoutService.create : CreateWorkoutInput ->{WorkoutRepository, UuidGenerator} Workout
app.services.WorkoutService.create input =
  id = UuidGenerator.new
  w = { id, name = input.name, createdAt = input.createdAt }
  WorkoutRepository.upsert w
  w
```

---

# Ports

Ports are Unison abilities that describe what the service needs from the world.

Example:

```unison
ability WorkoutRepository where
  get     : Text ->{WorkoutRepository} (Optional Workout)
  listAll : '{WorkoutRepository} [Workout]
  upsert  : Workout ->{WorkoutRepository} ()
  delete  : Text ->{WorkoutRepository} ()
```

---

# Adapters

Adapters are concrete `.run` functions that satisfy a port.

Example (OrderedTable):

```unison
WorkoutRepository.run db p =
  table = OrderedTable.named db "workouts" Universal.ordering

  go p = handle !p with cases
    {get id -> resume} -> go '(resume (OrderedTable.tryRead table id))
    {listAll _ -> resume} ->
      list = do OrderedTable.toStream table |> Stream.map at2 |> Stream.toList
      go '(resume list)
    {upsert w -> resume} -> go '(resume (OrderedTable.write table w.id w))
    {delete id -> resume} -> go '(resume (OrderedTable.delete table id))
    {k} -> k

  go p
```

---

# Pages (HTML)

Pages use:

- Semantic HTML
- PicoCSS (classless version - no CSS classes needed)
- htmx attributes
- The shared layout (see .claude/templates/page-layout.u)

Example page:

```unison
view workouts =
  div []
    [ h1 [] [ text "Workouts" ]
    , ul [] (List.map workoutItem workouts)
    ]

workoutItem w =
  li []
    [ text w.name
    , button [ hxDelete ("/workouts/" ++ w.id), hxTarget "#workouts" ] [ text "Delete" ]
    ]
```

---

# JSON

Domain types store plain Unison fields with id : Text or Nat.

Use mappers:

- `<Type>.encoder : Type -> Json`

- `<Type>.decoder : '{Decoder} Type`

- `<Type>.encode : Type -> Text`

- `<Type>.decode : Text ->{Exception} Type`

See corresponding skills files.

---

# TDD-first Development Workflow

1. Create a service function signature.

2. Write use-case-level tests in `app.services.<Service>.tests.*`.

3. Implement fake ports for testing.

4. Only then write the service implementation.

5. Keep controllers/adapters thin and untested or lightly tested.

6. Use real adapters in integration/e2e tests later.

This architecture ensures Unison apps remain small, predictable, and easy to test.
