import { useEffect, useState } from "react"
import yaml from "yaml"

import type { Catalog } from "@/lib/catalog"

export function useCatalog(): {
	catalog: Catalog | null
	loading: boolean
	error: Error | null
} {
	const [catalog, setCatalog] = useState<Catalog | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		let cancelled = false

		fetch("/assets/artwork/_catalog.yml")
			.then(res => {
				if (!res.ok) {
					throw new Error(`HTTP ${res.status}`)
				}

				return res.text()
			})
			.then(text => {
				if (!cancelled) {
					setCatalog(yaml.parse(text))
					setLoading(false)
				}
			})
			.catch(err => {
				if (!cancelled) {
					setError(err)
					setLoading(false)
				}
			})

		return () => {
			cancelled = true
		}
	}, [])

	return { catalog, loading, error }
}
