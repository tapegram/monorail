# /generate-json-mappers

You are generating JSON encoders and decoders for Unison types.

**IMPORTANT:** Follow efficient code generation from @.claude/skills/efficient-code-generation.md
- Generate encoder/decoder fields programmatically
- Use targeted edits for customization
- Minimize streaming boilerplate

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

**EFFICIENT APPROACH:** Build encoder fields programmatically

For each field, generate the appropriate line based on type:

**Generated encoder:**
```unison
<Type>.encoder : <Type> -> Json
<Type>.encoder value =
  object.empty
    <GENERATED_ENCODER_FIELDS>
```

Where `<GENERATED_ENCODER_FIELDS>` is built by mapping each field:
- Text field → `|> object.addText "field" value.field`
- Nat field → `|> object.addNat "field" value.field`
- Optional field → `|> (match value.field with Some v -> object.addNat "field" v; None -> identity)`

**Teaching:**
```
Encoder pattern:
- Start with object.empty
- Chain field additions with |>
- Each field type has specific add function
- Optionals use match to conditionally add
```

Typecheck.

## Step 4: Generate Decoder

**EFFICIENT APPROACH:** Build decoder fields programmatically

For each field, generate the appropriate line based on type:

**Generated decoder:**
```unison
<Type>.decoder : '{Decoder} <Type>
<Type>.decoder = do
  use object at! atOptional
  <GENERATED_DECODER_FIELDS>
  { <field1>, <field2>, ... }
```

Where `<GENERATED_DECODER_FIELDS>` is built by mapping each field:
- Text field → `field = at! "field" Decoder.text`
- Nat field → `field = at! "field" Decoder.nat`
- Optional field → `field = atOptional "field" Decoder.nat`

**Teaching:**
```
Decoder pattern:
- Use `at!` for required fields (fails if missing)
- Use `atOptional` for optional fields (returns Optional)
- Final line constructs the record
- Decoder runs in a do block
```

Typecheck.

## Step 5: Generate Convenience Helpers

**EFFICIENT APPROACH:** These are standard, just substitute type name

Generate directly:

```unison
<Type>.encode : <Type> -> Text
<Type>.encode value = Json.toText (<Type>.encoder value)

<Type>.decode : Text ->{Exception} <Type>
<Type>.decode txt =
  match Json.tryFromText txt with
    Right json ->
      match Decoder.run <Type>.decoder json with
        Right value -> value
        Left err -> Exception.raise (failure "Failed to decode <Type>" err)
    Left parseErr -> Exception.raise (failure "Failed to parse JSON" parseErr)
```

**Teaching:**
```
Helper functions:
- encode: Type → Text (convenience for encoder + Json.toText)
- decode: Text → Type (handles JSON parse + decoder errors)

These are standard for every type!
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
