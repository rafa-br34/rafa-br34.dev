import { Outlet } from "react-router-dom"
import { Footer } from "../components/Footer"
import { Navbar } from "../components/Navbar"
import { ParticleBackground } from "../components/ParticleBackground"

export function RootLayout(
	{
		includeNavbar = true,
		includeFooter = true,
	}: {
		readonly includeNavbar?: boolean
		readonly includeFooter?: boolean
	},
) {
	return (
		<div className="h-screen w-full">
			<div className="relative w-full h-screen text-theme-fg-0 overflow-y-auto overflow-x-clip flex flex-col">
				{includeNavbar ? <Navbar /> : null}
				<ParticleBackground className="fixed inset-0 -z-10" />

				<main className="flex-1">
					<Outlet />
				</main>
				{includeFooter ? <Footer /> : null}
			</div>
		</div>
	)
}
