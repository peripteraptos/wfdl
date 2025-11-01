// src/run-wfdl.js
import { resolve } from "path";
import { build } from "vite";
import viteWebfontDownload from "vite-plugin-webfont-dl";

/**
 * Rollup plugin that removes JS bundles and HTML from the final build.
 * We only want the assets created by vite-plugin-webfont-dl (CSS + font files).
 *
 * @returns {import('rollup').Plugin}
 */
function suppressJsAndHtmlOutput() {
  return {
    name: "wfdl-suppress-output",
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith(".js") || fileName.endsWith(".html")) {
          delete bundle[fileName];
        }
      }
    },
  };
}

/**
 * @typedef {Object} RunWfdlOptions
 * @property {string[]} fontUrls               List of font URLs to download.
 * @property {string}   [outDir="./fonts"]     Output directory (absolute or relative to cwd).
 * @property {boolean}  [verbose=false]        Print progress info.
 * @property {string[]} [subsetsAllowed=[]]    Passed through to vite-plugin-webfont-dl.
 * @property {boolean}  [minifyCss]            If defined, overrides the plugin’s default.
 * @property {boolean}  [dryRun=false]         If true, do not call Vite/build — just print what would happen.
 */

/**
 * Runs a minimal Vite build that downloads and emits font assets using
 * vite-plugin-webfont-dl, while stripping away the JS/HTML Vite normally produces.
 *
 * @param {RunWfdlOptions} options
 */
export async function runWfdl({
  fontUrls,
  outDir = "./fonts",
  verbose = false,
  subsetsAllowed = [],
  minifyCss,
  dryRun = false,
} = {}) {
  if (!Array.isArray(fontUrls) || fontUrls.length === 0) {
    throw new Error("[wfdl] No font URLs provided.");
  }

  const cwd = process.cwd();
  const outAbs = resolve(cwd, outDir);

  if (verbose || dryRun) {
    console.log("[wfdl] cwd:", cwd);
    console.log("[wfdl] output dir:", outAbs);
    console.log("[wfdl] fonts:", fontUrls.join(", "));
    if (subsetsAllowed.length) {
      console.log("[wfdl] subsets allowed:", subsetsAllowed.join(", "));
    }
    if (typeof minifyCss === "boolean") {
      console.log("[wfdl] minify CSS:", minifyCss ? "yes" : "no");
    }
  }

  if (dryRun) {
    console.log("[wfdl] dry run — no files will be written.");
    return;
  }

  await build({
    root: cwd,
    build: {
      copyPublicDir: false,
      outDir: outAbs,
      emptyOutDir: false,
      rollupOptions: {
        output: {
          assetFileNames: "[name].[ext]",
        },
      },
    },
    plugins: [
      viteWebfontDownload(fontUrls, {
        assetsSubfolder: "types",
        injectAsStyleTag: false,
        subsetsAllowed,
        ...(typeof minifyCss === "boolean" ? { minifyCss } : {}),
      }),
      suppressJsAndHtmlOutput(),
    ],
    logLevel: verbose ? "info" : "warn",
  });

  if (verbose) {
    console.log("[wfdl] done.");
  }
}
