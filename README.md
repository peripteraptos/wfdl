# wfdl

**wfdl** is a tiny CLI around [`vite-plugin-webfont-dl`](https://github.com/feat-agency/vite-plugin-webfont-dl) that lets you download remote webfonts (e.g. from Google Fonts) into a real directory in your project — **without** having to set up a full Vite app.

It spins up a minimal Vite build, asks the plugin to download the fonts, and then strips out Vite’s default JS/HTML output so you only get the useful assets (CSS + font files).

---

## Features

- ✅ Download fonts from remote CSS URLs
- ✅ Keep the generated CSS (not injected as `<style>`)
- ✅ Output to a directory of your choice
- ✅ CLI **and** config file
- ✅ `--dry-run` for CI / testing
- ✅ Supports `subsetsAllowed` and `minifyCss` passthrough to the plugin

---

## Installation

```bash
npm i -D wfdl
# or
npx wfdl --help
````

You must have Node 18+.

---

## Usage

### CLI

```bash
wfdl --font "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap"
```

This will create a `./fonts` directory (or reuse it) and write the CSS + font files there.

### Options

```text
Usage: wfdl [options]

Options:
  -f, --font <url>         Add a font URL (can repeat)
  -o, --out <dir>          Output directory (default: ./fonts or from config)
  -c, --config <file>      Config file (wfdl.config.{js,mjs,cjs,json})
  -s, --subset <name>      Allowed subset (can repeat), e.g. latin,latin-ext
      --minify-css         Force minify CSS
      --no-minify-css      Force no CSS minification
      --dry-run            Show what would be downloaded/emitted and exit
  -v, --verbose            Verbose output
  -h, --help               Show this help

Priority: CLI > config file > defaults
```

Examples:

```bash
# multiple fonts
wfdl -f https://fonts.googleapis.com/css2?family=Roboto \
     -f https://fonts.googleapis.com/css2?family=Inter

# custom output dir
wfdl -f https://fonts.googleapis.com/css2?family=Fira+Sans -o public/fonts

# dry run (check what will happen)
wfdl -f https://fonts.googleapis.com/css2?family=Roboto --dry-run --verbose
```

---

## Config file

You can create a `wfdl.config.js` in your project root:

```js
// wfdl.config.js
export default {
  fonts: [
    "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
  ],
  outDir: "./public/fonts",
  verbose: true,
  subsetsAllowed: ["latin", "latin-ext"],
  // minifyCss: true,
  // dryRun: true,
};
```

Then just run:

```bash
wfdl
```

The CLI will look for (in this order):

1. the file you passed with `--config`
2. `wfdl.config.js`
3. `wfdl.config.mjs`
4. `wfdl.config.cjs`
5. `wfdl.config.json`

---

## Programmatic usage

You can also call it from Node:

```js
import { runWfdl } from "wfdl";

await runWfdl({
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  ],
  outDir: "./public/fonts",
  subsetsAllowed: ["latin"],
  verbose: true,
});
```

---

## How it works

* It calls Vite’s `build()` with your current working directory as the root.
* It registers `vite-plugin-webfont-dl` with your font URLs.
* It adds a tiny Rollup plugin that **removes** emitted `.js` and `.html` files, because we only want assets.
* It does **not** empty the output directory, so you can keep other things there.

---

## FAQ

**Q: Why Vite at all?**
Because `vite-plugin-webfont-dl` is already a nice solution for downloading + rewriting remote font CSS. Instead of reimplementing that logic, we run a tiny Vite build.

**Q: Will it overwrite my existing files?**
It won’t empty the directory (`emptyOutDir: false`), but files with the same name can be overwritten — keep your font dir separate to be safe.

**Q: Can I use it in CI?**
Yes. Use `--dry-run` to verify your config, or run it for real to download fonts before bundling.

---

## License

MIT