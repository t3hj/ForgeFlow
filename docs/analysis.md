# Deterministic analysis

The first analysis stage is deterministic and runs before AI review. `scanFiles` accepts only the changed-file content selected by the pull request processor and emits structured findings with exact line numbers, source evidence, severity, category, confidence, and a recommendation.

Rules currently cover dynamic code execution, shell command construction, credential-like assignments, interpolated SQL, and unfinished-work markers. These are high-signal heuristics, not a replacement for language-specific tools. The worker will add ESLint, Semgrep, dependency scanners, and project-native type/test commands inside the sandbox as the supported language matrix expands.

Findings are evidence-backed. The AI layer may explain or prioritize them, but it must not invent a file or line that is absent from this deterministic context.

`runPipeline` executes the stages in order and emits running/completed/failed updates. The current sandbox and AI stages return explicit not-configured results rather than pretending those checks ran.
