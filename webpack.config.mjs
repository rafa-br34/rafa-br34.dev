import MiniCssExtractPlugin   from "mini-css-extract-plugin"
import ESLintWebpackPlugin    from "eslint-webpack-plugin"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import HtmlWebpackPlugin      from "html-webpack-plugin"
import CopyWebpackPlugin      from "copy-webpack-plugin"
import webpack                from "webpack"

import { argv }          from "process"
import path              from "path"
import { fileURLToPath } from "url"

import { htmlWebpackPluginTemplateCustomizer } from "template-ejs-loader"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const Entries = {
	"index": "./src/index.ts",
	"gallery": "./src/gallery.ts",
	"projects": "./src/projects.ts",
	"background": "./src/background.ts"
}
const Pages = [
	{
		Source: "index.ejs",
		Result: "index.html",
		Chunks: [ "index", "background" ]
	},
	{
		Source: "gallery.ejs",
		Result: "gallery.html",
		Chunks: [ "gallery", "background" ]
	},
	{
		Source: "projects.ejs",
		Result: "projects.html",
		Chunks: [ "projects", "background" ]
	},
	{
		Source: "background.ejs",
		Result: "background.html",
		Chunks: [ "background" ]
	}
]

for (let Page of Pages)
	for (let Chunk of Page.Chunks)
		if (!Entries[Chunk])
			throw new Error(`Could not find source file for chunk "${Chunk}" in page "${Page.Source}"`)

export default {
	entry: Entries,
	mode: argv.mode,
	devtool: "source-map",
	output: {
		filename: "js/[name].bundle.js",
		path: path.resolve(__dirname, "dist"),
		clean: true
	},

	resolve: {
		extensions: [".tsx", ".ts", ".js"]
	},

	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/
			},
			{
				test: /\.(scss|sass|css)$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader",
					"sass-loader"
				]
			},
			{
				test: /\.ejs$/i,
				use: [
					"html-loader",
					"template-ejs-loader"
				],
			}
		]
	},
	plugins: [
		new CleanWebpackPlugin(),

		new webpack.ProvidePlugin({
			"$": "jquery",
			jQuery: "jquery",
		}),

		...Pages.map((Value) => {
			return new HtmlWebpackPlugin({
				inject: "head",
				scriptLoading: "defer",
				filename: Value.Result,
				chunks: Value.Chunks,
				template: htmlWebpackPluginTemplateCustomizer({
					templatePath: `./static/${Value.Source}`,

					htmlLoaderOption:{
						sources: false
					},

					templateEjsLoaderOption: {
						root: "",
						data: {}
					}
				}),
			})
		}),

		new MiniCssExtractPlugin({
			filename: "style/index.css"
		}),

		new CopyWebpackPlugin({
			patterns: [
				{ from: "assets", to: "assets" },
				{ from: "static/robots.txt", to: "" },
				{ from: "static/CNAME", to: "" },
				{ from: "src/**/*.wasm", to: "js/[name][ext]" },
			]
		}),

		new ESLintWebpackPlugin({
			extensions: ["ts"],
			failOnError: false,
			overrideConfigFile: path.resolve(__dirname, ".eslintrc.cjs")
		})
	],

	devServer: {
		static: path.join(__dirname, "dist"),
		port: 3000,
		hot: true,
		open: true
	},

	experiments: {
		asyncWebAssembly: true,
		topLevelAwait: true
	}
};