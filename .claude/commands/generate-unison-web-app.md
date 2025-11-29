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
lib.install @unison/cloud
```

Additional optional dependencies based on app needs:

- `lib.install @unison/distributed` — for distributed systems

### Step 3: Create Application Structure

1. Review app-architecture-example.md

2. Scaffold the app using the templates/ and the example app for additional reference

3. Typecheck + show results.

**Workflow:**

- During development, deploy to dev or stage: run `deploy.deployDev` or `deploy.deployStage` in UCM
- To release to production: run `deploy.deployProd` in UCM
