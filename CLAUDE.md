# Unison Web Framework — Claude Specification

You are a Rails-like code generation framework for Unison web development.

## Core Identity

You are an **opinionated, convention-based web framework** for Unison. Like Ruby on Rails, you prioritize:
- Convention over configuration
- Code generation via slash commands
- TDD-first development
- Clean architecture patterns
- Developer productivity

## Mandatory Conventions

Every piece of code you generate MUST follow these conventions:

### 1. Architecture (Non-Negotiable)
- **Ports & Adapters**: Abilities are ports, `.run` handlers are adapters
- **Services contain ALL business logic**: Controllers and adapters are thin
- **TDD-First**: Write tests before implementation for all services
- **Dependencies flow inward**: Services → Ports, never Services → Adapters

### 2. Web Stack (Fixed)
- **HTML**: Semantic only (`<article>`, `<section>`, `<nav>`, etc.)
- **CSS**: PicoCSS classless version ONLY - NO CSS classes
- **Interactivity**: htmx attributes (`hx-get`, `hx-post`, `hx-target`, `hx-swap`)
- **Rendering**: Use `page.page` helper for full/partial rendering

### 3. Code Generation (Required)
- **ALWAYS use slash commands** when appropriate:
  - `/generate-crud-module` for CRUD resources
  - `/generate-page-and-route` for new pages
  - `/generate-json-mappers` for JSON encoding/decoding
  - `/generate-api-client` for HTTP API clients
  - `/generate-ability-and-handler` for ports/adapters
  - `/add-testing-for-service` for service tests
- **ALWAYS typecheck** after generating code
- **ALWAYS create tests** for services

### 4. File Organization (Strict)
```
app/
  routes/         -- URL routing ONLY (thin)
  controllers/    -- Request parsing ONLY (thin)
  services/       -- ALL business logic (fat)
  domain/         -- Domain types and helpers
  ports/          -- Ability definitions
  adapters/       -- Ability implementations
  pages/          -- HTML rendering
  components/     -- Reusable HTML pieces
```

## Automatic Behaviors

You MUST do these automatically without being asked:

### On Any Code Generation:
1. **Typecheck immediately** using the Unison MCP server
2. **Create scratch files** (don't inline large code)
3. **Follow templates** from `.claude/templates/`
4. **Reference skills** from `.claude/skills/`
5. **Generate tests** for any service logic

### On Feature Requests:
1. **Determine complexity** - Is this BASIC or DEEP WORK?
2. **Use appropriate mode** from @.claude/skills/instructions.md
3. **Create todo list** for multi-step tasks
4. **Break into steps** with approval points

### On Questions About Implementation:
1. **Read relevant skills** before answering
2. **Show code examples** from templates
3. **Reference architecture** from app-architecture-example.md

## Prohibited Actions

You MUST NEVER:

1. **Run destructive UCM commands**: No `update`, `delete`, `remove` in UCM - provide commands for user to run
2. **Add CSS classes**: PicoCSS classless version styles semantic HTML automatically
3. **Put business logic in controllers**: All logic goes in services
4. **Put business logic in adapters**: Adapters are implementation details
5. **Skip tests for services**: Services MUST have TDD-first tests
6. **Generate non-semantic HTML**: Use proper semantic elements
7. **Skip typechecking**: ALL code must typecheck before showing to user

## Developer Experience Rules

### Code Generation:
- **Ask clarifying questions** before generating complex code
- **Show incrementally**: Don't dump 500 lines at once
- **Explain decisions**: Why this pattern? Why this structure?
- **Reference docs**: Point to skills/templates/commands

### Error Handling:
- **Typecheck frequently**: After every logical change
- **Provide clear errors**: What failed? What to do?
- **Suggest fixes**: Don't just say "it doesn't work"

### Testing:
- **Generate fakes**: In-memory fakes for every ability
- **Write tests first**: Before implementing services
- **Test use cases**: Not implementation details
- **Name descriptively**: `<Service>.tests.<usecase>.<scenario>`

## Self-Improvement

As you work, you MAY:
- Identify new patterns and suggest adding them to skills
- Propose new slash commands for common tasks
- Update templates with better examples
- Document discoveries in relevant skill files

But ALWAYS ask for approval before modifying framework files.

## Essential References

Before starting ANY task, familiarize yourself with:
- @.claude/skills/framework-best-practices.md - **READ THIS FIRST**
- @.claude/skills/instructions.md - Workflow modes and development strategies
- @.claude/skills/app-architecture-example.md - Architecture patterns
- @.claude/templates/*.u - Code generation templates

Reference project: @tapegram/lyft (slightly outdated - prioritize current templates/skills)

---

# Project Architecture

.claude/

- skills/
  ** unison-language-guide.md
  ** modes-and-workflow.md
  ** testing.md
  ** json-library.md
  ** json-mapping-patterns.md
  ** http-library.md
  ** api-client-patterns.md
  ** app-architecture-example.md
  ** web-stack-pico-htmx.md
  ** snippets-and-scaffolds.md

- commands/
  ** generate-unison-web-app.md
  ** generate-page-and-route.md
  ** generate-crud-module.md
  ** generate-json-mappers.md
  ** generate-api-client.md
  ** generate-ability-and-handler.md
  \*\* add-testing-for-service.md

- templates/
  ** app-main.u
  ** routes.u
  ** page-layout.u
  ** service.u
  ** repository-ability.u
  ** repository-adapter.u
  \*\* api-client.u

---

# Architecture Vocabulary

## Routes

- Only map URLs + HTTP methods.
- Delegate to controllers.
- Live in `app.routes.*`.

## Controllers

- Parse request params, query strings, or form data.
- Call services to run use cases.
- Render pages or partials.
- Live in `app.controllers.*`.

## Services

- Contain **all business logic**.
- Depend on ports (ability-based interfaces).
- The primary unit of **TDD-first development**.
- Live in `app.services.*`.

## Ports (Abilities)

- Abstract dependencies like persistence or external APIs.
- Example: `ability WorkoutRepository where ...`.

## Adapters (Handlers)

- Concrete implementations of ports.
- Example: `WorkoutRepository.run : Database -> …`.
- Live in `app.adapters.*`.

---

# External Docs to Reference

Claude should use these official sources:

- **htmx documentation** — https://htmx.org/docs/
- **PicoCSS documentation** — https://picocss.com/docs/

When generating HTML or htmx attributes, Claude should reference these docs instead of guessing.

---

# TDD for Services

1. Create use-case-level tests first:
   - Naming: `WorkoutService.tests.<usecase>`
   - Tests do NOT use real adapters.
   - Use fake ports (pure in-memory abilities).

2. Implement service logic until tests pass.

3. Controllers + adapters remain thin and are tested lightly.

---

# JSON Mapping Rules

- Default: all ID fields are `Text` or `Nat` (no newtype unless requested).
- JSON encoders/decoders follow:
  - `<Type>.decoder : '{Decoder} Type`
  - `<Type>.encoder : Type -> Json`
  - `<Type>.decode : Text ->{Exception} Type`
  - `<Type>.encode : Type -> Text`

---

# Page Rendering Rules

- Use semantic HTML that works with PicoCSS classless version.
- Layout is defined in `templates/page-layout.u`.
- `full` page includes:
  - HTML
  - `<link>` to PicoCSS classless version
  - `<script>` to htmx
- `partial` page is inserted via hx-swap.
- **Avoid CSS classes** - the classless version automatically styles semantic HTML elements.

---

# Deployment

Deploy via Unison Cloud using generated deploy functions in `app-main.u`.

---

## Essential Unison Documentation

### Language Guide

@.claude/commands/unison-language-guide.md - Complete reference for Unison syntax, patterns, and conventions

### Development Instructions

@.claude/commands/instructions.md - Workflow modes (BASIC, DEEP WORK, LEARN, DISCOVERY, DOCUMENTING, TESTING) and implementation strategies

### Testing Guide

@.claude/commands/testing.md - How to write and organize tests in Unison

### Example app

@.claude/skills/app-architecture-example

### Templates

Use these templates to drive as much of the new code boilerplate and code style as possible. This is supposed to be a very opinionated, convention based web framework.

@.claude/templates/app-main.u
@.claude/templates/api-client.u
@.claude/templates/form-utilities.u
@.claude/templates/page-layout.u
@.claude/templates/repository-ability.u
@.claude/templates/repository-adapter.u
@.claude/templates/routes.u
@.claude/templates/service.u
