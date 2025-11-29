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
lib.install @unison/routes
lib.install @tapegram/html
lib.install @unison/json
```

Additional optional dependencies based on app needs:

- `lib.install @unison/cloud` — for Unison Cloud deployment
- `lib.install @unison/distributed` — for distributed systems

**Note:** `@unison/routes` is required for routing. All Monorail applications must use the Route ability from this library.

### Step 3: Create Application Structure

1. Create namespaces:
   - app.routes
   - app.controllers
   - app.services
   - app.domain
   - app.adapters.storage

2. Create `app.main` function - the primary entrypoint that composes all routes and handlers.
   - This function has access to all cloud-provided abilities
   - Signature:
     ```unison
     app.main : '{Route, Environment.Config, Exception, Http, Blobs, Services, Storage, Remote, Random, Log, Scratch} ()
     ```
   - All routes and application logic live here
   - Uses the Route ability from @unison/routes

3. Create layout via template/page-layout.u.

4. Typecheck + show results.

### Step 4: Create Deployment Functions

Create two deployment functions for Unison Cloud that both call `app.main`:

1. `deploy.stage` - Deploys to staging environment
   - Uses service name `<app-name>-stage`
   - Pattern:
     ```unison
     deploy.stage : '{IO, Exception} (ServiceHash HttpRequest HttpResponse)
     deploy.stage = Cloud.main do
       env = !Environment.default
       serviceName = ServiceName.named "<app-name>-stage"
       serviceHash = Route.deploy env app.main
       _ = ServiceName.assign serviceName serviceHash
       _ = Cloud.exposeHttp serviceHash
       serviceHash
     ```

2. `deploy.prod` - Deploys to production environment
   - Uses service name `<app-name>`
   - Pattern:
     ```unison
     deploy.prod : '{IO, Exception} (ServiceHash HttpRequest HttpResponse)
     deploy.prod = Cloud.main do
       env = !Environment.default
       serviceName = ServiceName.named "<app-name>"
       serviceHash = Route.deploy env app.main
       _ = ServiceName.assign serviceName serviceHash
       _ = Cloud.exposeHttp serviceHash
       serviceHash
     ```

Both deployment functions call the same `app.main`, ensuring consistent behavior across environments.

**Workflow:**
- During development, deploy to stage: run `deploy.stage` in UCM
- To release to production: run `deploy.prod` in UCM
