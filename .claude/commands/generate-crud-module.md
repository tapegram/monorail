# generate-crud-module

## Purpose

Generate domain type + repository port + adapter + service + basic pages.

## Behavior

1. Create domain record with `id : Text`.
2. Create ability `<Entity>Repository`.
3. Create adapter `<Entity>Repository.run` using OrderedTable Text Entity.
4. Create `<Entity>Service` containing create/update/delete/list use cases.
5. Create controller + routes.
6. Create JSON mappers if requested.
7. Typecheck.
