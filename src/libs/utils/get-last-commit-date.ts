import { execSync } from 'child_process';
import { existsSync } from 'fs';

export function getLastCommitDate(): string | null {
  if (!existsSync('.git')) return null;

  try {
    const date = execSync('git log -1 --format=%cd').toString().trim();
    return date;
  } catch (error) {
    return null;
  }
}
