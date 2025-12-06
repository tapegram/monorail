# Authentication Module

This skill describes how to add authentication (login, signup, sessions) to a Monorail web application.

## Overview

The authentication module provides:
- **User** type with email/password authentication
- **Session** type for cookie-based sessions
- **Auth ability** (port) with operations for user management
- **Auth.run handler** (adapter) that stores users/sessions as JSON in OrderedTable
- **AuthService** with login/signup business logic
- **Middleware** for protecting routes
- **Pages** for login/signup forms (semantic HTML + PicoCSS)
- **Routes** for GET/POST login and signup

## Quick Start

### Generate the Auth Module

```bash
# Generate with defaults
plop -- auth-module --htmlLib tapegram_html_2_1_0

# Generate with custom settings
plop -- auth-module --htmlLib tapegram_html_2_1_0 --cookieName "myapp-session" --sessionDays 7 --minPasswordLength 10

# Append to existing app file
plop -- auth-module --htmlLib tapegram_html_2_1_0 --appendTo app.u
```

### Generator Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `htmlLib` | `tapegram_html_2_0_0` | HTML library version (check with `list-project-libraries`) |
| `cookieName` | `session` | Name of the session cookie |
| `sessionDays` | `30` | Session duration in days |
| `minPasswordLength` | `8` | Minimum password length for signup |
| `saltPrefix` | `monorail` | Prefix for password salt (change in production!) |
| `appendTo` | (empty) | File to append to, or create new `auth.u` |

## Integration

### 1. Wire Up the Auth Handler in Main

```unison
main.main :
  Database ->
  HttpRequest ->
  {Exception, Storage, Remote, Random, Log, Environment.Config} HttpResponse
main.main db req =
  use Route <|>
  auth.Auth.run db do
    Route.run (app.routes db) req
```

### 2. Add Auth Routes to Your App Routes

```unison
app.routes :
  Database ->
  '{Route, Log, Exception, Environment.Config, auth.Auth, Random} ()
app.routes db =
  use Route <|>

  -- Your existing routes...
  home <|> heartbeat

  -- Add auth routes (login, signup)
  <|> auth.routes renderPage

-- Helper to render pages with your layout
renderPage : Html ->{Route, Exception} Html
renderPage content = page.full [content]
```

### 3. Protect Routes with Middleware

```unison
-- Protect a single route
protectedRoute = do
  auth.middleware.requireLogin do
    noCapture GET (Parser.s "dashboard")
    -- ... render dashboard
    ok.html (toText dashboardHtml)

-- Or protect a group of routes
protectedRoutes = do
  auth.middleware.requireLogin do
    dashboard <|> settings <|> profile
```

### 4. Access Current User in Routes

```unison
-- Get the current session (if logged in)
maybeSession = auth.AuthService.getSessionFromCookie Remote.now()

-- Get the current user
match maybeSession with
  Some session ->
    maybeUser = auth.Auth.getUserById (auth.Session.userId session)
    match maybeUser with
      Some user -> -- Use user.preferredName, etc.
      None -> -- Session exists but user was deleted
  None -> -- Not logged in
```

## Architecture

### Domain Types

```unison
type auth.User =
  { id : Text
  , preferredName : Text
  , email : Text
  , hashedPassword : Text
  }

type auth.Session =
  { userId : Text
  , token : Text
  , expiresAt : Instant
  }
```

### Auth Ability (Port)

```unison
ability auth.Auth where
  getUserByEmail : Text ->{auth.Auth} Optional auth.User
  getUserById : Text ->{auth.Auth} Optional auth.User
  hashPassword : Text ->{auth.Auth} Text
  upsertUser : auth.User ->{auth.Auth} ()
  isPasswordValid : auth.User -> Text ->{auth.Auth} Boolean
  createSession : auth.User -> Instant ->{auth.Auth} auth.Session
  isTokenForActiveSession : Text -> Instant ->{auth.Auth} Boolean
  getActiveSessionByToken : Text -> Instant ->{auth.Auth} Optional auth.Session
```

### Auth Handler (Adapter)

The `auth.Auth.run` handler:
- Stores users and sessions as JSON in OrderedTable (for schema evolution)
- Maintains two user indexes: by ID and by email
- Hashes passwords with SHA3-256 + configurable salt
- Creates sessions with configurable expiration

### AuthService

Business logic layer:
- `login` - Validates credentials, creates session
- `signup` - Validates input, creates user, creates session
- `getSessionFromCookie` - Gets active session from request cookie
- `setSessionCookie` - Sets session cookie on response

### Middleware

`auth.middleware.requireLogin` wraps a route handler and:
1. Checks for valid session cookie
2. If valid, continues to the protected route
3. If invalid, redirects to `/login` with 303 status

## Customization

### Adding User Fields

1. Update the `auth.User` type in the generated code
2. Update `auth.User.encoder` and `auth.User.decoder`
3. Update the signup form and service to handle new fields

### Custom Password Rules

Modify `auth.AuthService.signup` to add additional validation:

```unison
-- Example: require uppercase, lowercase, and number
if not (hasUppercase password && hasLowercase password && hasNumber password) then
  Left (auth.SignupFailure.InvalidPassword "Password must contain uppercase, lowercase, and number")
```

### Custom Session Cookie Settings

After generating, modify `auth.AuthService.setSessionCookie`:

```unison
auth.AuthService.setSessionCookie session =
  sessionCookie =
    cookie "session" (auth.Session.token session)
      |> Cookie.secure true      -- HTTPS only
      |> Cookie.httpOnly true    -- No JavaScript access
      |> Cookie.sameSite Strict  -- CSRF protection
  setCookie sessionCookie
```

### Adding "Remember Me"

Modify the session duration based on form input:

```unison
sessionDays = if rememberMe then 30 else 1
expiresAt = now + days +sessionDays
```

### Email Verification

1. Add `emailVerified : Boolean` to User type
2. Create `VerificationToken` type
3. Add verification routes (`/verify/:token`)
4. Send verification email in signup flow

### Password Reset

1. Create `PasswordResetToken` type
2. Add routes: `GET /forgot-password`, `POST /forgot-password`, `GET /reset/:token`, `POST /reset/:token`
3. Add email sending capability

## Security Notes

1. **Change the salt in production** - The default salt prefix should be replaced with a proper secret
2. **Use HTTPS** - Session cookies should only be sent over HTTPS
3. **Consider rate limiting** - Add rate limiting to login/signup routes
4. **Secure cookie flags** - Set `HttpOnly`, `Secure`, and `SameSite` on session cookies
5. **Session invalidation** - Implement logout and consider session rotation

## Routes Reference

| Route | Method | Description |
|-------|--------|-------------|
| `/login` | GET | Display login form |
| `/login` | POST | Process login, set cookie, redirect |
| `/signup` | GET | Display signup form |
| `/signup` | POST | Create user, set cookie, redirect |

## Error Types

### LoginFailure
- `UserNotFound` - No user with that email
- `InvalidPassword` - Password doesn't match

### SignupFailure
- `UserAlreadyExists` - Email already registered
- `InvalidEmail` - Email doesn't contain @
- `InvalidPassword Text` - Password too short (with message)
