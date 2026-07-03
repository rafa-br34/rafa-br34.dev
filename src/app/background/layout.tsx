import { ParticleBackground } from "@/components/backgrounds/ParticleBackground"

export default function BackgroundLayout({ children }: { readonly children: React.ReactNode }) {
	return (
		<div className="relative h-full w-full">
			<ParticleBackground className="absolute inset-0" />
			{children}
		</div>
	)
}
