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

This creates a new Unison project. Then switch to it:

```
project.switch <app-name>
```

### Step 2: Install Dependencies

Install the required libraries from Unison Share:

```
lib.install @unison/http
lib.install @tapegram/html
lib.install @unison/json
```

Additional optional dependencies based on app needs:

- `lib.install @unison/cloud` — for Unison Cloud deployment
- `lib.install @unison/distributed` — for distributed systems

### Step 3: Create Application Structure

1. Create namespaces:
   - app.routes
   - app.controllers
   - app.services
   - app.domain
   - app.adapters.storage

2. Create deploy + main function using template/app-main.u.

3. Create base routes via template/routes.u.

4. Create layout via template/page-layout.u.

5. Typecheck + show results.
