import typescript   from "rollup-plugin-typescript2"
import resolve      from "@rollup/plugin-node-resolve"
import postcss      from "rollup-plugin-postcss"
import clear        from "rollup-plugin-clear"
import copy         from "rollup-plugin-copy"


export default {
	input: "src/index.ts",
	treeshake: "smallest",
	output: {
		file: "dist/index.js",
		format: "iife",
		sourcemap: true,
		inlineDynamicImports: true,
		compact: true
	},
	plugins: [
		clear({ targets: ["dist/"] }),

		resolve({ extensions: [".js", ".ts"], browser: true }),
		typescript({ tsconfig: "./tsconfig.json" }),

		postcss({
			extract: "index.css",
			minimize: true,
			sourceMap: true,
			extensions: [".sass", ".scss", ".css"],
			use: {
				sass: true,
			}
		}),

		copy({
			targets: [
				{ src: "html/*", dest: "dist/" },
				{ src: "assets/*", dest: `dist/assets` },
			]
		}),
	]
}