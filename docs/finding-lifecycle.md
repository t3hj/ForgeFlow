# Finding lifecycle

Finding mutations are server-side operations. The allowed states are `OPEN`, `ACKNOWLEDGED`, `IN_PROGRESS`, `RESOLVED`, and `FALSE_POSITIVE`.

Every transition validates the current state, records the actor, and produces an audit event. Resolved and false-positive findings can be reopened when new evidence appears. The browser never directly edits a finding status; it submits an authenticated command to the API.
