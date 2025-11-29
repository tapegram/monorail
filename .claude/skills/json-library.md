# JSON Library Guide

This guide covers the Unison JSON library (`@unison/json`) patterns and conventions.

## Core Types

```unison
type Json = -- from the JSON library
  | Object (Map Text Json)
  | Array [Json]
  | String Text
  | Number Float
  | Boolean Boolean
  | Null
```

## Encoding (Unison → JSON)

### Object Builder Pattern

Use `object.empty` and `add*` functions to build JSON objects:

```unison
type Person = { id : Text, name : Text, age : Nat }

Person.encoder : Person -> Json
Person.encoder person =
  object.empty
    |> object.addText "id" person.id
    |> object.addText "name" person.name
    |> object.addNat "age" person.age
```

### Available Add Functions

- `object.addText : Text -> Text -> Json -> Json`
- `object.addNat : Text -> Nat -> Json -> Json`
- `object.addInt : Text -> Int -> Json -> Json`
- `object.addFloat : Text -> Float -> Json -> Json`
- `object.addBoolean : Text -> Boolean -> Json -> Json`
- `object.add : Text -> Json -> Json -> Json` (for nested objects)
- `object.addArray : Text -> [Json] -> Json -> Json`

### Encoding Optional Fields

```unison
Person.encoder person =
  use object addOptional
  object.empty
    |> object.addText "id" person.id
    |> addOptional "email" person.email (cases
      Some email -> Some (Json.String email)
      None -> None)
```

### Encoding Arrays

```unison
People.encoder : [Person] -> Json
People.encoder people =
  Json.Array (List.map Person.encoder people)
```

### Top-Level Encode Helper

```unison
Person.encode : Person -> Text
Person.encode person =
  Json.toText (Person.encoder person)
```

## Decoding (JSON → Unison)

### Decoder Ability

The `Decoder` ability provides the parsing context:

```unison
ability Decoder where
  -- Various decoder primitives
```

### Object Decoder Pattern

Use `object.at!` to extract fields:

```unison
Person.decoder : '{Decoder} Person
Person.decoder = do
  use object at!
  id = at! "id" Decoder.text
  name = at! "name" Decoder.text
  age = at! "age" Decoder.nat
  { id, name, age }
```

### Available Decoder Primitives

- `Decoder.text : '{Decoder} Text`
- `Decoder.nat : '{Decoder} Nat`
- `Decoder.int : '{Decoder} Int`
- `Decoder.float : '{Decoder} Float`
- `Decoder.boolean : '{Decoder} Boolean`
- `Decoder.array : '{Decoder} a -> '{Decoder} [a]`

### Decoding Optional Fields

```unison
Person.decoder = do
  use object at! atOptional
  id = at! "id" Decoder.text
  email = atOptional "email" Decoder.text
  { id, email }
```

### Decoding Arrays

```unison
People.decoder : '{Decoder} [Person]
People.decoder =
  Decoder.array Person.decoder
```

### Top-Level Decode Helper

```unison
Person.decode : Text ->{Exception} Person
Person.decode txt =
  match Json.tryFromText txt with
    Right json ->
      match Decoder.run Person.decoder json with
        Right person -> person
        Left err -> Exception.raise (failure "Decoder error" err)
    Left parseErr ->
      Exception.raise (failure "JSON parse error" parseErr)
```

## Complete Example

```unison
type Workout =
  { id : Text
  , name : Text
  , exercises : [Text]
  , duration : Optional Nat
  }

Workout.encoder : Workout -> Json
Workout.encoder w =
  use object addOptional
  base =
    object.empty
      |> object.addText "id" w.id
      |> object.addText "name" w.name
      |> object.addArray "exercises" (List.map Json.String w.exercises)
  match w.duration with
    Some d -> base |> object.addNat "duration" d
    None -> base

Workout.decoder : '{Decoder} Workout
Workout.decoder = do
  use object at! atOptional
  id = at! "id" Decoder.text
  name = at! "name" Decoder.text
  exercises = at! "exercises" (Decoder.array Decoder.text)
  duration = atOptional "duration" Decoder.nat
  { id, name, exercises, duration }

Workout.encode : Workout -> Text
Workout.encode w = Json.toText (Workout.encoder w)

Workout.decode : Text ->{Exception} Workout
Workout.decode txt =
  match Json.tryFromText txt with
    Right json ->
      match Decoder.run Workout.decoder json with
        Right w -> w
        Left err -> Exception.raise (failure "Decoder error" err)
    Left parseErr ->
      Exception.raise (failure "JSON parse error" parseErr)
```

## Common Patterns

### Nested Objects

```unison
type Address = { street : Text, city : Text }
type Person = { name : Text, address : Address }

Address.encoder addr =
  object.empty
    |> object.addText "street" addr.street
    |> object.addText "city" addr.city

Person.encoder person =
  object.empty
    |> object.addText "name" person.name
    |> object.add "address" (Address.encoder person.address)

Address.decoder = do
  use object at!
  street = at! "street" Decoder.text
  city = at! "city" Decoder.text
  { street, city }

Person.decoder = do
  use object at!
  name = at! "name" Decoder.text
  address = at! "address" Address.decoder
  { name, address }
```

### Sum Types (Union Types)

Use a discriminator field:

```unison
type Status = Active | Inactive | Pending

Status.encoder = cases
  Active -> Json.String "active"
  Inactive -> Json.String "inactive"
  Pending -> Json.String "pending"

Status.decoder : '{Decoder} Status
Status.decoder = do
  txt = Decoder.text
  match txt with
    "active" -> Active
    "inactive" -> Inactive
    "pending" -> Pending
    _ -> Exception.raise (failure "Invalid status" txt)
```

## Error Handling

Always use proper error handling in decode functions:

```unison
MyType.decode : Text ->{Exception} MyType
MyType.decode txt =
  match Json.tryFromText txt with
    Right json ->
      match Decoder.run MyType.decoder json with
        Right value -> value
        Left err ->
          Exception.raise (failure "Failed to decode MyType" err)
    Left parseErr ->
      Exception.raise (failure "Failed to parse JSON" parseErr)
```

## Testing JSON Mappers

```unison
test> MyType.tests.roundTrip = test.verify do
  original = { id = "123", name = "Test" }
  encoded = MyType.encode original
  decoded = MyType.decode encoded
  ensureEqual original decoded
```

## References

- Official JSON library: `@unison/json`
- Decoder documentation: Use `docs Decoder` in UCM
- Object utilities: Use `docs object` in UCM
