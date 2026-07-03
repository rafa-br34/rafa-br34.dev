import type { Metadata } from "next"
import { ReactNode } from "react"

import { TooltipProvider } from "@/components/ui/tooltip"

import "@/styles/theme.css"

export const metadata: Metadata = {
	title: {
		template: "%s - rafa_br34",
		default: "rafa_br34 - About me and my projects",
	},
	description: "rafa_br34 is someone who codes C/C++, Python, TypeScript, a bit of Verilog/SystemVerilog and more.",
	metadataBase: new URL("https://rafa-br34.dev"),
	openGraph: {
		type: "profile",
		siteName: "rafa_br34.dev",
		locale: "en_US",
		images: "/assets/artwork/gummi_arts_banner.png",
	},
	twitter: {
		card: "summary_large_image",
		site: "@rafa_br34",
		creator: "@rafa_br34",
	},
	icons: "/assets/favicon.png",
}

export default function RootLayout({ children }: { readonly children: ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<meta name="theme-color" content="#ffffff" />
				<meta
					name="keywords"
					content="rafa_br34, rafa-br34, rafabr34, programming, c, c++, python, web development, personal projects, furry, furred dragon, portfolio, biography"
				/>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "Person",
							"email": "mailto:rafa_br34@exulan.com.au",
							"givenName": "Rafael",
							"name": "rafa_br34",
							"alternateName": ["rafabr34", "rafa-br34"],
							"url": "https://rafa-br34.dev",
							"nationality": { "@type": "Country", "name": "Brazil" },
							"gender": "Male",
							"jobTitle": "Programmer, network engineer, and more",
							"worksFor": { "@type": "Organization", "name": "Independent Research" },
							"knowsAbout": [
								"Networking",
								"Network protocols",
								"Network engineering",
								"Cryptography",
								"Low-level programming",
								"TypeScript",
								"Linux",
								"Python",
								"C++",
							],
							"description":
								"rafa_br34 is someone who codes C/C++, Python, TypeScript, a bit of Verilog/SystemVerilog and more. Also, they might be a fluffy feral dragon!",
							"image": "https://rafa-br34.dev/assets/artwork/o_pastelzera_portrait.png",
							"sameAs": [
								"https://github.com/rafa-br34",
								"https://github.com/rafabr34",
								"https://www.furaffinity.net/user/rafa-br34",
								"https://bsky.app/profile/r34.bsky.social",
								"https://www.youtube.com/@rafa_br34",
								"https://steamcommunity.com/id/rafa_br34",
							],
						}),
					}}
				/>
			</head>
			<body id="root">
				<TooltipProvider>
					{children}
				</TooltipProvider>
			</body>
		</html>
	)
}
