# generate-json-mappers

## Purpose

Produce JSON encoders, decoders, and convenience helpers for a given Unison
record type. This command enables consistent, reliable JSON <-> domain
transformations.

## Inputs

- Fully qualified type name (e.g., `app.domain.Workout`)
- Optional explicit list of fields (required if type cannot be derived)

## Output

- `<Type>.encoder : Type -> Json`
- `<Type>.decoder : '{Decoder} Type`
- `<Type>.encode  : Type -> Text`
- `<Type>.decode  : Text ->{Exception} Type`

## Behavior

1. **Read project JSON rules**
   - Use the JSON library conventions in `.claude/skills/json-library.md`.
   - Use patterns from `.claude/skills/json-mapping-patterns.md`.

2. **Determine fields**
   - Inspect the type definition if provided in the prompt or context.
   - If not available, prompt the user for the field list.

3. **Generate encoder**
   Using `object.empty` and add\* functions:

   ```unison
   <Type>.encoder value =
     object.empty
       |> addText "id" value.id
       |> addText "name" value.name
       |> ...
   ```

4. **Generate decorder**
   Using `object.at!` and Decoder primitives:

   ```unison
    <Type>.decoder = do
      use object at!
      id   = at! "id" Decoder.text
      name = at! "name" Decoder.text
      { id, name }
   ```

5. **Generate encode/decode helpers**

```unison
<Type>.encode value = Json.toText (<Type>.encoder value)

<Type>.decode txt =
  case core.Json.tryFromText txt of
    Right json ->
      match Decoder.run <Type>.decoder json with
        Right v -> v
        Left err -> Exception.throw err
    Left parseErr -> Exception.throw parseErr
```

6. **Validation**
   - Typecheck generated code.
   - Display final code for approval
