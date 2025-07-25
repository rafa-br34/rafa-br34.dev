import MiniCssExtractPlugin   from "mini-css-extract-plugin"
import ESLintWebpackPlugin    from "eslint-webpack-plugin"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import HtmlWebpackPlugin      from "html-webpack-plugin"
import CopyWebpackPlugin      from "copy-webpack-plugin"

import { argv }          from "process"
import path              from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
	entry: "./src/index.ts",
	mode: argv.mode,
	devtool: "source-map",

	output: {
		filename: "js/index.js",
		path: path.resolve(__dirname, "dist"),
		clean: true
	},

	resolve: {
		extensions: [".ts", ".js"]
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
			}
		]
	},
	plugins: [
		new CleanWebpackPlugin(),

		new HtmlWebpackPlugin({
			template: "static/index.html",
			inject: "body",
			scriptLoading: "defer"
		}),

		new MiniCssExtractPlugin({
			filename: "style/index.css"
		}),

		new CopyWebpackPlugin({
			patterns: [
				{ from: "assets", to: "assets" },
				{ from: "static/robots.txt", to: "" },
				{ from: "static/CNAME", to: "" },
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
	}
};