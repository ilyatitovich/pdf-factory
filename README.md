# PDF Factory

Client-side PDF split tool. Files never leave the browser: Go/pdfcpu runs as WASM inside a Web Worker, nanostores hold UI state, Svelte 5 is a thin view.

## Prerequisites

- [pnpm](https://pnpm.io) (see `packageManager` in `package.json`)
- [Go](https://go.dev) (latest stable) for `GOOS=js GOARCH=wasm`

## Setup

```bash
pnpm install
pnpm build:wasm
pnpm dev
```

`build:wasm` copies `wasm_exec.js` from your Go toolchain and builds `public/pdf.wasm`. It runs automatically before `pnpm build`.

## Scripts

| Script         | Purpose                                      |
| -------------- | -------------------------------------------- |
| `pnpm dev`     | Vite dev server                              |
| `pnpm build:wasm` | Build Go → `public/pdf.wasm` + `wasm_exec.js` |
| `pnpm build`   | Production Vite build (runs `prebuild` first)|
| `pnpm preview` | Preview production build                     |
| `pnpm check`   | `svelte-check` + `tsc`                       |
