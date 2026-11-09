# Changelog

## 0.1.1

- A channel plays as soon as its first player answers: the other players that were still being tried (up to 12 s) kept Kino waiting for them. They are dropped with the call. The plugin asks Kino to drop the requests a call leaves running (`globalThis.__kinoDropPendingFetches = true`, read by Kino 0.9.54 and later; an older Kino ignores it), with a test (`test/dropFetches.test.mjs`).
