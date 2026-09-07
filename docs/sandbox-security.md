# Sandbox security

Repository code is untrusted and must never execute directly in the API or worker host process.

The test runner creates a short-lived Docker command with:

- a read-only source mount;
- a non-root image contract;
- CPU, memory, PID, and execution-time limits;
- a temporary writable `/tmp` mount with `noexec` and `nosuid`;
- network disabled by default;
- dropped Linux capabilities and `no-new-privileges`.

Only allowlisted project commands are generated: `npm test -- --runInBand` for Node projects and `pytest -q` for Python projects. Unknown project types are not executed. The executor implementation is responsible for enforcing the timeout and capturing exit code/output; the API never runs repository commands directly.
