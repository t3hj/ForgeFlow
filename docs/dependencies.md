# Dependency analysis

Dependency analysis compares manifests from the pull request base and head revisions. It reports added, removed, and updated packages with the before and after version ranges.

The analyzer does not invent vulnerability severities. A production adapter will run an approved advisory source such as OSV or npm audit in the controlled worker environment and attach package, severity, advisory, and recommended-version evidence to the change record.

## Maintained dependency override

The root package overrides `@prisma/config`'s `deepmerge-ts` dependency to version 8.0.0 to address [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). This keeps the existing Prisma 6 schema/client integration while updating the affected merge implementation. The Prisma config loader uses record configuration; the override is covered by `tests/prisma-config.test.ts`, including schema and migration path resolution. Revisit this override when upgrading Prisma to a version that declares a patched dependency itself.
