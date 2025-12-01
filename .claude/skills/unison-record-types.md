# Unison Record Types

## Record Type Definition

```unison
type TaskService.CreateInput =
  { title : Text
  , description : Text
  , priority : Nat
  }
```

## CRITICAL: Constructor Naming

When you define a type with a qualified name like `TaskService.CreateInput`, the **constructor** is just the unqualified name `CreateInput`, NOT `TaskService.CreateInput`.

### Correct Usage

```unison
-- CORRECT: Use unqualified constructor name
input = CreateInput "My Title" "Description" 42
```

### Incorrect Usage

```unison
-- WRONG: This will NOT work
input = TaskService.CreateInput "My Title" "Description" 42
```

## Accessor Functions

Accessors ARE fully qualified with the type name:

```unison
-- Accessor functions are fully qualified
TaskService.CreateInput.title : CreateInput -> Text
TaskService.CreateInput.description : CreateInput -> Text
TaskService.CreateInput.priority : CreateInput -> Nat

-- Usage (correct):
title = TaskService.CreateInput.title input
```

## Summary Table

| Pattern | Qualified Name | Unqualified Name |
|---------|----------------|------------------|
| Type definition | `type Foo.Bar = { ... }` | N/A |
| Constructor | ❌ `Foo.Bar "value"` | ✅ `Bar "value"` |
| Accessor | ✅ `Foo.Bar.field entity` | ❌ |
| Type annotation | ✅ `x : Foo.Bar` or `x : Bar` | ✅ |

## In Templates

When generating code that constructs records:

```handlebars
-- Use unqualified constructor
createInput = CreateInput {{#each fields}}(value){{/each}}

-- Use qualified accessors
field = {{pascalCase entityName}}Service.CreateInput.{{name}} createInput
```

## Type Conversion for Form Data

When parsing form data to non-Text types:

```unison
-- Text fields: use directly
title = form.getOnly! "title" formData

-- Nat fields: parse with Optional handling
priority = Nat.fromText (form.getOnly! "priority" formData)
           |> Optional.getOrBug "Invalid priority"

-- Int fields
count = Int.fromText (form.getOnly! "count" formData)
        |> Optional.getOrBug "Invalid count"
```

Note: `Nat.fromText!` and similar do NOT exist. Use `Nat.fromText` which returns `Optional Nat`, then handle with `Optional.getOrBug` or pattern matching.
