"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useEffect, useState } from "react"

const chartConfig = {
	r: {
		label: "Red",
	},
	g: {
		label: "Green",
	},
	b: {
		label: "Blue",
	},
} satisfies ChartConfig

export function DemoGraph() {
	const [chartData, setChartData] = useState<{ index: number; r: number; g: number; b: number }[]>()

	useEffect(() => {
		const entries = []

		for (let index = 0; index < 16; index++) {
			entries.push({ index, r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 })
		}

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setChartData(entries)
	}, [])

	return (
		<ChartContainer config={chartConfig} className="my-4 h-24 min-h-[200px] w-full">
			<BarChart accessibilityLayer data={chartData}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="index"
					tickLine={false}
					tickMargin={10}
					axisLine={false}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey="r" fill="var(--color-theme-r-1)" radius={4} />
				<Bar dataKey="g" fill="var(--color-theme-g-2)" radius={4} />
				<Bar dataKey="b" fill="var(--color-theme-b-2)" radius={4} />
			</BarChart>
		</ChartContainer>
	)
}
