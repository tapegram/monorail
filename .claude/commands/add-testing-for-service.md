# /add-testing-for-service

You are creating TDD-first use-case-level tests for a Unison service.

Follow these exact steps:

## Step 0: Read Testing Guide

FIRST, read the testing guide: @.claude/skills/testing.md

## Step 1: Identify Service and Dependencies

Ask the user:
1. Which service are we testing? (e.g., `WorkoutService`)
2. Which use case/function? (e.g., `create`, `update`, `delete`)
3. What abilities does it depend on? (e.g., `WorkoutRepository`, `UuidGenerator`, `Clock`)

## Step 2: Create Fake Ports

For each ability dependency, create a fake (in-memory) implementation:

```unison
<Ability>.fake : <State> -> '{g, <Ability>} a -> {g} a
<Ability>.fake state p =
  go p = handle !p with cases
    {operation input -> resume} ->
      -- Implement fake behavior using state
      result = <fake implementation>
      go '(resume result)
    {k} -> k
  go p
```

**Example for Repository:**
```unison
WorkoutRepository.fake : Ref [Workout] -> '{g, WorkoutRepository} a -> {g} a
WorkoutRepository.fake storage p =
  go p = handle !p with cases
    {get id -> resume} ->
      workouts = Ref.read storage
      result = List.find (w -> w.id == id) workouts
      go '(resume result)

    {listAll _ -> resume} ->
      workouts = Ref.read storage
      go '(resume workouts)

    {upsert workout -> resume} ->
      workouts = Ref.read storage
      filtered = List.filter (w -> w.id != workout.id) workouts
      Ref.write storage (workout +: filtered)
      go '(resume ())

    {delete id -> resume} ->
      workouts = Ref.read storage
      filtered = List.filter (w -> w.id != id) workouts
      Ref.write storage filtered
      go '(resume ())

    {k} -> k
  go p
```

**Example for UuidGenerator:**
```unison
UuidGenerator.fake : Text -> '{g, UuidGenerator} a -> {g} a
UuidGenerator.fake fixedId p =
  handle !p with cases
    {new _ -> resume} -> resume fixedId
    {k} -> k
```

Typecheck fake ports.

## Step 3: Write Test Cases

Write `test>` watch expressions for each scenario:

```unison
test> <Service>.tests.<usecase>.<scenario> = test.verify do
  -- Setup fake dependencies
  storage = Ref.new []
  fixedId = "test-id-123"

  -- Execute service function with fakes
  result = handle
    handle <Service>.<usecase> <input>
      with <Ability1>.fake <fake1State>
    with <Ability2>.fake <fake2State>

  -- Assertions
  ensureEqual result.id fixedId
  ensureEqual result.name "Expected Name"

  -- Verify side effects
  finalState = Ref.read storage
  ensureEqual (List.length finalState) 1
```

**Test Naming Convention:**
- `<Service>.tests.<usecase>.success` - Happy path
- `<Service>.tests.<usecase>.notFound` - Error case
- `<Service>.tests.<usecase>.invalidInput` - Validation case

**Example Tests:**
```unison
test> WorkoutService.tests.create.success = test.verify do
  storage = Ref.new []
  fixedId = "workout-123"

  input = { name = "Push ups", reps = 10 }

  workout = handle
    handle WorkoutService.create input
      with WorkoutRepository.fake storage
    with UuidGenerator.fake fixedId

  ensureEqual workout.id fixedId
  ensureEqual workout.name "Push ups"
  ensureEqual workout.reps 10

  workouts = Ref.read storage
  ensureEqual (List.length workouts) 1

test> WorkoutService.tests.delete.notFound = test.verify do
  storage = Ref.new []

  match handle WorkoutService.delete "nonexistent" with WorkoutRepository.fake storage with
    Left err -> () -- Expected to fail
    Right _ -> test.fail "Should have raised exception"
```

Reference: @.claude/skills/testing.md

Typecheck all tests.

## Step 4: Run Tests

Provide UCM command to run tests:
```
load <test-file>.u
test
```

Or to watch specific tests:
```
> <Service>.tests.<usecase>.<scenario>
```

## Step 5: Implement Service (if not already done)

If the service function doesn't exist yet, now implement it to make the tests pass.

Follow the TDD cycle:
1. Write failing test
2. Implement minimal code to pass
3. Refactor if needed
4. Repeat

## Testing Best Practices

1. **Test services, not adapters** - Adapters are implementation details
2. **Use fake ports, not real dependencies** - Keep tests fast and isolated
3. **Test use cases, not implementation** - Focus on behavior, not internals
4. **Name tests descriptively** - `<Service>.tests.<usecase>.<scenario>`
5. **Test happy path AND error cases** - Don't just test success
6. **Keep tests independent** - Each test should set up its own state

## Common Assertions

```unison
ensureEqual actual expected
ensure (condition)
test.fail "message"
test.verify do ...
```

## Final Checklist

- [ ] Fake ports created for all abilities
- [ ] Happy path test written
- [ ] Error cases tested
- [ ] All tests typecheck
- [ ] Tests are independent
- [ ] UCM test command provided
