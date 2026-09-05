# Dependency analysis

Dependency analysis compares manifests from the pull request base and head revisions. It reports added, removed, and updated packages with the before and after version ranges.

The analyzer does not invent vulnerability severities. A production adapter will run an approved advisory source such as OSV or npm audit in the controlled worker environment and attach package, severity, advisory, and recommended-version evidence to the change record.
