# Explanation Templates

Reusable teaching patterns for common scenarios. Copy and adapt these when generating code.

## Template: First CRUD Module (Complete Architecture)

```
# Building Your First CRUD Module

Let me walk you through creating a complete CRUD (Create, Read, Update, Delete) module for <Entity>.

We'll build this in layers, from the inside out:

## The Architecture Overview

Think of our application like a layered cake:

```
┌─────────────────────────┐
│   HTTP Request          │  ← User clicks/submits
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│   Routes                │  ← "Which controller should handle this?"
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│   Controllers           │  ← "Parse request, call service, render response"
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│   Services              │  ← "ALL business logic lives here"
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│   Ports (Abilities)     │  ← "I need these operations"
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│   Adapters (Handlers)   │  ← "Here's how to do them"
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│   Database/API/etc      │  ← Actual infrastructure
└─────────────────────────┘
```

## Why This Architecture?

**Separation of Concerns**:
- Routes: Just URL parsing
- Controllers: Just request/response handling
- Services: Just business logic
- Ports: Just interface definitions
- Adapters: Just infrastructure

**Testability**:
- Services use ports (abilities)
- Tests use fake adapters
- No database needed for testing!

**Flexibility**:
- Swap adapters (memory → database)
- Services don't change
- Controllers don't change

Let's build it step by step...
```

## Template: Explaining Abilities (First Time)

```
# Understanding Abilities in Unison

An ability is Unison's way of handling "effects" - operations that interact with the world.

## The Problem They Solve

Imagine you have a service that needs to:
- Read from a database
- Generate a random ID
- Get the current time

Without abilities, you'd pass these as function parameters:

```unison
-- BAD: Too many parameters!
createWorkout : Database -> UuidGen -> Clock -> Input -> Workout
```

And testing would be hard - you'd need a real database, real random, real time!

## The Solution: Abilities

Instead, declare what you NEED:

```unison
createWorkout : Input ->{WorkoutRepository, UuidGenerator, Clock} Workout
```

The `{WorkoutRepository, UuidGenerator, Clock}` says:
- "I need these abilities"
- "I don't care HOW they're implemented"

Then at the edges (controllers), you "handle" them:

```unison
result = handle
  handle
    handle createWorkout input
      with WorkoutRepository.run database
    with UuidGenerator.run
  with Clock.run
```

Each `handle ... with` provides an implementation.

## Why This Is Powerful

1. **Testability**: Swap implementations for testing
2. **Composability**: Combine effects naturally
3. **Type Safety**: Compiler tracks which effects you use
4. **Clarity**: Function signature shows dependencies

This is one of Unison's superpowers!
```

## Template: Explaining Handlers (First Time)

```
# How Handlers Work

A handler is code that IMPLEMENTS an ability.

## The Pattern

Every handler follows this pattern:

```unison
<Ability>.run : <Config> -> '{g, <Ability>} a -> {g, <Other>} a
<Ability>.run config p =
  -- 1. Set up environment (e.g., create OrderedTable)
  table = OrderedTable.named database "entities" Universal.ordering

  -- 2. Define internal 'go' function
  go : '{g, <Ability>} a -> {g, <Other>} a
  go p = handle !p with cases
    -- 3. Pattern match on each operation
    {operation input -> resume} ->
      -- 4. Do the actual work
      result = OrderedTable.read table input
      -- 5. Resume with result
      go '(resume result)

    -- 6. Pass through other effects
    {k} -> k

  -- 7. Start the handler
  go p
```

## Breaking It Down

**The Type**: `'{g, <Ability>} a -> {g, <Other>} a`
- Takes a delayed computation that uses `<Ability>`
- Returns the result, replacing `<Ability>` with `<Other>`
- The `g` lets other effects pass through

**The `go` Function**:
- Recursive handler implementation
- Intercepts ability operations
- Does real work
- Resumes computation

**Pattern Matching**: `{operation input -> resume}`
- Matches the ability operation
- Extracts the input
- Gets a continuation (`resume`) to continue

**Resuming**: `go '(resume result)`
- Calls `resume` with the result
- Wraps in delayed `'`
- Recursively handles more operations

**Pass Through**: `{k} -> k`
- Other effects pass through unchanged
- Keeps the handler composable

## What Happens at Runtime

When service calls `WorkoutRepository.get "123"`:

1. Handler intercepts: `{get "123" -> resume}`
2. Handler does work: `result = OrderedTable.read table "123"`
3. Handler resumes: `resume result`
4. Service continues with result
5. More operations? Handler intercepts again!

This is "algebraic effects" - handlers intercept, transform, resume.
```

## Template: Explaining TDD (First Tests)

```
# Test-Driven Development for Services

Let's write tests BEFORE implementing the service.

## Why Test First?

1. **Design**: Forces you to think about the API
2. **Documentation**: Tests show how to use the service
3. **Confidence**: Implementation has clear goals
4. **Simplicity**: Only write code that passes tests

## What We Test

✅ **Services**: All business logic
   - Easy to test (use fake adapters)
   - Most likely to have bugs
   - Core of your application

❌ **Controllers**: Just request/response
   - Thin by design
   - Little logic to test

❌ **Adapters**: Infrastructure
   - OrderedTable either works or doesn't
   - Covered by integration tests

## The Test Pattern

For every service operation, test:
1. **Happy path** - Normal usage works
2. **Error cases** - Invalid input handled
3. **Edge cases** - Boundary conditions

Example for `WorkoutService.create`:
- `create.success` - Creates workout correctly
- `create.emptyName` - Rejects empty names
- `create.duplicateId` - Handles ID collision

## Using Fake Adapters

Instead of a real database, use in-memory storage:

```unison
-- Fake repository using Ref
WorkoutRepository.fake : Ref [Workout] -> '{g, WorkoutRepository} a -> {g} a
WorkoutRepository.fake storage p =
  handle !p with cases
    {get id -> resume} ->
      workouts = Ref.read storage
      result = List.find (w -> w.id == id) workouts
      resume result

    {upsert workout -> resume} ->
      workouts = Ref.read storage
      filtered = List.filter (w -> w.id != workout.id) workouts
      Ref.write storage (workout +: filtered)
      resume ()
    ...
```

Benefits:
- Fast (no database)
- Deterministic (no randomness)
- Isolated (no side effects)
- Simple (just a List!)

## The TDD Cycle

1. Write a failing test
2. Implement minimal code to pass
3. Refactor if needed
4. Repeat

Let's write our first test...
```

## Template: Explaining Semantic HTML (First Page)

```
# Why Semantic HTML?

You might be used to writing HTML with lots of divs and classes:

```html
<div class="card">
  <div class="card-header">
    <div class="title">My Title</div>
  </div>
  <div class="card-body">
    <div class="content">My content</div>
  </div>
</div>
```

But we do this instead:

```html
<article>
  <header>
    <h1>My Title</h1>
  </header>
  <section>
    <p>My content</p>
  </section>
</article>
```

## Why?

**1. PicoCSS Styles Semantic Elements**

PicoCSS (classless version) automatically styles:
- `<article>` looks like a card
- `<nav>` looks like a navigation bar
- `<button>` looks like a button
- `<section>` has proper spacing

No classes needed!

**2. Accessibility**

Screen readers understand semantic elements:
- `<nav>` = "This is navigation"
- `<article>` = "This is a self-contained piece"
- `<aside>` = "This is supplementary"

Better for users with disabilities.

**3. Cleaner Code**

Compare:
```html
<div class="nav-container">  vs  <nav>
<div class="button-primary"> vs  <button>
<div class="card-article">   vs  <article>
```

The semantic version is clearer!

**4. Less Coupling**

With classes, your HTML is coupled to CSS:
- Change CSS → might break HTML
- Change HTML → might break CSS

With semantic elements:
- HTML describes structure
- CSS styles structure
- Less coupling!

## The Semantic Elements

- `<article>` - Self-contained content
- `<section>` - Thematic grouping
- `<nav>` - Navigation
- `<aside>` - Sidebar/tangent
- `<header>` - Header
- `<footer>` - Footer
- `<main>` - Main content

Use the RIGHT element for the job!
```

## Template: Explaining htmx (First Interactive Feature)

```
# How htmx Works

Let's make your page interactive WITHOUT writing JavaScript!

## The Traditional Way

Usually, interactivity requires JavaScript:

1. Add event listener to button
2. Make AJAX request in JavaScript
3. Parse JSON response
4. Update DOM with JavaScript
5. Manage state in JavaScript

That's a LOT of code and complexity!

## The htmx Way

With htmx, just add attributes:

```unison
button
  [ hxPost "/workouts"
  , hxTarget "#workout-list"
  , hxSwap "beforeend"
  ]
  [text "Add Workout"]
```

When clicked:
1. htmx POSTs to `/workouts`
2. Server returns HTML (a new `<li>`)
3. htmx inserts it into `#workout-list`
4. Done!

No JavaScript written by you!

## How It Works

**Client Side**:
- htmx JavaScript library (one file)
- Watches for `hx-*` attributes
- Makes AJAX requests automatically
- Updates DOM with responses

**Server Side**:
- Controller handles request
- Renders HTML (just like normal)
- Returns HTML fragment
- htmx swaps it in

**The Beauty**:
- Server renders HTML (what it does best)
- Browser displays HTML (what it does best)
- htmx glues them together
- Progressive enhancement!

## Common Patterns

**Load on Click**:
```unison
button [hxGet "/data", hxTarget "#result"] [text "Load"]
```

**Submit Form**:
```unison
form [hxPost "/create", hxTarget "#list", hxSwap "beforeend"] [...]
```

**Delete Item**:
```unison
button [hxDelete ("/items/" ++ id), hxTarget "closest li", hxSwap "outerHTML"] [text "Delete"]
```

**Auto-Refresh**:
```unison
div [hxGet "/status", hxTrigger "every 2s"] []
```

Server-side rendering + progressive enhancement = simple, powerful apps!
```

## Template: Explaining Ports & Adapters (Architecture Deep Dive)

```
# Ports & Adapters: The Big Picture

Let me explain our architecture philosophy.

## The Problem

Traditional layered architectures mix concerns:

```
UI Layer
  ↓ (knows about)
Business Logic Layer
  ↓ (knows about)
Database Layer
```

Problems:
- Business logic depends on database
- Can't test without database
- Hard to swap databases
- Coupling everywhere!

## The Solution: Ports & Adapters

Invert the dependencies:

```
     ┌─────────────────┐
     │   Core/Domain   │  ← Business logic
     │   (Services)    │
     └────────┬────────┘
              ↓ depends on
     ┌────────────────┐
     │  Ports         │  ← Interfaces (abilities)
     │  (Abilities)   │
     └────────────────┘
              ↑ implemented by
     ┌────────────────┐
     │  Adapters      │  ← Implementations
     │  (Handlers)    │
     └────────────────┘
              ↓ uses
     ┌────────────────┐
     │ Infrastructure │  ← Database, APIs, etc
     └────────────────┘
```

**Key Insight**: Core depends on PORTS, not infrastructure!

## In Practice

**Service (Core)**:
```unison
WorkoutService.create : Input ->{WorkoutRepository} Workout
WorkoutService.create input =
  -- Depends on WorkoutRepository ABILITY
  -- Doesn't know about OrderedTable or Database!
  ...
```

**Port (Interface)**:
```unison
ability WorkoutRepository where
  get : Text ->{WorkoutRepository} (Optional Workout)
  upsert : Workout ->{WorkoutRepository} ()
```

**Adapter (Implementation)**:
```unison
WorkoutRepository.run : Database -> '{g, WorkoutRepository} a -> {g, Remote} a
WorkoutRepository.run db p =
  -- Uses actual OrderedTable
  -- Knows about infrastructure
  ...
```

## Benefits

**Testability**:
- Service uses WorkoutRepository port
- Tests use fake adapter (in-memory)
- No database needed!

**Flexibility**:
- Swap adapters (memory → file → database)
- Service code unchanged
- Just change handler at edges

**Clarity**:
- Service declares dependencies
- Compiler enforces them
- No hidden coupling

This is "hexagonal architecture" or "clean architecture" - core logic isolated!
```

## Template: Explaining JSON Four Functions

```
# The Four JSON Functions

Every type that works with JSON needs FOUR functions.

## Why Four?

**Two for transformation**:
1. `encoder : Type -> Json` - Unison → JSON object
2. `decoder : '{Decoder} Type` - JSON object → Unison

**Two for convenience**:
3. `encode : Type -> Text` - Unison → JSON string
4. `decode : Text ->{Exception} Type` - JSON string → Unison

## The Encoder

Builds JSON using `object.empty` and chaining:

```unison
Workout.encoder : Workout -> Json
Workout.encoder w =
  object.empty
    |> object.addText "id" w.id
    |> object.addText "name" w.name
    |> object.addNat "reps" w.reps
```

Read `|>` as "then":
- Start with empty object
- THEN add id field
- THEN add name field
- THEN add reps field

Result: `{"id": "...", "name": "...", "reps": 10}`

## The Decoder

Extracts fields using `object.at!`:

```unison
Workout.decoder : '{Decoder} Type
Workout.decoder = do
  use object at!
  id = at! "id" Decoder.text
  name = at! "name" Decoder.text
  reps = at! "reps" Decoder.nat
  { id, name, reps }
```

The `at!` says "get this field or fail".
The `do` sequences these operations.
The final line constructs the record.

## Error Handling

The `decode` helper handles TWO error types:

```unison
Workout.decode txt =
  match Json.tryFromText txt with
    Right json ->  -- JSON parsed OK
      match Decoder.run Workout.decoder json with
        Right workout -> workout  -- Decoded OK
        Left err -> Exception.raise ...  -- Wrong shape
    Left parseErr -> Exception.raise ...  -- Invalid JSON
```

This gives clear errors for debugging!

## Testing

Always test the round-trip:

```unison
test> Workout.tests.jsonRoundTrip = test.verify do
  original = { id = "123", name = "Push-ups", reps = 10 }
  encoded = Workout.encode original
  decoded = Workout.decode encoded
  ensureEqual original decoded  -- Should be identical!
```

If encoding then decoding gives back the original, we're good!
```

## Usage Guidelines

1. **Choose the right template** for the concept you're teaching
2. **Adapt to context** - use entity names, specific fields, etc.
3. **Progressive disclosure** - first time: full explanation, later: brief reference
4. **Link concepts** - "Remember how abilities are ports? This is the same pattern..."
5. **End with action** - "Let's build it step by step..." / "Now let's write the code..."
