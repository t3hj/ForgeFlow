# AI security

The AI review stage is advisory and receives a bounded context assembled by the worker. It does not receive unrestricted repository access, database access, shell access, or credentials.

## Context policy

- Include the pull request description, changed-file metadata, relevant diff hunks, and structured deterministic findings.
- Redact likely secrets before persistence or model submission.
- Preserve source file and line metadata from the diff processor; the model cannot invent locations that are not in the supplied context.
- Validate the model response against a strict schema and discard malformed findings.
- Treat model output as untrusted evidence and never execute a recommended command automatically.

AI review cannot publish comments, change repository code, or change finding state without an authenticated user action.
