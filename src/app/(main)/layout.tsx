import { Footer } from "@/components/Footer"
import { Navbar } from "@/components/Navbar"
import { ParticleBackground } from "@/components/backgrounds/ParticleBackground"

export default function MainLayout({ children }: { readonly children: React.ReactNode }) {
	return (
		<div className="h-screen w-full">
			<div className="relative w-full h-screen text-theme-fg-0 overflow-y-auto overflow-x-clip flex flex-col">
				<Navbar />
				<main className="flex-1">{children}</main>
				<Footer />
				<ParticleBackground className="fixed inset-0 -z-10" />
			</div>
		</div>
	)
}
