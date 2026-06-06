import "./styles/theme.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HelmetProvider } from "react-helmet-async"
import { BrowserRouter } from "react-router-dom"
import { App } from "./app"

import { TooltipProvider } from "@/components/ui/tooltip"

const root = createRoot(document.getElementById("root"))
root.render(
	<StrictMode>
		<HelmetProvider>
			<BrowserRouter>
				<TooltipProvider>
					<App />
				</TooltipProvider>
			</BrowserRouter>
		</HelmetProvider>
	</StrictMode>,
)
