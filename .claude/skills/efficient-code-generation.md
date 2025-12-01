# Efficient Code Generation Strategy

## Core Principle: Use Plop Generators

**NEVER stream long boilerplate code.** Instead:

1. **Run plop generator** - Use the appropriate generator for the task
2. **Customize** - Make targeted edits to the generated code
3. **Typecheck** - Verify with Unison MCP server
4. **Explain** - Teach key concepts (separate from code)

This saves massive tokens by using pre-built templates with Handlebars substitution.

---

## Available Plop Generators

```bash
npm run plop                    # Show all generators interactively
npm run plop crud-module        # Full CRUD (domain, repo, service, routes, pages)
npm run plop ability-handler    # Port (ability) + adapter (handler)
npm run plop json-mappers       # JSON encoder/decoder for a type
npm run plop page-route         # Page + controller + route
npm run plop api-client         # HTTP API client with ability
npm run plop service-tests      # Tests for a service
npm run plop unison-web-app     # Scaffold entire application
```

---

## The Pattern

### ❌ INEFFICIENT (Old Way):
```
Stream 200 lines of boilerplate code with minor changes
```

### ✅ EFFICIENT (New Way):
```
1. Run: npm run plop crud-module
2. Answer prompts (or pipe answers for automation)
3. Customize generated file with Edit tool
4. Typecheck
5. Explain key concepts
```

---

## Running Plop Generators

### Interactive Mode

Run plop and answer prompts interactively:

```bash
npm run plop crud-module
```

You'll be prompted for:
- Entity name (e.g., "Workout")
- Fields (interactive, one at a time)
- Include JSON mappers? (yes/no)
- HTML library version

### CLI Mode (Non-Interactive) - RECOMMENDED FOR CLAUDE

Use `npx plop` with positional bypass arguments (values in order of prompts):

```bash
# Scaffold a new app
npx plop unison-web-app "MyApp" "tapegram_html_2_1_0"

# Generate CRUD module
# Args: entityName, fields, includeJson, htmlLib
npx plop crud-module "Workout" "name:Text,reps:Nat" "true" "tapegram_html_2_1_0"

# Generate ability and handler
# Args: abilityName, operations, adapterType, includeFake
npx plop ability-handler "EmailClient" '[{"name":"send","inputType":"Email","outputType":"()"}]' "HTTP API" "true"

# Generate JSON mappers
# Args: typeName, fields
npx plop json-mappers "User" "id:Text,name:Text,age:Nat"

# Generate page and route
# Args: pageName, routePath, httpMethod, hasParams, htmlLib
npx plop page-route "Dashboard" "dashboard" "GET" "false" "tapegram_html_2_1_0"

# Generate API client
# Args: clientName, baseUrl, operations
npx plop api-client "GitHub" "api.github.com" '[{"name":"getUser","httpMethod":"GET","endpoint":"/user","responseType":"Json"}]'

# Generate service tests
# Args: serviceName, entityName, repositoryName, operations
npx plop service-tests "WorkoutService" "Workout" "WorkoutRepository" "create,get,listAll,update,delete"
```

**IMPORTANT:** Arguments are positional (in order of prompts), not named flags.

**NEVER use `npm run plop --` or other variations - always use `npx plop`.**

**Field Formats:**
- Simple: `name:Text,count:Nat,active:Boolean`
- JSON: `[{"name":"title","type":"Text"},{"name":"count","type":"Nat"}]`

**Operation Formats (for ability-handler, api-client):**
- JSON array: `[{"name":"op","inputType":"Text","outputType":"()"}]`

### Interactive Mode (for users)

Run plop and answer prompts interactively:

```bash
npm run plop crud-module
```

You'll be prompted for:
- Entity name (e.g., "Workout")
- Fields (format: `name:Type,name:Type`)
- Include JSON mappers? (yes/no)
- HTML library version

---

## Workflow Examples

### Example 1: Generate CRUD Module for Workout

```bash
# Step 1: Run generator (CLI mode)
npx plop crud-module "Workout" "name:Text,reps:Nat" "true" "tapegram_html_2_1_0"

# Step 2: Customize generated file
Edit(workout-crud.u): Add any custom business logic

# Step 3: Typecheck
mcp__unison__typecheck-code with file path

# Step 4: Explain
"I've generated a complete CRUD module for Workout..."
```

### Example 2: Generate API Client

```bash
# Step 1: Run generator (CLI mode)
npx plop api-client "Weather" "api.weather.com" '[{"name":"getCurrentWeather","httpMethod":"GET","endpoint":"/weather","responseType":"Weather"}]'

# Step 2: Customize for specific API requirements
Edit(weather-api-client.u): Add authentication headers, etc.

# Step 3: Typecheck and explain
```

---

## Customizing Generated Code

After generation, use the Edit tool for customizations:

### Adding Custom Fields
```
Edit(workout-crud.u):
  Add new field to type definition
```

### Custom Business Logic
```
Edit(workout-crud.u):
  Replace todo placeholder with actual implementation
```

### Adjusting Routes
```
Edit(workout-crud.u):
  Modify route paths or add middleware
```

---

## Teaching Efficiency

Teaching should be SEPARATE from code generation:

### ❌ INEFFICIENT:
```
[Stream 50 lines of code with inline comments explaining each line]
```

### ✅ EFFICIENT:
```
1. Run plop generator (1 command)
2. Customize if needed (1-2 edits)
3. Typecheck (1 operation)
4. THEN explain key concepts in text (not in code comments)
```

**Teaching text example:**
```
I've generated the Workout CRUD module using plop.

Key concepts:
- The ability (port) defines WHAT operations we need
- The handler (adapter) defines HOW using OrderedTable
- Services depend on the port, not the database
- This enables testing with fake adapters

The generated file includes:
- Domain type (Workout)
- Repository ability (WorkoutRepository)
- Repository adapter (storage.WorkoutRepository.run)
- Fake repository for testing
- Service with CRUD operations
- Routes and pages

This is the standard ports & adapters pattern!
```

---

## Token Savings

### Traditional Approach:
- Stream domain type: ~100 tokens
- Stream repository ability: ~200 tokens
- Stream repository adapter: ~400 tokens
- Stream service: ~600 tokens
- Stream routes: ~400 tokens
- Stream pages: ~500 tokens
- **Total: ~2,200 tokens**

### Plop Approach:
- Run plop command: ~50 tokens
- Customize (2 edits): ~100 tokens
- Teaching explanation: ~200 tokens
- **Total: ~350 tokens**

**Savings: 84% reduction in tokens**

---

## Detecting Installed Library Versions

**CRITICAL:** Plop prompts for the HTML library version. Always check what's installed first:

```bash
mcp__unison__list-project-libraries
```

Then provide the correct version (e.g., `tapegram_html_2_1_0`) when prompted.

---

## When to NOT Use Plop

Use manual code generation only when:

1. **Truly custom logic** (not matching any generator pattern)
2. **Small additions** (adding one function to existing code)
3. **Complex modifications** (changing generated code significantly)
4. **Teaching a new pattern** (first time showing something unique)

For 90% of boilerplate generation, use plop generators.

---

## Checklist for Efficient Generation

Before generating ANY code:

- [ ] Does a plop generator exist for this? → Run `npm run plop`
- [ ] Do I know the entity/ability name? → Ready to answer prompts
- [ ] Do I know the field types? → Ready for field prompts
- [ ] Have I checked installed library versions? → Use correct htmlLib

After generation:

- [ ] Generated file exists
- [ ] Made any necessary customizations
- [ ] Typechecked successfully
- [ ] Explained key concepts to user

---

## Plop Templates Reference

Templates are in `plop-templates/` as Handlebars files:

| Template | Generator | Creates |
|----------|-----------|---------|
| crud-module.u.hbs | crud-module | Domain, repo, service, routes, pages |
| ability-handler.u.hbs | ability-handler | Ability + handler + fake |
| json-mappers.u.hbs | json-mappers | Encoder, decoder, encode, decode |
| json-mappers-standalone.u.hbs | json-mappers | Same as above (standalone file) |
| page-route.u.hbs | page-route | Page, controller, route |
| api-client.u.hbs | api-client | API ability + HTTP handler |
| service-tests.u.hbs | service-tests | Test suite for service |
| app-main.u.hbs | unison-web-app | Main app scaffold |
| web-utilities.u.hbs | unison-web-app | Page utilities |

When making changes to templates, edit the `.hbs` files in `plop-templates/`.

---

## Summary

**The Rule:** Use plop generators, customize with Edit, explain concepts.

**The Result:** 80%+ token reduction with same quality output.

**The Benefit:** Faster generation, consistent patterns, more budget for teaching.
