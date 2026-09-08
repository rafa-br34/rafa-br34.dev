import { LoaderCircle } from "lucide-react"

// @todo Possibly unify this into a universal loading spinner
export function GalleryLoadingMask() {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
			<LoaderCircle className="h-8 w-8 animate-spin text-theme-fg-0" />
		</div>
	)
}
