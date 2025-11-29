# generate-ability-and-handler

## Purpose

Create a clean ability (port) and corresponding `.run` implementation (adapter)
using the Ports & Adapters architecture.

## Inputs

- Ability name (e.g., `EmailClient` or `InventoryRepository`)
- List of operations, e.g.:

```unison
sendEmail : Email ->{EmailClient} ()
getInventory : Text ->{InventoryRepository} (Optional Inventory)
```

## Output

- Ability file in `app.ports`
- Handler file in `app.adapters.<category>`
- Optional in-memory fake for testing
- TDD guidance (service test-first)

## Behavior

1. **Generate ability definition**

```unison
ability <Name> where
  op1 : Input1 ->{<Name>} Output1
  op2 : Input2 ->{<Name>} Output2
```

2. **Generate adapter skeleton**
   Adapter must:
   - Live in `app.adapters.<category>.<Name>Adapter`
   - Accept environment config (Databse, Http, Cloud, etc.)
   - Handle each ability constructor via pattern matching.

   Example:

   ```unison
   <Name>.run env p =
   go p = handle !p with cases
    {op1 x -> resume} ->
      -- adapter logic here
      result = todo "Implement op1"
      go '(resume result)

    {op2 y -> resume} ->
      result = todo "Implement op2"
      go '(resume result)

    {k} -> k
   go p
   ```

3. ** Generate optional fake adapter**

   Useful for unit tests:

   ```unison
   <Name>.fake : '{g, <Name>} a -> a
   <Name>.fake p =
    handle !p with cases
      {op1 _ -> resume} -> resume defaultValue
      {op2 _ -> resume} -> resume defaultValue
      {k} -> k
   ```

4. **Typecheck**
   - Ensure both ability and handler compile
   - Ask user if they want to auto-create a service or tests

5. **Testing note**
   - Encourage service-centric tests using the fake adapter.
