import { CleanWebpackPlugin } from "clean-webpack-plugin"
import CopyWebpackPlugin from "copy-webpack-plugin"
import ESLintWebpackPlugin from "eslint-webpack-plugin"
import HtmlWebpackPlugin from "html-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"

import path from "path"
import { argv } from "process"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const Entries = {
	main: "./src/main.tsx",
}

const Pages = [
	{ Result: "index.html" },
	{ Result: "gallery.html" },
	{ Result: "projects.html" },
	{ Result: "background.html" },
]

export default {
	entry: Entries,
	mode: argv.mode,
	devtool: "source-map",
	output: {
		filename: "js/[name].bundle.js",
		path: path.resolve(__dirname, "dist"),
		clean: true,
	},

	resolve: {
		extensions: [".tsx", ".ts", ".js"],
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},

	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader",
					"postcss-loader",
				],
			},
		],
	},
	plugins: [
		new CleanWebpackPlugin(),

		...Pages.map(({ Result }) => {
			return new HtmlWebpackPlugin({
				inject: "head",
				scriptLoading: "defer",
				filename: Result,
				chunks: ["main"],
				template: "./static/index.html",
			})
		}),

		new MiniCssExtractPlugin({
			filename: "style/index.css",
		}),

		new CopyWebpackPlugin({
			patterns: [
				{ from: "assets", to: "assets" },
				{ from: "static/robots.txt", to: "" },
				{ from: "static/CNAME", to: "" },
				{ from: "src/**/*.wasm", to: "js/[name][ext]" },
			],
		}),

		new ESLintWebpackPlugin({
			extensions: ["ts", "tsx"],
			failOnError: false,
			overrideConfigFile: path.resolve(__dirname, ".eslintrc.cjs"),
		}),
	],

	devServer: {
		static: path.join(__dirname, "dist"),
		port: 3000,
		hot: true,
		open: true,
		historyApiFallback: {
			rewrites: [
				{ from: /^\/gallery$/, to: "/gallery.html" },
				{ from: /^\/projects$/, to: "/projects.html" },
				{ from: /^\/background$/, to: "/background.html" },
				{ from: /./, to: "/index.html" },
			],
		},
	},

	experiments: {
		asyncWebAssembly: true,
		topLevelAwait: true,
	},
}
