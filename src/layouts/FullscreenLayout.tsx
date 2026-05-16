import { Outlet } from "react-router-dom"
import { ParticleBackground } from "../components/ParticleBackground"

export function FullscreenLayout() {
	return (
		<div className="relative h-full w-full">
			<ParticleBackground className="absolute inset-0" />
			<Outlet />
		</div>
	)
}
