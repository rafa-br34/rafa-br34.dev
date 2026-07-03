import { Loader2 } from "lucide-react"

export function GalleryLoadingMask() {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
			<Loader2 className="h-8 w-8 animate-spin text-white" />
		</div>
	)
}
