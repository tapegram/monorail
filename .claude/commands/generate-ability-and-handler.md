# /generate-ability-and-handler

You are generating a port (ability) and adapter (handler) using the Ports & Adapters architecture.

## Step 1: Gather Requirements

Ask the user:
1. What is the ability name? (e.g., `EmailClient`, `InventoryRepository`, `WeatherApi`)
2. What operations does it need? List each with signature:
   - `sendEmail : Email ->{EmailClient} ()`
   - `getInventory : Text ->{InventoryRepository} (Optional Inventory)`
3. What type of adapter? (Database, Http API, External Service, etc.)
4. Should I generate a fake for testing?

## Step 2: Create Scratch File

Create file: `<ability-name>-port-adapter.u`

## Step 3: Generate Ability (Port)

Define the ability with all operations:

```unison
ability <Name> where
  operation1 : Input1 ->{<Name>} Output1
  operation2 : Input2 ->{<Name>} Output2
  -- ... more operations
```

**Example:**
```unison
ability WeatherApi where
  getCurrentWeather : City ->{WeatherApi} Weather
  getForecast : City -> Days ->{WeatherApi} [Weather]
```

Typecheck.

## Step 4: Generate Adapter (Handler)

Generate the `.run` handler based on adapter type:

### For Database Adapters (using OrderedTable):

```unison
<Name>.run : Database -> '{g, <Name>} a -> {g, Remote} a
<Name>.run db p =
  table = OrderedTable.named db "<tableName>" Universal.ordering

  go : '{g, <Name>} a -> {g, Remote} a
  go p = handle !p with cases
    {operation1 input -> resume} ->
      -- Database operation
      result = todo "Implement database operation"
      go '(resume result)

    {operation2 input -> resume} ->
      result = todo "Implement database operation"
      go '(resume result)

    {k} -> k

  go p
```

Reference: @.claude/templates/repository-adapter.u

### For HTTP API Adapters:

```unison
<Name>.run : Text -> '{g, <Name>} a -> {g, Http, Exception} a
<Name>.run baseUrl p =
  go : '{g, <Name>} a -> {g, Http, Exception} a
  go p = handle !p with cases
    {operation1 input -> resume} ->
      uri = fromPath (root / "endpoint") |> URI.https |> URI.withHost baseUrl
      req = HttpRequest.get uri |> HttpRequest.addHeader "Accept" "application/json"
      resp = Http.request req
      _ = ensureSuccess resp
      result = ResultType.decode (HttpResponse.bodyText resp)
      go '(resume result)

    {k} -> k

  go p
```

Reference: @.claude/templates/api-client.u

### For Other Adapters:

Ask user what external dependencies are needed and generate accordingly.

Typecheck.

## Step 5: Generate Fake Adapter (if requested)

Create in-memory fake for testing:

```unison
<Name>.fake : <State> -> '{g, <Name>} a -> {g} a
<Name>.fake state p =
  go p = handle !p with cases
    {operation1 input -> resume} ->
      -- Implement simple in-memory behavior
      result = <fake implementation using state>
      go '(resume result)

    {operation2 input -> resume} ->
      result = <fake implementation using state>
      go '(resume result)

    {k} -> k

  go p
```

**Example for Repository Fake:**
```unison
UserRepository.fake : Ref [User] -> '{g, UserRepository} a -> {g} a
UserRepository.fake storage p =
  go p = handle !p with cases
    {get id -> resume} ->
      users = Ref.read storage
      result = List.find (u -> u.id == id) users
      go '(resume result)

    {listAll _ -> resume} ->
      users = Ref.read storage
      go '(resume users)

    {upsert user -> resume} ->
      users = Ref.read storage
      filtered = List.filter (u -> u.id != user.id) users
      Ref.write storage (user +: filtered)
      go '(resume ())

    {delete id -> resume} ->
      users = Ref.read storage
      filtered = List.filter (u -> u.id != id) users
      Ref.write storage filtered
      go '(resume ())

    {k} -> k

  go p
```

Typecheck fake.

## Step 6: Summary and Next Steps

Tell the user:

1. "Generated the following in `<ability-name>-port-adapter.u`:"
   - Ability definition: `ability <Name> where ...`
   - Real adapter: `<Name>.run`
   - (If requested) Fake adapter: `<Name>.fake`

2. "To use this port in a service:"
   ```unison
   MyService.doSomething : Input ->{<Name>} Output
   MyService.doSomething input =
     result = <Name>.operation1 input
     -- ... business logic
     result
   ```

3. "To run the service with the real adapter:"
   ```unison
   handle MyService.doSomething input with <Name>.run <config>
   ```

4. "To test the service with the fake:"
   ```unison
   test> MyService.tests.doSomething = test.verify do
     state = Ref.new []
     result = handle MyService.doSomething input with <Name>.fake state
     ensureEqual result expected
   ```

5. Ask: "Would you like me to generate a service that uses this ability? Or generate tests?"

## Design Principles

- **Ports (Abilities)** define WHAT operations are needed
- **Adapters (Handlers)** define HOW those operations are implemented
- **Services** depend on ports, not adapters
- **Tests** use fake adapters for fast, isolated testing
- **Main/Controllers** wire up services with real adapters

Reference: @.claude/skills/app-architecture-example.md

## Final Checklist

- [ ] Ability definition is clear and focused
- [ ] Adapter handles all ability operations
- [ ] Adapter matches the appropriate type (Database, Http, etc.)
- [ ] Fake generated if requested
- [ ] All code typechecks
- [ ] Next steps provided to user
