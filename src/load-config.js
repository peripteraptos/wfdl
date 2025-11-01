// src/load-config.js
import { existsSync, readFileSync } from "fs";
import { resolve, isAbsolute } from "path";
import { pathToFileURL } from "url";

/**
 * Tries to load a config file.
 * Supports: .js/.mjs/.cjs (ESM) and .json.
 *
 * @param {string} filePath
 * @param {{silent?: boolean}} [opts]
 * @returns {Promise<object|null>}
 */
export async function loadOneConfigFile(filePath, { silent = false } = {}) {
  if (!existsSync(filePath)) {
    if (!silent) {
      console.error(`[wfdl] Config file not found: ${filePath}`);
    }
    return null;
  }

  if (filePath.endsWith(".json")) {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  }

  const mod = await import(pathToFileURL(filePath).href);
  return mod.default || mod;
}

/**
 * Loads config in this order:
 * 1. explicit path (if given)
 * 2. wfdl.config.js/mjs/cjs/json in CWD
 *
 * @param {string | undefined} explicitPath
 * @returns {Promise<object>}
 */
export async function loadConfig(explicitPath) {
  if (explicitPath) {
    const abs = isAbsolute(explicitPath)
      ? explicitPath
      : resolve(process.cwd(), explicitPath);
    return (await loadOneConfigFile(abs)) ?? {};
  }

  const candidates = [
    "wfdl.config.js",
    "wfdl.config.mjs",
    "wfdl.config.cjs",
    "wfdl.config.json",
  ].map((p) => resolve(process.cwd(), p));

  for (const file of candidates) {
    const cfg = await loadOneConfigFile(file, { silent: true });
    if (cfg) return cfg;
  }

  return {};
}
