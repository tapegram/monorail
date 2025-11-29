# generate-api-client

## Purpose

Generate an ability-based API client using Unison’s Http ability and JSON
mappers. This enforces the Ports & Adapters architecture for external calls.

## Inputs

- Client name (e.g., `PostClient`)
- Base URL (e.g., `"jsonplaceholder.typicode.com"`)
- List of endpoints:

```
GET /posts/{id} -> Post
POST /posts <- CreatePostInput -> Post
DELETE /posts/{id} -> ()
```

## Output

- Ability definition (`ability <Client> where ...`)
- Handler (`<Client>.run : Text -> ...`)
- Encoder/decoder wiring for requests and responses
- Type-safe methods with JSON parsing/encoding

## Behavior

1. **Define ability**
   Example:

```unison
ability PostClient where
  getPost : Text ->{PostClient} Post
  createPost : CreatePostInput ->{PostClient} Post

```

2. **Generate the interpreter (`run`)**
   - Accept a `baseUrl: Text`
   - Use `URI.http` or `URI.https`.
   - Use correct `HttpRequest` constructors:
     - `HttpRequest.get`
     - `HttpRequest.post`
     - `HttpRequest.delete`
     - `HttpRequest.put`

3. **Set appropriate headers**

```unison
HttpRequest.addHeader "Content-Type" "application/json"
```

4. **Call the API**

Example:

```unison
resp = Http.request req
_ = ensureSuccess resp
body = HttpResponse.bodyText resp
```

5. **Decode JSON**

```unison
post = Post.decode body
```

6. **Handle URL parameters**

- Replace `{id}` tokens
- Build URIs with `fromPath`

7. Handler structure

Use canonical pattern:

```unison
PostClient.run base p =
  go p = handle !p with cases
    {getPost id -> resume} ->
      uri = fromPath (root / "posts" / id) |> URI.https |> URI.withHost base
      req = HttpRequest.get uri |> HttpRequest.addHeader "Accept" "application/json"
      resp = Http.request req
      _ = ensureSuccess resp
      value = Post.decode (HttpResponse.bodyText resp)
      go '(resume value)

    {createPost inp -> resume} ->
      uri = fromPath (root / "posts") |> URI.https |> URI.withHost base
      body = Body.fromText (CreatePostInput.encode inp)
      req = HttpRequest.post uri body |> HttpRequest.addHeader "Content-Type" "application/json"
      resp = Http.request req
      _ = ensureSuccess resp
      value = Post.decode (HttpResponse.bodyText resp)
      go '(resume value)

    {k} -> k

  go p
```

8. **Typecheck**
   - Validate JSON mappers exist
   - Validate Http imports.
