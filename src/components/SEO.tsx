import { Helmet } from "react-helmet-async"

export function SEO(
	{
		title,
		canonicalPath,
		description,
	}: {
		readonly title: string
		readonly canonicalPath: string
		readonly description?: string
	},
) {
	return (
		<Helmet>
			<title>{title}</title>
			<link rel="canonical" href={`https://rafa-br34.dev${canonicalPath}`} />
			{description && <meta name="description" content={description} />}
		</Helmet>
	)
}
