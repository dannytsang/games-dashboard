# Open Questions

1. Should `BLOB_PUBLIC_READ_URL` be derived per-environment (e.g.
   preview vs production) or shared? (Current assumption: per-environment
   by Vercel convention.)
2. Should the `_meta/manifest.json` artefact be implemented in MVP, or
   remain reserved? (Current decision: reserved, deferred.)
3. Should historical retention ever be enabled, and if so, what is the
   trigger? (Current decision: defer indefinitely.)
4. Is Vercel Blob's "public access" appropriate for the dashboard, or
   should the dashboard fetch via the write token with read-only
   privileges? (Current decision: public access; the read URL is
   server-side and the snapshot is already sanitised.)
5. Should the producer pre-validate the path namespace at startup, or
   trust the path constant? (Current decision: trust the constant;
   failures surface as `write_failed`.)