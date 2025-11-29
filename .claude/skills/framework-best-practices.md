# Unison Web Framework - Best Practices

This guide documents best practices for using Claude as a Rails-like web framework for Unison.

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

### Always Typecheck
- After EVERY code generation
- Before showing code to user
- After EVERY edit

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

## Summary Checklist

Before showing ANY generated code:

- [ ] Followed appropriate template
- [ ] Typechecked successfully
- [ ] Generated tests (if service)
- [ ] Used semantic HTML (if web page)
- [ ] No CSS classes (if web page)
- [ ] Followed ports & adapters (if has dependencies)
- [ ] Clear explanations provided
- [ ] Integration instructions included
