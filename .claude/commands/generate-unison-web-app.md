# generate-unison-web-app

## Purpose

Create the full skeleton of a new Unison web application.

## Inputs

- app name
- description

## Behavior

### Step 1: Project Setup in UCM

Provide the user with the following UCM commands to run:

```
project.create <app-name>
```

This creates a new Unison project. Then switch to a feature branch (never work directly on main):

```
project.switch <app-name>/scaffold
```

### Step 2: Install Dependencies

Install the required libraries from Unison Share:

```
lib.install @unison/http        # HTTP server and request/response handling
lib.install @unison/routes      # URL routing with Route ability
lib.install @tapegram/html      # HTML generation library
lib.install @tapegram/htmx      # htmx helpers and utilities
lib.install @unison/json        # JSON encoding/decoding
lib.install @unison/cloud       # Unison Cloud deployment
```

**Important:** Both `@tapegram/html` and `@tapegram/htmx` are required for the Monorail web stack (semantic HTML + htmx interactivity).

Additional optional dependencies based on app needs:

- `lib.install @unison/distributed` — for distributed systems

### Step 3: Check Library Versions

After installing, check what versions were installed:

```
list-project-libraries (via MCP)
```

Note the exact version of `tapegram_html` (e.g., `tapegram_html_2_1_0`).

### Step 4: Generate Application Scaffold

Use plop to generate a **single app.u file** with all code:

```bash
plop -- unison-web-app --appName <AppName> --htmlLib <tapegram_html_version>
```

Example:
```bash
plop -- unison-web-app --appName MonorailDocs --htmlLib tapegram_html_2_1_0
```

This generates `app.u` containing:
- Web utilities (page rendering, baseUrl, form helpers)
- Deploy configuration and functions
- Main entry point
- Routes
- Home page

### Step 5: Typecheck and Update

1. Typecheck the generated file:
   ```
   typecheck-code app.u (via MCP)
   ```

2. If it passes, tell user to load and update in UCM:
   ```
   load app.u
   update
   ```

### Step 6: Deploy to Dev

Test the scaffold by deploying to dev:

```
run deploy.deployDev
```

### Step 7: Merge to Main (User Action)

Once the scaffold is working, the user merges to main:

```
project.switch <app-name>/main
merge scaffold
```

## Key Points

- **Single file**: All code goes in `app.u` - never split across multiple files
- **Branch first**: Always work on a feature branch, never directly on main
- **Typecheck before update**: Always typecheck with MCP before telling user to update
