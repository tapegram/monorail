# /generate-api-client

You are generating an HTTP API client using abilities (ports) and handlers (adapters).

## Step 0: Read API Client Patterns

FIRST, read:
- @.claude/skills/api-client-patterns.md
- @.claude/skills/http-library.md

## Step 1: Gather Requirements

Ask the user:
1. What is the client name? (e.g., `PostClient`, `WeatherApi`, `StripeClient`)
2. What is the base URL? (e.g., `"api.example.com"`)
3. Use HTTP or HTTPS? (default: HTTPS)
4. What endpoints does it need? For each, specify:
   - HTTP method (GET, POST, PUT, DELETE)
   - Path (e.g., `/posts/{id}`, `/users`)
   - Request body type (if POST/PUT)
   - Response type

**Example:**
```
Client: PostClient
Base URL: jsonplaceholder.typicode.com
Protocol: HTTPS

Endpoints:
- GET /posts/{id} -> Post
- GET /posts -> [Post]
- POST /posts <- CreatePostInput -> Post
- DELETE /posts/{id} -> ()
```

## Step 2: Create Scratch File

Create file: `<client-name>-api.u`

## Step 3: Generate Ability Definition

Define ability with one operation per endpoint:

```unison
ability <ClientName> where
  getItem : Text ->{<ClientName>} Item
  listItems : '{<ClientName>} [Item]
  createItem : CreateInput ->{<ClientName>} Item
  deleteItem : Text ->{<ClientName>} ()
```

**Naming Convention:**
- GET single item: `get<Entity>`
- GET list: `list<Entities>`
- POST: `create<Entity>`
- PUT: `update<Entity>`
- DELETE: `delete<Entity>`

Typecheck.

## Step 4: Check JSON Mappers

For each request/response type, verify JSON mappers exist:
- `<Type>.encode : <Type> -> Text`
- `<Type>.decode : Text ->{Exception} <Type>`

If missing, ask user: "Should I generate JSON mappers for these types?"

If yes, use `/generate-json-mappers` for each type.

## Step 5: Generate HTTP Handler

Create the `.run` handler following this exact pattern:

```unison
<ClientName>.run : Text -> '{g, <ClientName>} a -> {g, Http, Exception} a
<ClientName>.run baseUrl p =
  go : '{g, <ClientName>} a -> {g, Http, Exception} a
  go p = handle !p with cases
    {getItem id -> resume} ->
      uri = fromPath (root / "items" / id)
            |> URI.https
            |> URI.withHost baseUrl

      req = HttpRequest.get uri
            |> HttpRequest.addHeader "Accept" "application/json"

      resp = Http.request req
      _ = ensureSuccess resp
      body = HttpResponse.bodyText resp
      item = Item.decode body

      go '(resume item)

    {listItems _ -> resume} ->
      uri = fromPath (root / "items")
            |> URI.https
            |> URI.withHost baseUrl

      req = HttpRequest.get uri
            |> HttpRequest.addHeader "Accept" "application/json"

      resp = Http.request req
      _ = ensureSuccess resp
      body = HttpResponse.bodyText resp
      items = ItemList.decode body

      go '(resume items)

    {createItem input -> resume} ->
      uri = fromPath (root / "items")
            |> URI.https
            |> URI.withHost baseUrl

      requestBody = Body.fromText (CreateInput.encode input)

      req = HttpRequest.post uri requestBody
            |> HttpRequest.addHeader "Content-Type" "application/json"
            |> HttpRequest.addHeader "Accept" "application/json"

      resp = Http.request req
      _ = ensureSuccess resp
      body = HttpResponse.bodyText resp
      item = Item.decode body

      go '(resume item)

    {deleteItem id -> resume} ->
      uri = fromPath (root / "items" / id)
            |> URI.https
            |> URI.withHost baseUrl

      req = HttpRequest.delete uri

      resp = Http.request req
      _ = ensureSuccess resp

      go '(resume ())

    {k} -> k

  go p
```

**Important Patterns:**
- Use `fromPath (root / "segment" / variable)` for building paths
- Use `URI.https` or `URI.http` based on requirements
- Use `URI.withHost baseUrl` to set the host
- Always add `Accept: application/json` header
- For POST/PUT, add `Content-Type: application/json` header
- Use `ensureSuccess resp` to validate status codes
- Decode responses with `<Type>.decode body`
- Encode requests with `<Type>.encode value`

Reference: @.claude/templates/api-client.u

Typecheck.

## Step 6: Generate Usage Example

Show the user how to use the client:

```unison
-- Using the API client
example : '{Http, Exception} Post
example = do
  baseUrl = "jsonplaceholder.typicode.com"

  post = handle PostClient.getPost "1" with PostClient.run baseUrl

  posts = handle PostClient.listPosts() with PostClient.run baseUrl

  newPost = { title = "New Post", body = "Content" }
  created = handle PostClient.createPost newPost with PostClient.run baseUrl

  post
```

## Step 7: Generate Fake for Testing

Create a fake adapter for testing (no real HTTP calls):

```unison
<ClientName>.fake : <State> -> '{g, <ClientName>} a -> {g} a
<ClientName>.fake state p =
  handle !p with cases
    {getItem id -> resume} ->
      -- Return fake data
      resume { id, name = "Fake Item" }

    {listItems _ -> resume} ->
      resume []

    {createItem input -> resume} ->
      resume { id = "fake-id", name = input.name }

    {deleteItem _ -> resume} ->
      resume ()

    {k} -> k
```

Typecheck.

## Step 8: Generate Tests

Create tests using the fake:

```unison
test> <ClientName>.tests.getItem.success = test.verify do
  fakeState = ()
  item = handle <ClientName>.getItem "123" with <ClientName>.fake fakeState
  ensureEqual item.id "123"
```

## Special Cases

### Query Parameters

For endpoints with query params like `/search?q=term&limit=10`:

```unison
uri = fromPath (root / "search")
      |> URI.https
      |> URI.withHost baseUrl
      |> URI.addQueryParam "q" query
      |> URI.addQueryParam "limit" (Nat.toText limit)
```

### Authentication Headers

For APIs requiring auth:

```unison
req = HttpRequest.get uri
      |> HttpRequest.addHeader "Authorization" ("Bearer " ++ token)
      |> HttpRequest.addHeader "Accept" "application/json"
```

### Custom Error Handling

```unison
resp = Http.request req
match HttpResponse.statusCode resp with
  200 -> Item.decode (HttpResponse.bodyText resp)
  404 -> Exception.raise (failure "Item not found" id)
  _ -> Exception.raise (failure "API error" (Nat.toText (HttpResponse.statusCode resp)))
```

## Final Checklist

- [ ] Ability defines all operations clearly
- [ ] Handler implements all ability operations
- [ ] URIs built correctly with fromPath and URI helpers
- [ ] JSON encoding/decoding for all request/response types
- [ ] Proper HTTP headers set
- [ ] Error handling with ensureSuccess
- [ ] Fake adapter for testing
- [ ] Usage example provided
- [ ] All code typechecks

Reference:
- @.claude/skills/api-client-patterns.md
- @.claude/skills/http-library.md
- @.claude/templates/api-client.u
