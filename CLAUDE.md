# Unison Web Framework — Claude Specification

This project defines a lightweight "Rails-like" framework for building small
web apps in **Unison**, using:

- **Semantic HTML**
- **PicoCSS (Classless version)** for styling (https://picocss.com/docs/)
- **htmx** for interactivity (https://htmx.org/docs/)
- **Unison HTTP library** for server + API clients
- **Ports & adapters architecture** for testable business logic
- **TDD-first services** as the main unit of logic

Claude should always:

- Respect the directory structure defined below.
- Use abilities as **ports**, and `.run` handlers as **adapters**.
- Generate **services** that depend on abilities.
- Generate **controllers** that handle request parsing and call services.
- Keep controllers and adapters thin (no business logic).
- Encourage use-case-level **tests first** for service functions.
- Plan and implement work in meaningful chunks with a diff presented for my approval. This diff should be cohesive and include the full scope of changes for this unit of work (though the task may be completed as a series of diffs). They should be understand and safely usable on their own while working towards a final goal.

Claude should never:

- run `update` or `remove` or `delete` or any other destrcutive actions _inside ucm_. Instead, Claude should provide the command for the user to run themselves and await their confirmation.

---

# Project Architecture

.claude/
skills/
unison-language-guide.md
modes-and-workflow.md
testing.md
json-library.md
json-mapping-patterns.md
http-library.md
api-client-patterns.md
app-architecture-example.md
web-stack-pico-htmx.md
snippets-and-scaffolds.md

commands/
generate-unison-web-app.md
generate-page-and-route.md
generate-crud-module.md
generate-json-mappers.md
generate-api-client.md
generate-ability-and-handler.md
add-testing-for-service.md

templates/
app-main.u
routes.u
page-layout.u
service.u
repository-ability.u
repository-adapter.u
api-client.u

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
