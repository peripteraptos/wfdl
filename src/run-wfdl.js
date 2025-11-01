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
} = {}) {
  if (!Array.isArray(fontUrls) || fontUrls.length === 0) {
    throw new Error("[wfdl] No font URLs provided.");
  }

  // Build directly into the user's current working directory
  const cwd = process.cwd();
  const outAbs = resolve(cwd, outDir);

  if (verbose) {
    console.log("[wfdl] cwd:", cwd);
    console.log("[wfdl] output dir:", outAbs);
    console.log("[wfdl] fonts:", fontUrls.join(", "));
  }

  await build({
    root: cwd, // let Vite resolve from where the user runs the command
    build: {
      copyPublicDir: false,
      outDir: outAbs,
      // do not empty the whole dir in case user keeps other stuff there
      emptyOutDir: false,
      rollupOptions: {
        output: {
          // keep filenames predictable
          assetFileNames: "[name].[ext]",
        },
      },
    },
    plugins: [
      viteWebfontDownload(fontUrls, {
        assetsSubfolder: "types",
        injectAsStyleTag: false,
        subsetsAllowed,
        // only pass minifyCss if user set it, so plugin can keep its default
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
