# UUID Generation in Unison

## Correct Usage

**Always use `newv4` for generating UUIDs:**

```unison
-- Generate a new UUID and convert to Text
newId = newv4() |> Uuid.toText
```

## Common Mistakes

**DO NOT use these (they don't exist or are ambiguous):**
- `Uuid.new()` - doesn't exist
- `Uuid.newv4()` - doesn't exist
- `GUID.new()` - outdated/ambiguous

## Type Signature

```unison
newv4 : Unit ->{Random} Uuid
Uuid.toText : Uuid -> Text
```

## Ability Requirement

The `newv4` function requires the `Random` ability:

```unison
-- Service that creates entities needs Random ability
MyService.create : CreateInput ->{MyRepository, Random} MyEntity
MyService.create input =
  newId = newv4() |> Uuid.toText
  entity = MyEntity newId ...
  MyRepository.upsert entity
  entity
```

## In Templates

The crud-module.u.hbs template uses:
```handlebars
newId = newv4() |> Uuid.toText
```

And the service signature includes `Random`:
```handlebars
{{pascalCase entityName}}Service.create :
  {{pascalCase entityName}}Service.CreateInput ->
  {{openBrace}}{{pascalCase entityName}}Repository, Random} {{pascalCase entityName}}
```
