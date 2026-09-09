# Personal website

Here you can find the source code for my own personal website.

## Table of contents

- [Personal website](#personal-website)
  - [Table of contents](#table-of-contents)
  - [Tech stack](#tech-stack)
  - [Building the website](#building-the-website)
  - [Building the WebAssembly objects](#building-the-webassembly-objects)
  - [Deployment](#deployment)

## Tech stack

- [TypeScript](https://www.typescriptlang.org/)
- [Nextjs](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind](https://tailwindcss.com/)
- [Shiki](https://shiki.style)
- [Emscripten](https://emscripten.org/)
- ... and more (check `package.json`)

## Building the website

Install the necessary development dependencies with:

```bash
npm install --include=dev # or npm ci
```

Then, you can build the website by running:

```bash
npm run build
```

Or for development:

```bash
npm run dev
```

This will create a `dist` folder with the built files. You can then serve this folder with any static file server.

## Building the WebAssembly objects

Install [emsdk](https://emscripten.org/docs/getting_started/downloads.html) (already includes `emcc`/`em++`).  
Then run `emsdk activate --permanent/--system` and after that select the WebAssembly Build preset and use CMake as normal.

## Deployment

GitHub Pages was abandoned because of its ~500 MB artifact limit.  
Cloudflare Pages has no total-size cap (20k files 25MiB each).  

`next dev --webpack` writes its cache into `dist/dev/` because `distDir` is `"dist"`. If you deploy without a clean build, that cache (single files >100 MB) gets uploaded and fails.
