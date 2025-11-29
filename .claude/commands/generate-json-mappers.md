# /generate-json-mappers

You are generating JSON encoders and decoders for Unison types.

## Step 0: Read JSON Guides

FIRST, read:
- @.claude/skills/json-library.md
- @.claude/skills/json-mapping-patterns.md

## Step 1: Identify the Type

Ask the user:
1. What type needs JSON mappers? (e.g., `Workout`, `User`, `Post`)
2. What are the fields? (or should I view the existing type definition?)

## Step 2: Determine Field Types

For each field, identify:
- Field name
- Field type (Text, Nat, Int, Float, Boolean, Optional, Array, or nested record)

**Example:**
```
Type: Workout
Fields:
  - id : Text
  - name : Text
  - reps : Nat
  - duration : Optional Nat
  - tags : [Text]
```

## Step 3: Generate Encoder

Create encoder using `object.empty` and `|>` chaining:

```unison
<Type>.encoder : <Type> -> Json
<Type>.encoder value =
  object.empty
    |> object.addText "id" value.id
    |> object.addText "name" value.name
    |> object.addNat "reps" value.reps
    -- Handle optionals
    |> (match value.duration with
      Some d -> object.addNat "duration" d
      None -> identity)
    -- Handle arrays
    |> object.addArray "tags" (List.map Json.String value.tags)
```

**Field Type Mapping:**
- `Text` → `object.addText "field" value.field`
- `Nat` → `object.addNat "field" value.field`
- `Int` → `object.addInt "field" value.field`
- `Float` → `object.addFloat "field" value.field`
- `Boolean` → `object.addBoolean "field" value.field`
- `Optional T` → Use match to conditionally add
- `[T]` → `object.addArray "field" (List.map <encoder> value.field)`
- Nested record → `object.add "field" (<NestedType>.encoder value.field)`

Reference: @.claude/skills/json-mapping-patterns.md

Typecheck.

## Step 4: Generate Decoder

Create decoder using `object.at!` for required fields:

```unison
<Type>.decoder : '{Decoder} <Type>
<Type>.decoder = do
  use object at! atOptional
  id = at! "id" Decoder.text
  name = at! "name" Decoder.text
  reps = at! "reps" Decoder.nat
  duration = atOptional "duration" Decoder.nat
  tags = at! "tags" (Decoder.array Decoder.text)
  { id, name, reps, duration, tags }
```

**Field Type Mapping:**
- `Text` → `at! "field" Decoder.text`
- `Nat` → `at! "field" Decoder.nat`
- `Int` → `at! "field" Decoder.int`
- `Float` → `at! "field" Decoder.float`
- `Boolean` → `at! "field" Decoder.boolean`
- `Optional T` → `atOptional "field" <decoder>`
- `[T]` → `at! "field" (Decoder.array <decoder>)`
- Nested record → `at! "field" <NestedType>.decoder`

Reference: @.claude/skills/json-mapping-patterns.md

Typecheck.

## Step 5: Generate Convenience Helpers

Create `encode` and `decode` helpers:

```unison
<Type>.encode : <Type> -> Text
<Type>.encode value = Json.toText (<Type>.encoder value)

<Type>.decode : Text ->{Exception} <Type>
<Type>.decode txt =
  match Json.tryFromText txt with
    Right json ->
      match Decoder.run <Type>.decoder json with
        Right value -> value
        Left err ->
          Exception.raise (failure "Failed to decode <Type>" err)
    Left parseErr ->
      Exception.raise (failure "Failed to parse JSON" parseErr)
```

Typecheck.

## Step 6: Generate Tests

Create round-trip tests:

```unison
test> <Type>.tests.jsonRoundTrip = test.verify do
  original = { id = "123", name = "Test", reps = 10, duration = Some 30, tags = ["tag1"] }
  encoded = <Type>.encode original
  decoded = <Type>.decode encoded
  ensureEqual original decoded

test> <Type>.tests.decodesValidJson = test.verify do
  json = "{\"id\":\"123\",\"name\":\"Test\",\"reps\":10,\"tags\":[\"tag1\"]}"
  result = <Type>.decode json
  ensureEqual result.id "123"
  ensureEqual result.name "Test"
  ensureEqual result.reps 10
```

Typecheck tests.

## Special Cases

### Sum Types / Enums

For simple enums:
```unison
type Status = Active | Inactive | Pending

Status.encoder = cases
  Active -> Json.String "active"
  Inactive -> Json.String "inactive"
  Pending -> Json.String "pending"

Status.decoder = do
  txt = Decoder.text
  match txt with
    "active" -> Active
    "inactive" -> Inactive
    "pending" -> Pending
    _ -> Exception.raise (failure "Invalid status" txt)
```

For tagged unions, use a discriminator field (ask user for tag field name).

### Timestamps

```unison
-- Field: createdAt : Instant
object.addText "createdAt" (Instant.toText value.createdAt)

-- Decoder:
createdAtText = at! "createdAt" Decoder.text
createdAt = match Instant.fromText createdAtText with
  Some instant -> instant
  None -> Exception.raise (failure "Invalid timestamp" createdAtText)
```

## Final Checklist

- [ ] All four functions generated: encoder, decoder, encode, decode
- [ ] Handles all field types correctly
- [ ] Optional fields handled properly
- [ ] All code typechecks
- [ ] Round-trip tests included
- [ ] Error handling in decode function

IMPORTANT: Follow the conventions in @.claude/skills/json-mapping-patterns.md exactly
