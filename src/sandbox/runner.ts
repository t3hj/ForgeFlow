export type SupportedProject = 'NODE' | 'PYTHON';

export interface SandboxInput {
  workspacePath: string;
  files: string[];
  project: SupportedProject;
}

export interface SandboxCommand {
  executable: 'docker';
  args: string[];
  timeoutMs: number;
}

export interface SandboxResult {
  status: 'COMPLETED' | 'FAILED' | 'TIMED_OUT';
  exitCode: number | null;
  output: string;
  durationMs: number;
}

export interface SandboxExecutor {
  execute(command: SandboxCommand): Promise<SandboxResult>;
}

export function detectProject(files: string[]): SupportedProject | null {
  if (files.includes('package.json') || files.includes('package-lock.json')) return 'NODE';
  if (files.includes('pyproject.toml') || files.includes('requirements.txt')) return 'PYTHON';
  return null;
}

export function buildSandboxCommand(input: SandboxInput, image = 'forgeflow/sandbox:latest'): SandboxCommand {
  if (!input.workspacePath.trim()) throw new Error('workspacePath is required');
  if (!input.files.length) throw new Error('sandbox requires a repository workspace');
  const testCommand = input.project === 'NODE' ? ['npm', 'test', '--', '--runInBand'] : ['pytest', '-q'];
  return {
    executable: 'docker',
    timeoutMs: 120_000,
    args: [
      'run', '--rm', '--network', 'none', '--read-only', '--cap-drop', 'ALL',
      '--security-opt', 'no-new-privileges', '--cpus', '1', '--memory', '512m',
      '--pids-limit', '128', '--tmpfs', '/tmp:rw,noexec,nosuid,size=128m',
      '--volume', `${input.workspacePath}:/workspace:ro`, '--workdir', '/workspace', image,
      ...testCommand,
    ],
  };
}

export class SandboxedTestRunner {
  private readonly executor: SandboxExecutor;
  private readonly image: string;

  constructor(executor: SandboxExecutor, image = 'forgeflow/sandbox:latest') {
    this.executor = executor;
    this.image = image;
  }

  async run(input: SandboxInput): Promise<SandboxResult> {
    return this.executor.execute(buildSandboxCommand(input, this.image));
  }
}
