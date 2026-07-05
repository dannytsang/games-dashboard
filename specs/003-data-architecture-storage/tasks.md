# Tasks: Data Architecture & Storage

## Ready-now preparation tasks

- [x] Draft this spec (003) from templates.
- [ ] Confirm `skill-map.yaml` `storage` entry references this spec.
- [ ] Confirm the path conventions match what the producer writes.
- [ ] Confirm the path conventions match what the dashboard reads.

## Implementation batch tasks

- [ ] Add the env-var table to operator reference documentation.
- [ ] Add the verification commands to `README.md` under "Verification".
- [ ] Confirm `BLOB_PUBLIC_READ_URL` is documented in `skill-map.yaml` (already done by spec 002 implementation — verify).
- [ ] Cross-link this spec from spec 001 ("Data storage and sources") and spec 002.

## Verification tasks

- [ ] Lint / build / tests pass.
- [ ] Privacy/secret scan clean.
- [ ] `git ls-files | xargs grep -lE 'NEXT_PUBLIC_(GAMES|BLOB)'` returns nothing.
- [ ] Hand implementation to `tester` for acceptance/privacy verification.
- [ ] Confirm the producer's existing path constants match FR-002.
- [ ] Confirm the dashboard's existing reader URL matches FR-006.