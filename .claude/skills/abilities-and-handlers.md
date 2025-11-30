# Abilities and Handlers in Unison

## What Are Abilities?

Abilities (also called "algebraic effects") are Unison's way of handling effects like I/O, state, exceptions, etc.

Think of an ability as:
- **An interface** declaring operations (like "get", "save", "delete")
- **A port** in ports & adapters architecture
- **A dependency** that can be swapped for testing

## Defining an Ability

```unison
ability TaskRepository where
  get     : Text ->{TaskRepository} (Optional Task)
  listAll : '{TaskRepository} [Task]
  upsert  : Task ->{TaskRepository} ()
  delete  : Text ->{TaskRepository} ()
```

**Breakdown:**
- `ability TaskRepository where` - Define the ability
- Each operation has a type signature
- The `{TaskRepository}` in the return type means "this operation uses the TaskRepository ability"
- The `'` prefix means "delayed computation"

## Using Abilities in Services

Services declare what abilities they need:

```unison
TaskService.list : '{TaskRepository} [Task]
TaskService.list = do
  TaskRepository.listAll ()

TaskService.get : Text ->{TaskRepository} (Optional Task)
TaskService.get id =
  TaskRepository.get id

TaskService.create : CreateTaskInput ->{TaskRepository, UuidGenerator} Task
TaskService.create input =
  id = UuidGenerator.new ()
  task = { id, title = input.title, completed = false }
  TaskRepository.upsert task
  task
```

**Key Points:**
- Services call ability operations directly
- Services don't know HOW the operations work
- Services can combine multiple abilities

## Implementing Handlers (Adapters)

A handler provides the implementation of an ability:

```unison
storage.TaskRepository.run :
  Database ->
  '{g, TaskRepository} a ->
  {g, Remote} a
storage.TaskRepository.run db p =
  table = OrderedTable.named db "tasks" Universal.ordering

  get' : Text ->{g, Remote} (Optional Task)
  get' id = OrderedTable.tryRead table id

  listAll' : '{g, Remote} [Task]
  listAll' = do
    OrderedTable.toStream table
      |> Stream.map at2
      |> Stream.toList

  upsert' : Task ->{g, Remote} ()
  upsert' task = OrderedTable.write table task.id task

  delete' : Text ->{g, Remote} ()
  delete' id = OrderedTable.delete table id

  go : '{g, TaskRepository} a -> {g, Remote} a
  go p = handle !p with cases
    {get id -> resume}     -> go '(resume (get' id))
    {listAll _ -> resume}  -> go '(resume (listAll' ()))
    {upsert t -> resume}   -> go '(resume (upsert' t))
    {delete id -> resume}  -> go '(resume (delete' id))
    {k} -> k

  go p
```

**Handler Pattern:**
1. Take environment (Database) as first parameter
2. Take delayed computation `'{g, TaskRepository} a` as second parameter
3. Define helper functions for each operation
4. Define `go` function that uses `handle !p with cases`
5. Pattern match on each ability operation
6. Call the helper function and resume with result
7. Call `go p` to start handling

## Applying Handlers: The Function Application Pattern

**CRITICAL:** Handlers are applied using function application, NOT `handle...with` syntax.

❌ **WRONG:**
```unison
main db req =
  handle storage.TaskRepository.run db with
    Route.run app.routes req
```

✅ **CORRECT:**
```unison
main db req =
  storage.TaskRepository.run db do
    Route.run app.routes req
```

**The Pattern:**
```
handlerFunction environment do
  codeUsingAbility
```

## Where to Apply Handlers

Handlers should be applied at the **application boundary**, typically in the `main` function:

```unison
main :
  Database
  -> HttpRequest
  ->{Environment.Config, Exception, Storage, Remote, Random, Log} HttpResponse
main db req =
  app.adapters.storage.TaskRepository.run db do
    Route.run app.routes req
```

**Why at the boundary?**
- Controllers can just declare the ability: `'{TaskRepository, Route} ()`
- Services can use the ability directly
- Only one place where handlers are applied
- Clean separation of concerns

## Ability Propagation

Abilities propagate through the call chain:

```unison
-- Routes declare abilities
app.routes : '{Route, Log, Exception, TaskRepository} ()

-- Controllers declare abilities (including Repository)
app.controllers.TaskController.index :
  '{Route, Environment.Config, Exception, TaskRepository, Log} ()
app.controllers.TaskController.index = do
  tasks = TaskService.list ()
  -- ...

-- Services use abilities
TaskService.list : '{TaskRepository} [Task]
TaskService.list = do
  TaskRepository.listAll ()
```

**Flow:**
1. `main` applies handler for `TaskRepository`
2. `main` calls `Route.run app.routes`
3. `app.routes` uses `TaskRepository` ability
4. Controllers use `TaskRepository` ability
5. Services use `TaskRepository` ability
6. The handler intercepts all `TaskRepository` calls

## Common Abilities in Web Apps

### Repository (Persistence)
```unison
ability TaskRepository where
  get     : Text ->{TaskRepository} (Optional Task)
  listAll : '{TaskRepository} [Task]
  upsert  : Task ->{TaskRepository} ()
  delete  : Text ->{TaskRepository} ()
```

### UuidGenerator (ID Generation)
```unison
ability UuidGenerator where
  new : '{UuidGenerator} Text
```

### Clock (Time)
```unison
ability Clock where
  now : '{Clock} Instant
```

### Route (HTTP Routing)
Built-in Unison ability for HTTP routing.

## Testing with Fake Handlers

For testing, create in-memory fake handlers:

```unison
fake.TaskRepository.run :
  Ref [Task] ->
  '{g, TaskRepository} a ->
  {g} a
fake.TaskRepository.run storage p =
  get' : Text ->{g} (Optional Task)
  get' id =
    tasks = Ref.read storage
    List.find (t -> Task.id t == id) tasks

  listAll' : '{g} [Task]
  listAll' = do Ref.read storage

  upsert' : Task ->{g} ()
  upsert' task =
    tasks = Ref.read storage
    newTasks = List.filter (t -> Task.id t != Task.id task) tasks
    Ref.write storage (newTasks List.++ [task])

  delete' : Text ->{g} ()
  delete' id =
    tasks = Ref.read storage
    Ref.write storage (List.filter (t -> Task.id t != id) tasks)

  go : '{g, TaskRepository} a -> {g} a
  go p = handle !p with cases
    {get id -> resume}     -> go '(resume (get' id))
    {listAll _ -> resume}  -> go '(resume (listAll' ()))
    {upsert t -> resume}   -> go '(resume (upsert' t))
    {delete id -> resume}  -> go '(resume (delete' id))
    {k} -> k

  go p
```

**Usage in tests:**
```unison
test> TaskService.tests.create.success = test.verify do
  storage = Ref.new []
  input = { title = "Test task" }

  task = fake.TaskRepository.run storage do
    TaskService.create input

  ensureEqual (Task.title task) "Test task"

  allTasks = fake.TaskRepository.run storage do
    TaskService.list ()

  ensureEqual (List.size allTasks) 1
```

## Multiple Handlers

You can apply multiple handlers by nesting:

```unison
main db req =
  storage.TaskRepository.run db do
    fake.UuidGenerator.run "test-uuid" do
      fake.Clock.run (Instant.fromEpochSeconds 0) do
        Route.run app.routes req
```

**Order:** Innermost handler is applied first.

## Common Mistakes

### Mistake 1: Using `handle...with` to apply handlers

❌ **WRONG:**
```unison
handle storage.TaskRepository.run db with
  doSomething()
```

✅ **RIGHT:**
```unison
storage.TaskRepository.run db do
  doSomething()
```

### Mistake 2: Forgetting `do` syntax

❌ **WRONG:**
```unison
storage.TaskRepository.run db
  doSomething()
```

✅ **RIGHT:**
```unison
storage.TaskRepository.run db do
  doSomething()
```

### Mistake 3: Applying handlers in controllers

❌ **WRONG:**
```unison
app.controllers.TaskController.index db = do
  tasks = storage.TaskRepository.run db do  -- Don't do this!
    TaskService.list ()
  -- ...
```

✅ **RIGHT:**
```unison
-- Controller just declares ability
app.controllers.TaskController.index = do
  tasks = TaskService.list ()
  -- ...

-- Handler applied in main
main db req =
  storage.TaskRepository.run db do
    Route.run app.routes req
```

### Mistake 4: Not propagating abilities in type signatures

❌ **WRONG:**
```unison
-- Controller doesn't declare TaskRepository
app.controllers.TaskController.index : '{Route, Exception} ()
app.controllers.TaskController.index = do
  tasks = TaskService.list ()  -- ERROR! TaskRepository not in scope
```

✅ **RIGHT:**
```unison
-- Controller declares TaskRepository
app.controllers.TaskController.index :
  '{Route, Exception, TaskRepository} ()
app.controllers.TaskController.index = do
  tasks = TaskService.list ()  -- Works!
```

## Delayed Computations (`'` syntax)

The `'` prefix creates a delayed computation:

```unison
-- This type means "a computation that will produce [Task] and might use TaskRepository"
listAllTasks : '{TaskRepository} [Task]

-- The computation isn't run immediately
computation = listAllTasks

-- It's run when forced with !
-- Or passed to a handler
```

**When to use `'`:**
- Ability operation return types: `'{TaskRepository} [Task]`
- Passing code to handlers: `handler environment do codeHere`
- Laziness (rare in web apps)

## Summary

**Defining:**
```unison
ability MyRepository where
  operation : Args ->{MyRepository} Result
```

**Using:**
```unison
myService : Args ->{MyRepository} Result
myService args =
  MyRepository.operation args
```

**Implementing:**
```unison
storage.MyRepository.run :
  Database ->
  '{g, MyRepository} a ->
  {g, Remote} a
storage.MyRepository.run db p =
  -- helpers...
  go p = handle !p with cases
    {operation args -> resume} -> go '(resume (doWork args))
    {k} -> k
  go p
```

**Applying:**
```unison
main db req =
  storage.MyRepository.run db do
    Route.run app.routes req
```

**Testing:**
```unison
test> myTest = test.verify do
  storage = Ref.new []
  result = fake.MyRepository.run storage do
    myService args
  ensureEqual result expected
```

**The Key Insight:** Abilities let you write services that don't know HOW things work, only WHAT they need. Handlers provide the HOW. This is the foundation of ports & adapters architecture.
