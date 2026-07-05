# Data Contracts: {Spec Title}

> **Template.** Schemas, types, paths, and sanitisation rules.

## Public-facing types

```ts
// Reference only — concrete types live in the implementation repo.
export interface ExampleEntity {
  id: string;
  // …
}
```

## Runtime storage contract

Production data path, schema version, retention policy.

```text
games-dashboard/v1/{source}/latest.json
```

## Sanitisation rules

- IDs must be opaque, not raw external IDs.
- Display fields must use safe labels, no raw identifiers.
- Metadata must not include local paths, tokens, or private identifiers.

## Filter / view-model types

```ts
export type SomeFilter = 'all' | 'one' | 'two';
```

Filter predicate table.