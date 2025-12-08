# Unison Web Framework - Best Practices

This guide documents best practices for using Claude as a Rails-like web framework for Unison.

## ⚡ EFFICIENCY FIRST: Code Generation Strategy

**CRITICAL:** Before generating ANY code, read @.claude/skills/efficient-code-generation.md

**The Golden Rule:** Copy templates, make edits, explain concepts separately.

**Implementation:**
1. Check if a template exists: `.claude/templates/*.u`
2. If yes → Use Write to copy, Edit to customize
3. If no → Generate minimal code, explain after
4. Always separate teaching from code generation

**Token Budget:**
- Streaming 200 lines of boilerplate: ~2000 tokens
- Copy template + 5 edits + teaching: ~600 tokens
- **Savings: 70%**

Use this saved budget for better teaching, more iterations, and deeper problem-solving.

---

## When to Use Slash Commands

Slash commands are your primary code generation interface. Use them proactively:

### /generate-crud-module
**When to use:**
- User asks to create a new entity/resource
- User wants full CRUD operations (create, read, update, delete)
- User says "add a Post model" or similar

**Example requests:**
- "Create a CRUD module for blog posts"
- "I need a user management system"
- "Add workout tracking to the app"

**Auto-detect keywords:** "CRUD", "resource", "model", "entity", "scaffold"

### /generate-page-and-route
**When to use:**
- User wants to add a new page/view
- User mentions a specific URL path
- User wants to display something to users

**Example requests:**
- "Add an about page"
- "Create a dashboard at /dashboard"
- "I need a page that shows user statistics"

**Auto-detect keywords:** "page", "view", "route", "URL", "endpoint", "show"

### /generate-json-mappers
**When to use:**
- User has a type that needs JSON serialization
- User mentions API integration
- User wants to send/receive JSON

**Example requests:**
- "Make Post serializable to JSON"
- "I need JSON encoders for User"
- "This type needs to work with JSON APIs"

**Auto-detect keywords:** "JSON", "serialize", "deserialize", "encode", "decode", "API"

### /generate-api-client
**When to use:**
- User wants to call an external HTTP API
- User mentions a third-party service
- User needs to fetch data from a URL

**Example requests:**
- "Create a client for the GitHub API"
- "I need to call the weather API"
- "Add integration with Stripe"

**Auto-detect keywords:** "API", "HTTP", "REST", "client", "fetch", "call"

### /generate-ability-and-handler
**When to use:**
- User wants to abstract a dependency
- User mentions "ability" or "handler"
- User wants testable code

**Example requests:**
- "Create an EmailClient ability"
- "I need to abstract the database access"
- "Make a port for external weather service"

**Auto-detect keywords:** "ability", "port", "adapter", "handler", "abstract"

### /add-testing-for-service
**When to use:**
- After generating ANY service
- User asks for tests
- Before implementing service logic (TDD)

**Example requests:**
- "Add tests for WorkoutService"
- "I want to test the delete function"
- "Write tests first for this service"

**Auto-detect keywords:** "test", "TDD", "spec", "verify"

## Workflow Modes (from instructions.md)

Follow the mode system from @.claude/skills/instructions.md:

### BASIC Mode
**Use when:**
- Task is small and well-defined
- Implementing a single function
- Making a minor change
- User gives clear requirements

**Process:**
1. Confirm type signatures
2. Search for similar functions (optional)
3. Implement (1-SHOT or USER-GUIDED)

### DEEP WORK Mode
**Use when:**
- Task involves multiple files/components
- Requirements are unclear or complex
- Architectural decisions needed
- User says "build a feature"

**Process:**
1. Gather requirements (ask questions)
2. MANDATORY CHECKPOINT - wait for approval
3. Implement step-by-step

### LEARN Mode
**Use when:**
- Unfamiliar with a library
- User asks "how does X work?"
- Need to understand existing code
- About to use a new library

**Process:**
1. Read README/docs
2. View function signatures
3. Explore dependencies/dependents

### DISCOVERY Mode
**Use when:**
- User asks "is there a library for X?"
- Looking for Unison Share packages
- Exploring available tools

**Process:**
1. Search Unison Share
2. Read READMEs
3. Suggest installation

## Code Generation Best Practices

### CRITICAL: Typecheck After EVERY Change

**This is non-negotiable.** You MUST typecheck:
- After EVERY plop generation
- After EVERY Edit tool use
- After EVERY Write tool use
- Before showing ANY code to user

**Why?**
- Unison errors compound quickly
- Small errors are easier to fix than cascading type errors
- Users expect working code

**The Rule:** Modified a `.u` file? Typecheck immediately. No batching edits.

### Always Use Templates
Before generating code, read:
- @.claude/templates/[relevant-template].u
- @.claude/skills/[relevant-skill].md

### Always Generate Tests
For ANY service, automatically:
1. Generate fake adapters
2. Write test cases (happy path + errors)
3. Typecheck tests
4. Show user how to run tests

### Always Follow Architecture
- Services depend on Ports (abilities)
- Controllers call Services
- Adapters implement Ports
- NO business logic in controllers/adapters

## HTML Generation Best Practices

### Semantic HTML Only
```unison
-- GOOD
article []
  [ header [] [h1 [] [text "Title"]]
  , section [] [p [] [text "Content"]]
  , footer [] [text "Footer"]
  ]

-- BAD (don't use div everywhere)
div [class "article"]
  [ div [class "header"] [h1 [] [text "Title"]]
  , div [class "content"] [p [] [text "Content"]]
  , div [class "footer"] [text "Footer"]
  ]
```

### NO CSS Classes
```unison
-- GOOD
button [] [text "Click me"]
nav [] [ul [] [...]]

-- BAD
button [class "btn btn-primary"] [text "Click me"]
div [class "navbar"] [ul [] [...]]
```

PicoCSS classless version styles semantic elements automatically.

### Use htmx Attributes
```unison
-- Dynamic loading
button
  [ hxGet "/api/data"
  , hxTarget "#result"
  , hxSwap "innerHTML"
  ]
  [text "Load"]

-- Form submission
form
  [ hxPost "/workouts"
  , hxTarget "#list"
  , hxSwap "beforeend"
  ]
  [...]
```

## JSON Mapping Best Practices

### Always Generate All Four Functions
```unison
Type.encoder : Type -> Json
Type.decoder : '{Decoder} Type
Type.encode : Type -> Text
Type.decode : Text ->{Exception} Type
```

### Follow Field Type Patterns
Reference @.claude/skills/json-mapping-patterns.md for:
- Optional fields
- Nested objects
- Arrays
- Sum types
- Timestamps

### Always Test Round-Trips
```unison
test> Type.tests.jsonRoundTrip = test.verify do
  original = { ... }
  encoded = Type.encode original
  decoded = Type.decode encoded
  ensureEqual original decoded
```

## Testing Best Practices

### Test Services, Not Adapters
```unison
-- GOOD: Test service with fake adapter
test> WorkoutService.tests.create.success = test.verify do
  storage = Ref.new []
  result = handle WorkoutService.create input
             with WorkoutRepository.fake storage
  ensureEqual result.name "Push ups"

-- BAD: Testing adapter implementation details
test> WorkoutRepository.tests.upsert = ...
```

### Use Descriptive Names
```unison
-- GOOD
test> WorkoutService.tests.create.success = ...
test> WorkoutService.tests.delete.notFound = ...
test> WorkoutService.tests.update.invalidInput = ...

-- BAD
test> WorkoutService.tests.test1 = ...
test> WorkoutService.tests.testCreateWorkout = ...
```

### Test Happy Path AND Errors
```unison
test> Service.tests.operation.success = ...
test> Service.tests.operation.notFound = ...
test> Service.tests.operation.invalidInput = ...
```

## When to Use Different MCP Commands

### Typechecking
```
mcp__unison__typecheck-code
```
- After every code generation
- After every edit
- Before showing code to user

### Viewing Definitions
```
mcp__unison__view-definitions
```
- When implementing code that uses a library function
- When user asks "how does X work?"
- When debugging type errors

### Getting Documentation
```
mcp__unison__docs
```
- Before using a function
- When user asks about a library
- During LEARN mode

### Searching
```
mcp__unison__search-definitions-by-name
mcp__unison__search-by-type
```
- When looking for existing functions
- During BASIC mode step 2
- When user asks "is there a function for X?"

## Proactive Behaviors

Do these WITHOUT being asked:

### After Generating a Service:
1. Generate tests automatically
2. Generate fake adapters
3. Show example usage

### After Generating a Type:
1. Ask: "Should I generate JSON mappers for this?"
2. If yes, use `/generate-json-mappers`

### After Generating a Page:
1. Provide integration instructions
2. Show what URL it will be available at
3. Suggest related pages/routes

### During Code Generation:
1. Ask clarifying questions BEFORE generating
2. Break complex tasks into steps
3. Seek approval at checkpoints

## Error Recovery

### If Typechecking Fails:
1. Read the error message
2. Identify the issue
3. Fix and re-typecheck
4. Don't show broken code to user

### If Uncertain About Syntax:
1. Use `view-definitions` to see examples
2. Use `docs` to read documentation
3. Reference templates
4. Ask user for guidance

### If Requirements Unclear:
1. Stop and ask questions
2. Don't guess or assume
3. Confirm before proceeding

## File Organization

Always put generated code in appropriate namespaces:

```
app.routes.workouts       -- Workout routes
app.controllers.Workout   -- Workout controller
app.services.WorkoutService  -- Workout service logic
app.domain.Workout        -- Workout type
app.ports.WorkoutRepository  -- Workout repository ability
app.adapters.storage.WorkoutRepository  -- Workout repository adapter
app.pages.workouts        -- Workout pages/views
```

## Communication Best Practices

### Be Explicit
```
// GOOD
"I'm going to create a CRUD module for Workouts with these fields: name: Text, reps: Nat"

// BAD
"Creating workout stuff..."
```

### Show Progress
```
// GOOD
"Step 1: Creating domain type ✓"
"Step 2: Creating repository port ✓"
"Step 3: Creating adapter..."

// BAD
[generates everything silently]
```

### Explain Decisions
```
// GOOD
"I'm using an Optional Nat for duration because workout duration is optional"

// BAD
[just generates code without explanation]
```

### Reference Framework
```
// GOOD
"Following the ports & adapters pattern from @.claude/skills/app-architecture-example.md"

// BAD
[generates code without referencing conventions]
```

## Teaching Best Practices

### Before Generating Code:
1. **Explain WHAT** you're about to generate
2. **Explain WHY** this pattern/structure
3. **Explain HOW** it fits into the architecture
4. **Show alternatives** and why we don't use them

### While Showing Code:
1. **Add comments** explaining non-obvious patterns
2. **Annotate abilities** with "This is a PORT"
3. **Annotate handlers** with how they work
4. **Explain syntax** like `'`, `!`, `|>`, `do`

### After Showing Code:
1. **Highlight key insights** ("Notice how...")
2. **Connect to bigger picture** ("This will be called by...")
3. **Show what's next** ("Now we'll create...")
4. **Invite questions** ("Does this make sense?")

### Teaching Triggers:

**First CRUD Module:**
- Full architecture explanation
- Draw the layers diagram
- Explain each layer's purpose
- Show data flow

**First Test:**
- TDD principles
- Why test services, not adapters
- How fake adapters work
- Test-first workflow

**First JSON Mapper:**
- Why four functions
- Encoder vs decoder patterns
- Error handling strategy
- Round-trip testing

**First htmx Page:**
- Server-side rendering
- Progressive enhancement
- No JavaScript needed
- Partial vs full page

**First Ability:**
- What abilities are
- Why use them
- How handlers work
- Algebraic effects

Reference: @.claude/skills/teaching-pedagogy.md and @.claude/skills/explanation-templates.md

---

## Routing Best Practices

### Route Ordering is Critical

Routes are matched **in order**. More specific routes MUST come before general ones.

❌ **WRONG (will 404 on toggle):**
```unison
index <|> create <|> toggle <|> deleteTask
-- Problem: 'index' matches /tasks/{anything}, so 'toggle' never matches
```

✅ **CORRECT:**
```unison
toggle <|> deleteTask <|> index <|> create
-- Specific routes (/tasks/{id}/toggle) before general (/tasks/{id})
```

**Rule of Thumb:**
- Routes with more path segments come first
- Routes with specific strings come before dynamic captures
- POST/DELETE before GET
- No-capture routes come last

### Route Handler Structure

Each route handler MUST follow this exact structure:

```unison
handlerName = do
  <route matcher>
  <handler code>
handlerName  -- IMPORTANT: return the handler
```

**Example:**
```unison
app.routes.home =
  index = do
    noCapture GET (Parser.s "")
    html = app.pages.home()
    ok.html (toText html)
  index  -- Return the handler
```

**Common Mistakes:**

❌ **Missing the return:**
```unison
app.routes.home = do
  noCapture GET (Parser.s "")
  html = app.pages.home()
  ok.html (toText html)
  -- ERROR: No handler returned
```

❌ **Wrong indentation:**
```unison
app.routes.home =
  index = do
  noCapture GET (Parser.s "")  -- ERROR: Not indented under 'do'
  html = app.pages.home()
  ok.html (toText html)
  index
```

### baseUrl() for All Internal URLs

Reference @.claude/skills/baseurl-pattern.md for comprehensive guide.

**Quick Checklist:**
- [ ] Page uses `'{Route}` in type signature
- [ ] Page uses `do` syntax
- [ ] All links use `baseUrl() / "path" |> Path.toText`
- [ ] All forms use `baseUrl() / "path" |> Path.toText`
- [ ] All htmx attributes use `baseUrl() / "path" |> Path.toText`

### Ability Propagation in Routes

Routes must declare all abilities used by controllers and services:

```unison
app.routes : '{Route, Log, Exception, TaskRepository} ()
app.routes =
  -- Route handlers can now use TaskRepository
```

**Handler application happens in main:**
```unison
main db req =
  storage.TaskRepository.run db do
    Route.run app.routes req
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Optional.None Scoping Conflicts

**Problem:** The htmx library exports `Option.None` which conflicts with `Optional.None`.

**Solution:** Always add `use Optional None Some` in functions that pattern match on Optional:

```unison
app.controllers.TaskController.show taskId = do
  use Optional None Some  -- CRITICAL!

  maybeTask = TaskService.get taskId
  match maybeTask with
    Some task -> ok.html (toText (showTask task))
    None -> notFound.text "Task not found"
```

### Pitfall 2: Library Version Mismatch

**Problem:** Templates show `tapegram_html_2_0_0` but project has `2_1_0` installed.

**Solution:** ALWAYS check installed libraries FIRST:
```
1. Run: mcp__unison__list-project-libraries
2. Find: tapegram_html_2_1_0
3. Use: tapegram_html_2_1_0.div (not 2_0_0)
```

### Pitfall 3: Conditional HTML Attributes

**Problem:** How to conditionally include attributes like `checked`?

**Solution:** Build attribute list conditionally:

```unison
checkboxAttrs =
  [ type_ "checkbox"
  , hx_post toggleUrl
  ] List.++ (if isCompleted then [checked true] else [])

input checkboxAttrs []
```

**NOT:**
```unison
-- This doesn't work:
input
  [ type_ "checkbox"
  , if isCompleted then checked true else ???  -- Can't do this!
  ]
  []
```

### Pitfall 4: UUID Function Naming

**Problem:** Using `Uuid.newv4()` which doesn't exist.

**Solution:** Use `Uuid.new()`:

```unison
-- CORRECT:
id = Uuid.new ()

-- WRONG:
id = Uuid.newv4()
```

### Pitfall 5: Ability Handler Application

**Problem:** Using `handle...with` pattern for applying handlers.

**Solution:** Use function application pattern:

❌ **WRONG:**
```unison
main db req =
  handle storage.TaskRepository.run db with
    Route.run app.routes req
```

✅ **CORRECT:**
```unison
main db req =
  storage.TaskRepository.run db do
    Route.run app.routes req
```

Reference: @.claude/skills/abilities-and-handlers.md for complete guide.

### Pitfall 6: File Accidentally Emptied

**Problem:** Edit operation resulted in 0-byte file.

**Solution:** Use UCM to restore from codebase:
```
edit <namespace>
```

Then use the Edit tool on the restored file.

### Pitfall 7: Naming Readability

**Problem:** Using abbreviated names that are hard to read.

**Solution:** Use descriptive names:
- `createTaskButton` not `createBtn`
- `toggleUrl` not `tglUrl`
- `taskItem` not `taskItm`

**Exception:** Common abbreviations are fine:
- `id` for identifier
- `db` for database
- `req` for request
- `resp` for response

### Pitfall 8: Boolean.fromText Doesn't Exist

**Problem:** Trying to parse a Boolean from form input using `Boolean.fromText`.

**Solution:** Unison doesn't have `Boolean.fromText`. Compare the string directly:

```unison
-- CORRECT:
isCompleted = (form.getOnly! "completed" formData == "true")

-- WRONG (doesn't exist):
isCompleted = Boolean.fromText (form.getOnly! "completed" formData)
```

**Note:** The crud-module template handles this automatically for Boolean fields.

### Pitfall 9: Path./ vs Parser./ Ambiguity

**Problem:** When `use Parser / s` is in scope (common in routes), using `/` for Path operations picks the wrong function.

**Error:** `has type: Path but I expected: Parser a b`

**Solution:** Use `Path./` explicitly when building paths in route handlers:

```unison
app.routes db =
  use Parser / s  -- This brings Parser./ into scope as just "/"

  -- WRONG: Uses Parser./ which expects Parser types
  auth.redirect (baseUrl() / "login")

  -- CORRECT: Explicitly use Path./
  auth.redirect (baseUrl() Path./ "login")
```

### Pitfall 10: Auth Middleware Wrapping Route Matcher

**Problem:** Using `auth.middleware.requireLogin` to wrap the entire route including the route matcher causes auth checks to run BEFORE checking if the route matches. This blocks ALL requests, even to public routes.

**Wrong pattern:**
```unison
-- Auth check runs before route matching - breaks public routes!
createItem = do
  auth.middleware.requireLogin do
    noCapture POST (s "items")  -- Never reached for unauthenticated users
    ...
```

**Correct pattern for mixed public/protected apps:**
```unison
-- Match route FIRST, then check auth
createItem = do
  noCapture POST (s "items")           -- 1. Match route first
  isLoggedIn = checkLoggedIn()          -- 2. Then check auth
  if Boolean.not isLoggedIn then
    auth.redirect (baseUrl() Path./ "login")
  else
    -- 3. Protected logic here
    ...
```

**Reference:** See @.claude/skills/authentication.md for complete patterns.

### Pitfall 11: HTMX Target Not Found on Empty Lists

**Problem:** When a list is empty, htmx can't find the target element for appending new items. The `hx-target="#item-list"` fails because the `<ul id="item-list">` doesn't exist or only contains a placeholder `<li>`.

**Wrong pattern:**
```unison
-- Empty message inside the list - htmx appends AFTER it
ul [id "item-list"]
  (if List.isEmpty items then
    [li [] [text "No items yet"]]  -- This stays when items are added!
  else
    List.map renderItem items)
```

**Correct pattern:**
```unison
-- Empty message OUTSIDE the list, list always exists
emptyMessage =
  if List.isEmpty items then
    p [style "color: #888;"] [text "No items yet"]
  else empty

section []
  [ emptyMessage                              -- Separate from list
  , ul [id "item-list"] (List.map renderItem items)  -- Always render ul
  ]
```

**Why this works:**
1. The `<ul id="item-list">` always exists, even when empty
2. `hx-swap="beforeend"` can always find the target
3. Empty message is separate and doesn't interfere with item rendering
4. When first item is added, it appears in the (previously empty) list

**Bonus:** Add `style "list-style: none; padding: 0;"` to the `ul` for cleaner look.

### Pitfall 12: No Redirect Helper in Routes

**Problem:** There's no simple `redirect` function. Developers try things like `redirect.found url` which don't exist.

**Solution:** Use the `web.redirect` helper (added to web-utilities template):

```unison
-- In web utilities (already included in template):
web.redirect : Text ->{Route} ()
web.redirect url = do
  response.setStatus (HttpResponse.Status.Status 303 "See Other")
  response.headers.add "Location" url

-- Usage:
loginPost = do
  noCapture POST (s "login")
  -- ... validate login ...
  web.redirect (baseUrl() Path./ "" |> Path.toText)  -- Redirect to home
```

Or manually if not using the helper:
```unison
response.setStatus (HttpResponse.Status.Status 303 "See Other")
response.headers.add "Location" "/some/path"
```

---

## Summary Checklist

Before showing ANY generated code:

- [ ] Followed appropriate template
- [ ] Typechecked successfully
- [ ] Generated tests (if service)
- [ ] Used semantic HTML (if web page)
- [ ] No CSS classes (if web page)
- [ ] Followed ports & adapters (if has dependencies)
- [ ] **Explained WHAT you're generating**
- [ ] **Explained WHY this pattern**
- [ ] **Explained HOW it fits in architecture**
- [ ] **Added explanatory comments to code**
- [ ] Clear integration instructions included

After showing code:

- [ ] **Highlighted key insights**
- [ ] **Connected to bigger picture**
- [ ] **Mentioned what's next**
- [ ] **Invited questions/clarification**
