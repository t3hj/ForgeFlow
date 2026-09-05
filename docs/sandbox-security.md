# Sandbox security

Repository code is untrusted and must never execute directly in the API or worker host process.

The test runner will launch a short-lived container with:

- a read-only source mount;
- a non-root user;
- CPU and memory limits;
- a hard execution timeout;
- a temporary writable workspace only;
- network disabled by default;
- dropped Linux capabilities and a restrictive seccomp profile.

The worker treats timeout, resource exhaustion, and policy violations as failed test runs. The sandbox image is versioned and built by CI so the execution environment is reviewable.
