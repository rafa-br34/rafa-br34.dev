import { Route, Routes } from "react-router-dom"
import { FullscreenLayout } from "./layouts/FullscreenLayout"
import { RootLayout } from "./layouts/RootLayout"
import { BackgroundPage } from "./pages/Background"
import { Gallery } from "./pages/Gallery/index"
import { Home } from "./pages/Home"
import { Projects } from "./pages/Projects"

export function App() {
	return (
		<Routes>
			<Route element={<RootLayout />}>
				<Route index element={<Home />} />
				<Route path="gallery" element={<Gallery />} />
				<Route path="projects" element={<Projects />} />
			</Route>
			<Route element={<FullscreenLayout />}>
				<Route path="background" element={<BackgroundPage />} />
			</Route>
		</Routes>
	)
}
