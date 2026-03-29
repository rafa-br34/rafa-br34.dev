# Personal website

Here you can find the source code for my own personal website, built with Webpack, UIkit, SASS, Emscripten, TypeScript, and EJS.

## Table of contents

- [Personal website](#personal-website)
  - [Table of contents](#table-of-contents)
  - [Building the website](#building-the-website)
  - [Building the WebAssembly objects](#building-the-webassembly-objects)

## Building the website

Install the necessary development dependencies with:

```bash
npm install --include=dev
```

Then, you can build the website by running:

```bash
npm run build
```

Or for development:

```bash
npm run build-dev
```

This will create a `dist` folder with the built files. You can then serve this folder with any static file server.

## Building the WebAssembly objects

Install [emsdk](https://emscripten.org/docs/getting_started/downloads.html) (already includes `emcc`/`em++`) and then run `emsdk activate --permanent/--system`
After that select the WebAssembly Build preset and use cmake as normal.
