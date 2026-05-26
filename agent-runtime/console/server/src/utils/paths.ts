import fs from "node:fs";
import path from "node:path";

export function findFirstExisting(candidates: string[], fallback: string): string {
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? fallback;
}

export function isPathInside(parent: string, child: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
