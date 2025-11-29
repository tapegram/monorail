# API Client Patterns

API clients are modeled as abilities + interpreters.

# Creating API Client abilities

-- The client ability
-- We use an Ability to describe the interface of our API client
-- Not in particular that functions that take no arguments should be deferred, using a single quote.
-- This is equivalent to the first argument being a unit value.
-- So `getBookings : '{ApiClient} GetBookingsResponse` is the same as
-- `getBookings : () -> {ApiClient} GetBookingsResponse`

```unison
ability ApiClient where
  createToken : CreateTokenRequest ->{ApiClient} AuthToken
  createBooking : CreateBookingRequest ->{ApiClient} BookingResponse
  getBookings : '{ApiClient} GetBookingsResponse
  getBooking : Nat ->{ApiClient} BookingResponse
  updateBooking : AuthToken -> Nat -> UpdateBookingRequest ->{ApiClient} BookingResponse
  partialUpdateBooking : AuthToken -> Nat -> PartialUpdateBookingRequest ->{ApiClient} BookingResponse
  deleteBooking : AuthToken -> Nat ->{ApiClient} ()
  ping : '{ApiClient} ()

-- And here is an example implementation
-- Production base URL
ApiClient.productionHost = "restful-booker.herokuapp.com"

-- Implementation of the client.
ApiClient.run : Text -> '{g, ApiClient} a -> {g, Http, Exception} a
ApiClient.run host p =
  go : '{g, ApiClient} a -> {g, Http, Exception} a
  go p = handle !p with cases
    {createToken req -> resume} ->
      createTokenUrl =
        fromPath (root / "auth")
          |> URI.https
          |> URI.withHost host

      response =
        HttpRequest.post createTokenUrl (CreateTokenRequest.encode req |> Body.fromText)
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> Http.request
      _ = ensureSuccess response
      token =
        response
          |> HttpResponse.bodyText
          |> AuthToken.decode
      go '(resume token)
    {createBooking req -> resume} ->
      createBookingUrl =
        fromPath (root / "booking")
          |> URI.https
          |> URI.withHost host

      response =
        HttpRequest.post createBookingUrl (CreateBookingRequest.encode req |> Body.fromText)
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> Http.request
      _ = ensureSuccess response
      bookingResponse =
        response
          |> HttpResponse.bodyText
          |> BookingResponse.decode
      go '(resume bookingResponse)
    {getBookings _ -> resume} ->
      getBookingsUrl =
        fromPath (root / "booking")
          |> URI.https
          |> URI.withHost host
      response =
        HttpRequest.get getBookingsUrl
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> Http.request
      _ = ensureSuccess response
      bookingsResponse =
        response
          |> HttpResponse.bodyText
          |> GetBookingsResponse.decode
      go '(resume bookingsResponse)
    {getBooking id -> resume} ->
      getBookingUrl =
        fromPath (root / "booking" / (Nat.toText id))
          |> URI.https
          |> URI.withHost host
      response =
        HttpRequest.get getBookingUrl
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> Http.request
      _ = ensureSuccess response
      bookingResponse =
        response
          |> HttpResponse.bodyText
          |> BookingResponse.decode
      go '(resume bookingResponse)
    {updateBooking (AuthToken token) id req -> resume} ->
      updateBookingUrl =
        fromPath (root / "booking" / (Nat.toText id))
          |> URI.https
          |> URI.withHost host
      response =
        HttpRequest.put updateBookingUrl (UpdateBookingRequest.encode req |> Body.fromText)
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> HttpRequest.addHeader "Authorization" ("Basic: " ++ token)
          |> Http.request
      _ = ensureSuccess response
      bookingResponse =
        response
          |> HttpResponse.bodyText
          |> BookingResponse.decode
      go '(resume bookingResponse)
    {partialUpdateBooking (AuthToken token) id req -> resume} ->
      partialUpdateBookingUrl =
        fromPath (root / "booking" / (Nat.toText id))
          |> URI.https
          |> URI.withHost host
      response =
        HttpRequest.patch partialUpdateBookingUrl (PartialUpdateBookingRequest.encode req |> Body.fromText)
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> HttpRequest.addHeader "Authorization" ("Basic: " ++ token)
          |> Http.request
      _ = ensureSuccess response
      bookingResponse =
        response
          |> HttpResponse.bodyText
          |> BookingResponse.decode
      go '(resume bookingResponse)
    {deleteBooking (AuthToken token) id -> resume} ->
      deleteBookingUrl =
        fromPath (root / "booking" / (Nat.toText id))
          |> URI.https
          |> URI.withHost host
      response =
        HttpRequest.delete deleteBookingUrl
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> HttpRequest.addHeader "Authorization" ("Basic: " ++ token)
          |> Http.request
      _ = ensureSuccess response
      go '(resume ())
    {ping _ -> resume} ->
      pingUrl =
        fromPath (root / "ping")
          |> URI.https
          |> URI.withHost host
      response =
        HttpRequest.get pingUrl
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> Http.request
      _ = ensureSuccess response
      go '(resume ())
    { k } -> k
  go p
```

# The following is the documentation for a simple json API for managing Posts

## Guide

Below you'll find examples using [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) but you can JSONPlaceholder with any other language.

You can copy paste the code in your browser console to quickly test JSONPlaceholder.

### Getting a resource

```
fetch('https://jsonplaceholder.typicode.com/posts/1')
  .then((response) => response.json())
  .then((json) => console.log(json));

```

👇 _Output_

```
{
  id: 1,
  title: '...',
  body: '...',
  userId: 1
}

```

### Listing all resources

```
fetch('https://jsonplaceholder.typicode.com/posts')
  .then((response) => response.json())
  .then((json) => console.log(json));

```

👇 _Output_

```
[
  { id: 1, title: '...' /* ... */ },
  { id: 2, title: '...' /* ... */ },
  { id: 3, title: '...' /* ... */ },
  /* ... */
  { id: 100, title: '...' /* ... */ },
];

```

### Creating a resource

```
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  body: JSON.stringify({
    title: 'foo',
    body: 'bar',
    userId: 1,
  }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8',
  },
})
  .then((response) => response.json())
  .then((json) => console.log(json));

```

👇 _Output_

```
{
  id: 101,
  title: 'foo',
  body: 'bar',
  userId: 1
}

```

### Updating a resource

```
fetch('https://jsonplaceholder.typicode.com/posts/1', {
  method: 'PUT',
  body: JSON.stringify({
    id: 1,
    title: 'foo',
    body: 'bar',
    userId: 1,
  }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8',
  },
})
  .then((response) => response.json())
  .then((json) => console.log(json));

```

👇 _Output_

```
{
  id: 1,
  title: 'foo',
  body: 'bar',
  userId: 1
}

```

### Deleting a resource

```
fetch('https://jsonplaceholder.typicode.com/posts/1', {
  method: 'DELETE',
});

```

# Simple example implementation

Here is a limited implementation of the above in Unison. This code reflects the structure we want in our API Client Libraries, though it could be more thorough

```
-- Types and encoders/decoder

type Post = {
  id: Nat,
  title: Text,
  body: Text,
  userId: Nat,
}

Post.decode = Decoder.run Post.decoder

Post.decoder = do
  use Decoder text nat
  use object at!
  id = at! "id" nat
  userId = at! "userId" nat
  title = at! "title" text
  body = at! "body" text
  Post id title body userId

type CreatePostRequest = {
  title: Text,
  body: Text,
  userId: Nat,
}

CreatePostRequest.encode req = Json.toText (CreatePostRequest.encoder req)
CreatePostRequest.encoder = cases
  (CreatePostRequest title body userId) ->
    object.empty
      |> addText "title" title
      |> addText "body" body
      |> addNat "userId" userId

type UpdatePostRequest = {
  id: Nat,
  title: Text,
  body: Text,
  userId: Nat,
}

UpdatePostRequest.encode req = Json.toText (UpdatePostRequest.encoder req)
UpdatePostRequest.encoder = cases
  (UpdatePostRequest id title body userId) ->
    object.empty
      |> addNat "id" id
      |> addText "title" title
      |> addText "body" body
      |> addNat "userId" userId

ability PostClient where
  getPosts :  {PostClient} [Post]
  getPost : Nat ->{PostClient} Post
  createPost : CreatePostRequest ->{PostClient} Post
  deletePost : Nat ->{PostClient} ()
  updatePost :  UpdatePostRequest ->{PostClient} Post


-- Production base URL
PostClient.productionHost = "jsonplaceholder.typicode.com"


-- Implementation of the client.
-- Note: if we needed authentication, it should be passed in as an argument to this interpreter
PostClient.run : Text -> '{g, PostClient} a -> {g, Http, Exception} a
PostClient.run host p =
  go : '{g, PostClient} a -> {g, Http, Exception} a
  go p = handle !p with cases
    {getPosts -> resume} ->
      getPostsUrl =
        fromPath (root / "posts")
          |> URI.https
          |> URI.withHost host
      response =
        HttpRequest.get getPostsUrl
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> Http.request
      _ = ensureSuccess response
      posts =
        response
          |> HttpResponse.bodyText
          |> Decoder.run (Decoder.array Post.decoder)
      go '(resume posts)
    {getPost id -> resume} ->
      getPostUrl =
        fromPath (root / "posts" / (Nat.toText id))
          |> URI.https
          |> URI.withHost host

      response =
        HttpRequest.get getPostUrl
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> Http.request
      _ = ensureSuccess response
      post =
        response
          |> HttpResponse.bodyText
          |> Decoder.run Post.decoder
      go '(resume post)
    {createPost req -> resume} ->
      createPostUrl =
        fromPath (root / "posts")
          |> URI.https
          |> URI.withHost host

      response =
        HttpRequest.post createPostUrl (CreatePostRequest.encode req |> Body.fromText)
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> Http.request
      _ = ensureSuccess response
      post =
        response
          |> HttpResponse.bodyText
          |> Decoder.run Post.decoder
      go '(resume post)
    {deletePost id -> resume} ->
      deletePostUrl =
        fromPath (root / "posts" / (Nat.toText id))
          |> URI.https
          |> URI.withHost host

      response =
        HttpRequest.delete deletePostUrl
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> Http.request
      _ = ensureSuccess response
      go '(resume ())
    {updatePost req -> resume} ->
      id = UpdatePostRequest.id req
      updatePostUrl =
        fromPath (root / "posts" / (Nat.toText id))
          |> URI.https
          |> URI.withHost host

      response =
        HttpRequest.put updatePostUrl (UpdatePostRequest.encode req |> Body.fromText)
          |> HttpRequest.addHeader "Content-Type" "application/json"
          |> Http.request
      _ = ensureSuccess response
      post =
        response
          |> HttpResponse.bodyText
          |> Decoder.run Post.decoder
      go '(resume post)
    { k } -> k
  go p

-- Example usage

example.runGetPosts : '{IO, Exception} ()
example.runGetPosts = do
  Http.run do
    PostClient.run PostClient.productionHost do
      posts = getPosts
      printLine (List.map Post.title posts |> Text.join "\n")

example.runGetPost : '{IO, Exception} ()
example.runGetPost = do
  Http.run do
    PostClient.run PostClient.productionHost do
      post = getPost 1
      printLine (Post.title post)

example.runCreatePost : '{IO, Exception} ()
example.runCreatePost = do
  Http.run do
    PostClient.run PostClient.productionHost do
      req = CreatePostRequest "New Post" "This is a new post" 100
      post = createPost req
      printLine (Post.title post)

example.runUpdatePost : '{IO, Exception} ()
example.runUpdatePost = do
  Http.run do
    PostClient.run PostClient.productionHost do
      req = UpdatePostRequest 1 "New Post" "This is a new post" 100
      post = updatePost req
      printLine (Post.title post)

example.runDeletePost : '{IO, Exception} ()
example.runDeletePost = do
  Http.run do
    PostClient.run PostClient.productionHost do
      deletePost 1
```
