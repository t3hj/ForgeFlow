import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfigFromFile } from '@prisma/config';
import { expect, it } from 'vitest';

it('loads Prisma configuration with the patched merge dependency', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'forgeflow-prisma-'));
  try {
    await writeFile(join(directory, 'prisma.config.ts'), "export default { schema: './prisma/schema.prisma', migrations: { path: './prisma/migrations' } };\n");
    const result = await loadConfigFromFile({ configRoot: directory });
    expect(result.error).toBeUndefined();
    expect(result.config?.schema).toBe(join(directory, 'prisma/schema.prisma'));
    expect(result.config?.migrations?.path).toBe(join(directory, 'prisma/migrations'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
