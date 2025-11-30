# Efficient Code Generation Strategy

## Core Principle: Copy Templates, Make Edits

**NEVER stream long boilerplate code.** Instead:

1. **Copy** the template file using Write tool
2. **Edit** specific placeholders using Edit tool
3. **Typecheck** to verify
4. **Explain** the key concepts (teaching)

This saves massive tokens by reusing existing templates instead of regenerating them.

---

## The Pattern

### ❌ INEFFICIENT (Old Way):
```
Stream 200 lines of boilerplate code with minor changes
```

### ✅ EFFICIENT (New Way):
```
1. Write template to scratch file
2. Edit placeholder → actual value (3-5 edits typically)
3. Typecheck
4. Explain key concepts
```

---

## Template → Entity Mapping

All templates use placeholder patterns that should be replaced:

| Template Placeholder | Replace With | Example |
|---------------------|-------------|---------|
| `MyEntity` | PascalCase entity name | `Workout` |
| `<Entity>` | PascalCase entity name | `Workout` |
| `myentities` | Lowercase plural | `workouts` |
| `<entities>` | Lowercase plural | `workouts` |
| `<entity>` | Lowercase singular | `workout` |

---

## Efficient CRUD Generation

### Step 1: Copy Repository Template

```
Write(.claude/templates/repository-ability.u → workout-crud.u)
```

### Step 2: Batch Edit Placeholders

```
Edit(workout-crud.u):
  - MyEntity → Workout (replace_all=true)
  - MyEntityRepository → WorkoutRepository (replace_all=true)
```

**Result:** Full repository ability in 2 operations instead of streaming 20 lines

### Step 3: Append Repository Adapter

```
Read(.claude/templates/repository-adapter.u)
Edit(workout-crud.u): Append adapter template with placeholders replaced
```

**Or more efficiently:**

```
Bash: cat .claude/templates/repository-adapter.u >> workout-crud.u
Edit(workout-crud.u): Replace MyEntity → Workout in appended section
```

### Step 4: Continue Pattern for Other Layers

Each layer follows same pattern:
- Copy or append template
- Batch edit placeholders
- Typecheck

---

## Field-Specific Edits

For custom fields, use targeted edits:

### Domain Type Fields

```
Edit(workout-crud.u):
  old: "{ id : Text\n  , <field1> : <Type1>\n  , <field2> : <Type2>\n  }"
  new: "{ id : Text\n  , name : Text\n  , reps : Nat\n  , duration : Optional Nat\n  }"
```

### Service Create Function

```
Edit(workout-crud.u):
  old: "entity = { id, <fields from input> }"
  new: "entity = { id, name = input.name, reps = input.reps, duration = input.duration }"
```

---

## Efficient JSON Mapper Generation

JSON mappers have highly regular patterns:

### Step 1: Copy Template Base

```
Write a minimal template to scratch file with:
- encoder skeleton
- decoder skeleton
- encode/decode helpers
```

### Step 2: Generate Field Lists

For a type with fields `{ id : Text, name : Text, reps : Nat }`:

**Encoder fields (generated as text):**
```
    |> object.addText "id" value.id
    |> object.addText "name" value.name
    |> object.addNat "reps" value.reps
```

**Decoder fields (generated as text):**
```
  id = at! "id" Decoder.text
  name = at! "name" Decoder.text
  reps = at! "reps" Decoder.nat
```

### Step 3: Single Edit Insertion

```
Edit(workout-json.u):
  old: "  |> todo \"add encoder fields\""
  new: [generated encoder fields]

Edit(workout-json.u):
  old: "  todo \"add decoder fields\""
  new: [generated decoder fields]
```

**Result:** Full JSON mappers with 2 edits instead of streaming 80 lines

---

## Efficient Route Generation

Routes follow a template pattern:

### Copy Route Template
```
Read(.claude/templates/routes.u)
```

### Edit for Entity
```
Edit:
  - examples → workouts
  - Example → Workout
  - exampleId → workoutId
```

**Result:** Full RESTful routes with 3 edits

---

## Teaching Efficiency

Teaching should be SEPARATE from code generation:

### ❌ INEFFICIENT:
```
[Stream 50 lines of code with inline comments explaining each line]
```

### ✅ EFFICIENT:
```
1. Copy template (1 operation)
2. Edit placeholders (3-5 operations)
3. Typecheck (1 operation)
4. THEN explain key concepts in text (not in code comments)
```

**Teaching text example:**
```
I've generated the WorkoutRepository port and adapter.

Key concepts:
- The ability (port) defines WHAT operations we need
- The handler (adapter) defines HOW using OrderedTable
- Services depend on the port, not the database
- This enables testing with fake adapters

The pattern we used:
1. Copied repository-ability.u template
2. Replaced MyEntity → Workout
3. Copied repository-adapter.u template
4. Replaced placeholders
5. Typechecked

This is the standard ports & adapters pattern!
```

---

## Batch Operations

Whenever possible, batch edits:

### ❌ INEFFICIENT (Multiple Edit Calls):
```
Edit(file): MyEntity → Workout
Edit(file): MyEntityRepository → WorkoutRepository
Edit(file): myentities → workouts
Edit(file): myentity → workout
```

### ✅ EFFICIENT (Single Edit with replace_all):
```
Edit(file, replace_all=true): MyEntity → Workout
Edit(file, replace_all=true): myentities → workouts
```

Or use Bash for bulk replacements:
```
Bash: sed -i '' 's/MyEntity/Workout/g' workout-crud.u
```

---

## Template Composition

For complex generations, build up file incrementally:

```
1. Write repository-ability.u → scratch.u
2. Bash: cat repository-adapter.u >> scratch.u
3. Bash: cat service.u >> scratch.u
4. Edit(scratch.u, replace_all=true): MyEntity → Workout
5. Edit(scratch.u): [field-specific edits]
6. Typecheck
```

**Result:** All layers in one file with minimal edits

---

## Token Savings Example

### Traditional Approach:
- Stream repository ability: ~500 tokens
- Stream repository adapter: ~800 tokens
- Stream service: ~600 tokens
- Stream routes: ~400 tokens
- **Total: ~2,300 tokens**

### Efficient Approach:
- Write repository-ability.u: ~50 tokens
- Edit placeholders (3x): ~150 tokens
- Append adapter: ~50 tokens
- Edit placeholders (3x): ~150 tokens
- Append service: ~50 tokens
- Edit placeholders (3x): ~150 tokens
- Teaching explanation: ~200 tokens
- **Total: ~800 tokens**

**Savings: 65% reduction in tokens**

---

## When to Stream Code

Only stream code when:

1. **Truly custom logic** (not template-based)
2. **Teaching a new pattern** (first time showing it)
3. **Complex conditionals** (not easily template-able)
4. **Debugging** (showing specific fixes)

For 90% of boilerplate generation, use templates + edits.

---

## Checklist for Efficient Generation

Before generating ANY code:

- [ ] Does a template exist for this? → Use Write + Edit
- [ ] Can I compose existing templates? → Use cat/append + Edit
- [ ] Are there only 3-5 custom parts? → Use targeted edits
- [ ] Am I repeating similar code? → Create a template
- [ ] Would this be >50 lines streamed? → Use templates instead

After generation:

- [ ] Used templates where possible
- [ ] Made targeted edits only
- [ ] Batched edits when possible
- [ ] Separated teaching from code generation
- [ ] Typechecked efficiently

---

## Detecting Installed Library Versions

**CRITICAL:** Never hardcode library versions in generated code. Always detect what's actually installed.

### Before Generating ANY Code Using External Libraries:

1. **Check installed libraries first:**
   ```
   mcp__unison__list-project-libraries
   ```

2. **Use the EXACT version installed:**
   ```
   // If you see: tapegram_html_2_1_0
   // Use: tapegram_html_2_1_0.div
   // NOT: tapegram_html_2_0_0.div
   ```

3. **For common libraries, store the version:**
   ```
   When generating code that will reference a library multiple times,
   note the installed version at the start of your generation.

   Example: "I see you have tapegram_html_2_1_0 installed, I'll use that version."
   ```

### Common Library Patterns:

| Library Pattern | How to Detect | Example Usage |
|----------------|---------------|---------------|
| `tapegram_html_*` | list-project-libraries → find tapegram_html_* | `tapegram_html_2_1_0.div` |
| `tapegram_htmx_*` | list-project-libraries → find tapegram_htmx_* | `tapegram_htmx_3_4_0.hx_post` |

### Anti-Pattern to Avoid:

❌ **WRONG:**
```
Generating code with tapegram_html_2_0_0 because that's what the template shows
```

✅ **CORRECT:**
```
1. Check: mcp__unison__list-project-libraries
2. Find: tapegram_html_2_1_0
3. Generate: All code uses tapegram_html_2_1_0
```

### In Templates:

Templates should use PLACEHOLDER patterns for library versions:

```
-- Instead of hardcoding:
tapegram_html_2_0_0.div [] [text "Hello"]

-- Use a comment placeholder:
{- HTML_LIB -}.div [] [text "Hello"]

-- Then when copying template, replace {- HTML_LIB -} with actual version
```

### Workflow Integration:

Add this step to EVERY code generation:

1. ✅ Check installed library versions (if using external libs)
2. ✅ Does a template exist for this? → Use Write + Edit
3. ✅ Can I compose existing templates? → Use cat/append + Edit
4. ✅ Are there only 3-5 custom parts? → Use targeted edits

---

## Template Inventory

Current templates available:

| Template | Use For | Key Placeholders |
|----------|---------|------------------|
| repository-ability.u | Port definition | MyEntity, MyEntityRepository |
| repository-adapter.u | Database adapter | MyEntity, myentities |
| service.u | Business logic skeleton | MyService, Input, Output |
| routes.u | RESTful routing | examples, Example, exampleId |
| api-client.u | HTTP client | Api, Thing, baseUrl |
| page-layout.u | HTML page structure | (use as-is) |
| form-utilities.u | Form helpers | (use as-is) |
| app-main.u | Application entry | appName |

When generating code, **ALWAYS check this list first.**

---

## Summary

**The Rule:** Copy templates, make edits, explain concepts.

**The Result:** 50-70% token reduction with same quality output.

**The Benefit:** Faster generation, more budget for teaching and iteration.
