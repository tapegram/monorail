# The Unison HTTP library

This project contains the following:

- Basic types for working with the HTTP protocol. Notably this includes
  definitions of an `HttpRequest` and `HttpResponse`.
- An HTTP client.
- An HTTP server.
- WebSocket support.

# Basic types

## HttpRequest

The `HttpRequest` type represents an HTTP request as defined by RFC 2616.

It could be used to represent either a request received by a server, or a request to be sent by a client.

### Constructing an HttpRequest

There are a number of helper methods for constructing an `HttpRequest`:

```
HttpRequest.get : URI -> HttpRequest
HttpRequest.get uri =
  headers = Headers.union (forURI uri) acceptEncoding.default
  HttpRequest GET Version.http11 uri headers Body.empty

HttpRequest.post : URI -> Body -> HttpRequest
HttpRequest.post uri body =
  headers = Headers.union (forURI uri) acceptEncoding.default
  HttpRequest POST Version.http11 uri headers body

HttpRequest.put : URI -> Body -> HttpRequest
HttpRequest.put uri body =
  headers = Headers.union (forURI uri) acceptEncoding.default
  HttpRequest PUT Version.http11 uri headers body

HttpRequest.delete : URI -> HttpRequest
HttpRequest.delete uri =
  headers = Headers.union (forURI uri) acceptEncoding.default
  HttpRequest DELETE Version.http11 uri headers Body.empty

HttpRequest.patch : URI -> Body -> HttpRequest
HttpRequest.patch uri body =
  headers = Headers.union (forURI uri) acceptEncoding.default
  HttpRequest PATCH Version.http11 uri headers body
```

```
uri = parseOrBug
"https://post.it/here"

body =
"{\"Hello\": \"World\"}"
 |> Body.fromText
HttpRequest.post uri body
```

Or you could construct a HttpRequest directly using its constructor:

```
uri = parseOrBug "http://some.where"
HttpRequest POST Version.http11 uri Headers.empty Body.empty
```

A request can also be decoded from `Bytes` using the `HttpRequest.fromBytes` and `HttpRequest.fromStream` functions:

```
HttpRequest.fromBytes : Bytes ->{Exception} HttpRequest
HttpRequest.fromBytes bs = HttpRequest.fromStream do emit bs

HttpRequest.fromStream : '{g, Stream Bytes} a ->{g, Exception} HttpRequest
HttpRequest.fromStream stream =
  Throw.toException toFailure do Decode.fromStream HttpRequest.decode stream
```

### Headers

You can add a header to an `HttpRequest` using the `HttpRequest.addHeader` function:

```
HttpRequest.addHeader : Text -> Text -> HttpRequest -> HttpRequest
HttpRequest.addHeader name value = cases
  HttpRequest method version uri headers body ->
    HttpRequest method version uri (Headers.add name value headers) body
```

To set a header to a specific set of values, use `setHeader` (a header with multiple values will be sent as multiple headers):

```
HttpRequest.setHeader : Text -> [Text] -> HttpRequest -> HttpRequest
HttpRequest.setHeader name value req =
  setIt = cases Headers map -> Headers (data.Map.put name value map)
  headers.modify setIt req
```

Given an `HttpRequest` req, you can get the headers using the HttpRequest.headers field:

```
HttpRequest.headers : HttpRequest -> Headers
HttpRequest.headers = cases HttpRequest _ _ _ h _ -> h
```

You can modify the headers of an `HttpRequest` using the `headers.modify` function:

```
HttpRequest.headers.modify :
  (Headers ->{g} Headers) -> HttpRequest ->{g} HttpRequest
HttpRequest.headers.modify f = cases
  HttpRequest version method uri origHeaders body ->
    HttpRequest version method uri (f origHeaders) body
```

### Body

The body of an `HttpRequest` is represented by a `Body` value. You can get the body of an `HttpRequest` using the `HttpRequest.body` field:

```
HttpRequest.body : HttpRequest -> Body
HttpRequest.body = cases HttpRequest _ _ _ _ b -> b
```

You can set the body of an `HttpRequest` using the `HttpRequest.body.set` function:

```
HttpRequest.body.set : Body -> HttpRequest -> HttpRequest
HttpRequest.body.set body = cases
  HttpRequest m v u h _ -> HttpRequest m v u h body
```

### Other fields

```
HttpRequest.method : HttpRequest -> Method
HttpRequest.method = cases HttpRequest m _ _ _ _ -> m

HttpRequest.version : HttpRequest -> Version
HttpRequest.version = cases HttpRequest _ v _ _ _ -> v

HttpRequest.uri : HttpRequest -> URI
HttpRequest.uri = cases HttpRequest _ _ u _ _ -> u
```

## HttpResponse

The `HttpResponse` type represents an HTTP response as defined by RFC 7231.

It could be used to represent either a response received by a client, or a response to be sent by a server.

### Constructing an HttpResponse

There are a number of helper methods for constructing common `HttpResponse`s:

```
HttpResponse.ok : Body -> HttpResponse
HttpResponse.ok body =
  HttpResponse (Status 200 "OK") Version.http11 (contentLength body) body

HttpResponse.notFound : HttpResponse
HttpResponse.notFound =
  HttpResponse (Status 404 "Not Found") Version.http11 Headers.empty Body.empty

HttpResponse.noContent : HttpResponse
HttpResponse.noContent =
  HttpResponse
    (Status 204 "No Content") Version.http11 Headers.empty Body.empty

HttpResponse.badRequest : HttpResponse
HttpResponse.badRequest =
  HttpResponse
    (Status 400 "Bad Request") Version.http11 Headers.empty Body.empty
```

Or you could construct a HttpResponse directly using its constructor:

```
HttpResponse
  (Status 200 "OK") Version.http11 Headers.empty (Body Bytes.empty)
```

## HTTP Client

This library can be used to make HTTP requests and inspect their responses.

### Usage

```
examples.simple : '{IO, Exception} HttpResponse
examples.simple =
  do Http.run do Http.get (parseOrBug "https://www.unison-lang.org")
```

Below is an example of making a simple HTTP request and getting back a response. It uses the `&` helper for creating a `RawQuery` (which will be converted to a URI query string).

```
examples.query : '{IO, Exception} HttpResponse
examples.query _ =
  use Path /
  google = Authority None (HostName "www.google.com") None
  path = root / "search"
  query = Query.empty & ("q", "Unison Programming Language")
  uri =
    URI
      Scheme.https
      (Some google)
      path
      (toRawQuery query)
      Fragment.empty
  Http.run do Http.get uri
```

### Response Status

By default, `Http.run` does not return a `Failure` for a non-success HTTP status code (such as 500 Internal Server Error).
It is left up to the user to determine whether they want to treat a 404
as an error or as an expected case which they should handle accordingly (for example by returning `None`). You can use
`HttpResponse.isSuccess` to check whether a response has a success code. In the future we may want to provide some helper methods for common use-cases of status code handling.

### Response Body

The response body is treated as raw bytes.

```
type Body = Body Bytes

HttpResponse.body : HttpResponse -> Body
HttpResponse.body = cases HttpResponse _ _ _ b -> b
```

This library handles decoding chunked and compressed responses but it is up to the user to further interpret those bytes. For example you may want to use
`fromUtf8` if you are expecting a text response, and/or you may want to use a JSON library to parse the response as JSON. In the future we may add more helper methods for common use-cases.

### URI Encoding

You should not attempt to URI-encode the segments in the `Path` or the keys/values in the `RawQuery`. This library will automatically encode these values when serializing the HTTP request.

### Trailing Slash

According to the HTTP specification,
http://www.unison-lang.org/docs/quickstart
and
http://www.unison-lang.org/docs/quickstart/
(with a trailing slash) are two different URIs. The URI without the trailing slash has two path segments: `docs` and `quickstart`. The URI with the trailing slash technically has a third path segment that is an empty string. Therefore if you need to create a path with a trailing slash you can add an empty segment to the end:

```
trailingSlash : Path
trailingSlash =
  use Path /
  root / "docs" / "language-reference" / ""
```

## WebSockets

Client and server-side WebSockets are supported.

On the client side, you will typically use `Http.webSocket` and `HttpWebSocket.handler` to create a `WebSocket` connection.

On the server side you will typically create a `WebSocketHandler` to handle a `WebSocket` connection.

However, some lower-level WebSocket functionality is provided for advanced use cases. Here is an example that uses some of the lower-level functionality:

```
websockets.example : '{IO, Exception} ()
websockets.example =
  do
    use Message text
    use Nat *
    use WebSocket send
    handleConnection connection =
      withConnection connection do
        request = HttpRequest.decode()
        emit (HttpResponse.encode (upgradeResponse request))
        ws =
          threadSafeWebSocket
            connection Server (1024 * 1024) Bytes.empty
        message = WebSocket.receive ws
        Debug.trace "Received" message
        send ws (text "From SERVER")
        send ws (text "From SERVER 2")
    bracket
      (do Socket.server None (Port "9011"))
      (cases BoundServerSocket socket -> Socket.close socket)
      (boundSocket ->
        let
          listeningSocket = boundSocket |> Socket.listen
          bracket
            (do Socket.accept listeningSocket |> Connection.socket)
            Connection.close
            handleConnection)
```
