import { readFileSync, writeFileSync } from "fs";

const locks = new Map();

export function readJSON(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function writeJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Serialise async writes to the same file path so concurrent requests
 * do not interleave reads and writes (within a single process).
 */
export async function withFileLock(filePath, fn) {
  const previous = locks.get(filePath) ?? Promise.resolve();
  let resolveLock;
  const next = new Promise((resolve) => {
    resolveLock = resolve;
  });
  locks.set(filePath, next);
  try {
    await previous;
    return await fn();
  } finally {
    resolveLock();
    if (locks.get(filePath) === next) {
      locks.delete(filePath);
    }
  }
}
