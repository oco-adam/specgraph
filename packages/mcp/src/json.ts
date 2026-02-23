import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  const body = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(filePath, body, 'utf8');
}

export function resolveInside(baseDir: string, relativePath: string): string {
  const resolved = path.resolve(baseDir, relativePath);
  const normalizedBase = path.resolve(baseDir);
  const safePrefix = `${normalizedBase}${path.sep}`;

  if (resolved !== normalizedBase && !resolved.startsWith(safePrefix)) {
    throw new Error(`Path escapes graph directory: ${relativePath}`);
  }

  return resolved;
}
