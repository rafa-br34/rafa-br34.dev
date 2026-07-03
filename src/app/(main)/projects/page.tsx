import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "Projects",
	alternates: { canonical: "/projects" },
}

import ProjectsContent from "./_content"

export default function Page() {
	return <ProjectsContent />
}
