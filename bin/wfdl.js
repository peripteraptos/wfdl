#!/usr/bin/env node
import { loadConfig } from "../src/load-config.js";
import { runWfdl } from "../src/run-wfdl.js";

/**
 * @typedef {Object} CliOptions
 * @property {string[]} fonts
 * @property {string|undefined} outDir
 * @property {boolean|undefined} verbose
 * @property {string|undefined} configFile
 * @property {string[]} subsets
 * @property {boolean|undefined} minifyCss
 */

/**
 * Parse raw argv into a structured object.
 *
 * @param {string[]} argv
 * @returns {CliOptions}
 */
function parseCliArgs(argv) {
  /** @type {CliOptions} */
  const cli = {
    fonts: [],
    outDir: undefined,
    verbose: undefined,
    configFile: undefined,
    subsets: [],
    minifyCss: undefined,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case "--font":
      case "-f": {
        const val = argv[i + 1];
        if (!val) {
          console.error("[wfdl] Missing value for --font");
          process.exit(1);
        }
        cli.fonts.push(val);
        i++;
        break;
      }

      case "--out":
      case "-o": {
        const val = argv[i + 1];
        if (!val) {
          console.error("[wfdl] Missing value for --out");
          process.exit(1);
        }
        cli.outDir = val;
        i++;
        break;
      }

      case "--config":
      case "-c": {
        const val = argv[i + 1];
        if (!val) {
          console.error("[wfdl] Missing value for --config");
          process.exit(1);
        }
        cli.configFile = val;
        i++;
        break;
      }

      case "--subset":
      case "-s": {
        const val = argv[i + 1];
        if (!val) {
          console.error("[wfdl] Missing value for --subset");
          process.exit(1);
        }
        cli.subsets.push(val);
        i++;
        break;
      }

      case "--minify-css": {
        cli.minifyCss = true;
        break;
      }

      case "--no-minify-css": {
        cli.minifyCss = false;
        break;
      }

      case "--verbose":
      case "-v": {
        cli.verbose = true;
        break;
      }

      case "--help":
      case "-h": {
        printHelp();
        process.exit(0);
      }

      default: {
        console.warn("[wfdl] Unknown argument:", arg);
      }
    }
  }

  return cli;
}

/**
 * Merges config file and CLI options.
 * Priority: CLI > config > defaults.
 *
 * @param {{ cfg: object, cli: CliOptions }} param0
 */
function mergeConfigAndCli({ cfg, cli }) {
  return {
    fontUrls: cli.fonts.length ? cli.fonts : cfg.fonts ?? [],
    outDir: cli.outDir ?? cfg.outDir ?? "./fonts",
    verbose: cli.verbose ?? cfg.verbose ?? false,
    subsetsAllowed: cli.subsets.length
      ? cli.subsets
      : cfg.subsetsAllowed ?? [],
    minifyCss:
      typeof cli.minifyCss === "boolean"
        ? cli.minifyCss
        : typeof cfg.minifyCss === "boolean"
          ? cfg.minifyCss
          : undefined,
  };
}

function printHelp() {
  console.log(`Usage: wfdl [options]

Options:
  -f, --font <url>         Add a font URL (can repeat)
  -o, --out <dir>          Output directory (default: ./fonts or from config)
  -c, --config <file>      Config file (wfdl.config.{js,mjs,cjs,json})
  -s, --subset <name>      Allowed subset (can repeat), e.g. latin,latin-ext
      --minify-css         Force minify CSS
      --no-minify-css      Force no CSS minification
  -v, --verbose            Verbose output
  -h, --help               Show this help

Priority: CLI > config file > defaults
`);
}

(async function main() {
  const cli = parseCliArgs(process.argv.slice(2));
  const cfg = await loadConfig(cli.configFile);
  const finalOpts = mergeConfigAndCli({ cfg, cli });

  if (!finalOpts.fontUrls || finalOpts.fontUrls.length === 0) {
    console.error(
      "[wfdl] No fonts specified. Add --font <url> or define fonts[] in wfdl.config.json"
    );
    process.exit(1);
  }

  try {
    await runWfdl(finalOpts);
  } catch (err) {
    console.error("[wfdl] Error:", err?.message ?? err);
    process.exit(1);
  }
})();
