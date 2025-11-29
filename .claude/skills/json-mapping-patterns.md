# JSON Mapping Patterns

This guide provides common patterns and best practices for JSON encoding/decoding in the Unison web framework.

## Standard Naming Conventions

For any type `Foo`:

- `Foo.encoder : Foo -> Json` — Converts Unison value to JSON
- `Foo.decoder : '{Decoder} Foo` — Parses JSON to Unison value
- `Foo.encode : Foo -> Text` — Convenience: Unison → JSON text
- `Foo.decode : Text ->{Exception} Foo` — Convenience: JSON text → Unison

## Pattern 1: Simple Record

**Input:**
```unison
type User = { id : Text, name : Text, email : Text }
```

**Output:**
```unison
User.encoder : User -> Json
User.encoder user =
  object.empty
    |> object.addText "id" user.id
    |> object.addText "name" user.name
    |> object.addText "email" user.email

User.decoder : '{Decoder} User
User.decoder = do
  use object at!
  id = at! "id" Decoder.text
  name = at! "name" Decoder.text
  email = at! "email" Decoder.text
  { id, name, email }

User.encode user = Json.toText (User.encoder user)

User.decode txt =
  match Json.tryFromText txt with
    Right json ->
      match Decoder.run User.decoder json with
        Right user -> user
        Left err -> Exception.raise (failure "Decoder error" err)
    Left parseErr -> Exception.raise (failure "JSON parse error" parseErr)
```

## Pattern 2: Optional Fields

**Input:**
```unison
type Profile =
  { id : Text
  , bio : Optional Text
  , avatar : Optional Text
  }
```

**Output:**
```unison
Profile.encoder : Profile -> Json
Profile.encoder profile =
  base = object.empty |> object.addText "id" profile.id
  withBio = match profile.bio with
    Some bio -> base |> object.addText "bio" bio
    None -> base
  match profile.avatar with
    Some avatar -> withBio |> object.addText "avatar" avatar
    None -> withBio

Profile.decoder : '{Decoder} Profile
Profile.decoder = do
  use object at! atOptional
  id = at! "id" Decoder.text
  bio = atOptional "bio" Decoder.text
  avatar = atOptional "avatar" Decoder.text
  { id, bio, avatar }
```

## Pattern 3: Nested Objects

**Input:**
```unison
type Address = { street : Text, city : Text, zip : Text }
type Person = { name : Text, address : Address }
```

**Output:**
```unison
Address.encoder : Address -> Json
Address.encoder addr =
  object.empty
    |> object.addText "street" addr.street
    |> object.addText "city" addr.city
    |> object.addText "zip" addr.zip

Address.decoder : '{Decoder} Address
Address.decoder = do
  use object at!
  street = at! "street" Decoder.text
  city = at! "city" Decoder.text
  zip = at! "zip" Decoder.text
  { street, city, zip }

Person.encoder : Person -> Json
Person.encoder person =
  object.empty
    |> object.addText "name" person.name
    |> object.add "address" (Address.encoder person.address)

Person.decoder : '{Decoder} Person
Person.decoder = do
  use object at!
  name = at! "name" Decoder.text
  address = at! "address" Address.decoder
  { name, address }
```

## Pattern 4: Arrays of Records

**Input:**
```unison
type Task = { id : Text, title : Text, done : Boolean }
type TaskList = { tasks : [Task] }
```

**Output:**
```unison
Task.encoder : Task -> Json
Task.encoder task =
  object.empty
    |> object.addText "id" task.id
    |> object.addText "title" task.title
    |> object.addBoolean "done" task.done

Task.decoder : '{Decoder} Task
Task.decoder = do
  use object at!
  id = at! "id" Decoder.text
  title = at! "title" Decoder.text
  done = at! "done" Decoder.boolean
  { id, title, done }

TaskList.encoder : TaskList -> Json
TaskList.encoder list =
  object.empty
    |> object.addArray "tasks" (List.map Task.encoder list.tasks)

TaskList.decoder : '{Decoder} TaskList
TaskList.decoder = do
  use object at!
  tasks = at! "tasks" (Decoder.array Task.decoder)
  { tasks }
```

## Pattern 5: Sum Types / Tagged Unions

**Input:**
```unison
type PaymentMethod
  = CreditCard Text -- card number
  | PayPal Text -- email
  | BankTransfer Text Text -- account, routing
```

**Output:**
```unison
PaymentMethod.encoder : PaymentMethod -> Json
PaymentMethod.encoder = cases
  CreditCard num ->
    object.empty
      |> object.addText "type" "credit_card"
      |> object.addText "cardNumber" num
  PayPal email ->
    object.empty
      |> object.addText "type" "paypal"
      |> object.addText "email" email
  BankTransfer account routing ->
    object.empty
      |> object.addText "type" "bank_transfer"
      |> object.addText "account" account
      |> object.addText "routing" routing

PaymentMethod.decoder : '{Decoder} PaymentMethod
PaymentMethod.decoder = do
  use object at!
  typeTag = at! "type" Decoder.text
  match typeTag with
    "credit_card" ->
      cardNumber = at! "cardNumber" Decoder.text
      CreditCard cardNumber
    "paypal" ->
      email = at! "email" Decoder.text
      PayPal email
    "bank_transfer" ->
      account = at! "account" Decoder.text
      routing = at! "routing" Decoder.text
      BankTransfer account routing
    _ -> Exception.raise (failure "Invalid payment method type" typeTag)
```

## Pattern 6: Simple Enums

**Input:**
```unison
type Status = Active | Inactive | Pending
```

**Output:**
```unison
Status.encoder : Status -> Json
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

## Pattern 7: Timestamps

**Input:**
```unison
type Event = { id : Text, occurredAt : Instant }
```

**Output:**
```unison
Event.encoder : Event -> Json
Event.encoder event =
  object.empty
    |> object.addText "id" event.id
    |> object.addText "occurredAt" (Instant.toText event.occurredAt)

Event.decoder : '{Decoder} Event
Event.decoder = do
  use object at!
  id = at! "id" Decoder.text
  occurredAtText = at! "occurredAt" Decoder.text
  occurredAt = match Instant.fromText occurredAtText with
    Some instant -> instant
    None -> Exception.raise (failure "Invalid timestamp" occurredAtText)
  { id, occurredAt }
```

## Pattern 8: ID Fields

**Default Rule:** All ID fields are `Text` unless explicitly requested otherwise.

```unison
type Entity = { id : Text, name : Text }

-- NOT this (unless requested):
-- type EntityId = EntityId Text
-- type Entity = { id : EntityId, name : Text }
```

## Pattern 9: Numbers (Nat, Int, Float)

```unison
type Stats = { views : Nat, score : Int, rating : Float }

Stats.encoder : Stats -> Json
Stats.encoder stats =
  object.empty
    |> object.addNat "views" stats.views
    |> object.addInt "score" stats.score
    |> object.addFloat "rating" stats.rating

Stats.decoder : '{Decoder} Stats
Stats.decoder = do
  use object at!
  views = at! "views" Decoder.nat
  score = at! "score" Decoder.int
  rating = at! "rating" Decoder.float
  { views, score, rating }
```

## Pattern 10: Lists of Primitives

```unison
type Tags = { tags : [Text] }

Tags.encoder : Tags -> Json
Tags.encoder t =
  object.empty
    |> object.addArray "tags" (List.map Json.String t.tags)

Tags.decoder : '{Decoder} Tags
Tags.decoder = do
  use object at!
  tags = at! "tags" (Decoder.array Decoder.text)
  { tags }
```

## Testing Pattern

Every JSON mapper should have a round-trip test:

```unison
test> MyType.tests.jsonRoundTrip = test.verify do
  original = { id = "123", name = "Test", count = 42 }
  encoded = MyType.encode original
  decoded = MyType.decode encoded
  ensureEqual original decoded

test> MyType.tests.decodesValidJson = test.verify do
  json = "{\"id\":\"123\",\"name\":\"Test\",\"count\":42}"
  result = MyType.decode json
  ensureEqual result.id "123"
  ensureEqual result.name "Test"
  ensureEqual result.count 42
```

## Error Handling Best Practices

1. **Always use proper error messages:**
   ```unison
   Exception.raise (failure "Failed to decode User" err)
   ```

2. **Include context in error messages:**
   ```unison
   Exception.raise (failure ("Invalid enum value: " ++ txt) txt)
   ```

3. **Test error cases:**
   ```unison
   test> MyType.tests.rejectsInvalidJson = test.verify do
     invalidJson = "{not valid json"
     match MyType.decode invalidJson with
       _ -> test.fail "Should have raised exception"
   ```

## Code Generation Rules

When generating JSON mappers:

1. Always generate all four functions: encoder, decoder, encode, decode
2. Use `object.empty` and `|>` chaining for encoders
3. Use `object.at!` pattern for required fields
4. Use `object.atOptional` for optional fields
5. Include proper error handling in decode function
6. Generate round-trip tests
7. Keep IDs as `Text` unless told otherwise
8. Use descriptive discriminator fields for sum types ("type", "kind", "tag")
