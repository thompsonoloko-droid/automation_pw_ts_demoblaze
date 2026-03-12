/**
 * Global setup — runs once before all tests.
 *
 * Cleans stale artifacts from previous runs so each execution starts fresh.
 */

import fs from "fs";
import path from "path";

const ARTIFACT_DIRS = [
  "test-results",
  path.join("reports", "html"),
  path.join("reports", "screenshots"),
];

function cleanDir(dirPath: string): void {
  const abs = path.resolve(__dirname, dirPath);
  if (fs.existsSync(abs)) {
    fs.rmSync(abs, { recursive: true, force: true });
  }
}

export default function globalSetup(): void {
  for (const dir of ARTIFACT_DIRS) {
    cleanDir(dir);
  }
}
