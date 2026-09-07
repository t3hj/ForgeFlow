import { describe, expect, it } from 'vitest';
import { buildSandboxCommand, detectProject, SandboxedTestRunner, type SandboxExecutor } from '../src/sandbox/runner.js';

describe('sandbox runner', () => {
  it('detects supported project types', () => {
    expect(detectProject(['package.json', 'src/index.ts'])).toBe('NODE');
    expect(detectProject(['pyproject.toml', 'app.py'])).toBe('PYTHON');
    expect(detectProject(['README.md'])).toBeNull();
  });

  it('builds a network-disabled, resource-limited Docker command', () => {
    const command = buildSandboxCommand({ workspacePath: 'C:/workspace', files: ['package.json'], project: 'NODE' });
    expect(command.executable).toBe('docker');
    expect(command.args).toEqual(expect.arrayContaining(['--network', 'none', '--read-only', '--cap-drop', 'ALL', '--memory', '512m', '--pids-limit', '128']));
    expect(command.args.slice(-5)).toEqual(['forgeflow/sandbox:latest', 'npm', 'test', '--', '--runInBand']);
  });

  it('delegates only the generated sandbox command to the executor', async () => {
    let received: unknown;
    const executor: SandboxExecutor = { execute: async (command) => { received = command; return { status: 'COMPLETED', exitCode: 0, output: '2 passed', durationMs: 120 }; } };
    const result = await new SandboxedTestRunner(executor).run({ workspacePath: '/tmp/repo', files: ['requirements.txt'], project: 'PYTHON' });
    expect(result.status).toBe('COMPLETED');
    expect(received).toMatchObject({ executable: 'docker' });
  });
});
