"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function SDFInteractiveGraph() {
	const canvasReference = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasReference.current
		const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000)

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
		renderer.setSize(canvas.width, canvas.height)
		renderer.setAnimationLoop(animate)

		const geometry = new THREE.BoxGeometry(1, 1, 1)
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
		const cube = new THREE.Mesh(geometry, material)

		const scene = new THREE.Scene()
		scene.add(cube)

		camera.position.z = 5

		function animate(time: number) {
			cube.rotation.x = time / 2000
			cube.rotation.y = time / 1000

			renderer.render(scene, camera)
		}
	})

	return <canvas ref={canvasReference} width={200} height={200} className="w-40 h-40 min-w-0 min-h-0 rounded-md border border-theme-bg-2" />
}
