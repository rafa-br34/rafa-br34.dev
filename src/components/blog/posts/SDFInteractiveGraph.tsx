"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

export function SDFInteractiveGraph() {
	const canvasReference = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasReference.current
		if (!canvas) {
			return
		}

		const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 100)
		camera.position.z = 5

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" })
		renderer.setSize(canvas.width, canvas.height)

		// const geometry = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
		const geometry = new THREE.BoxGeometry(1, 1, 1)
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
		const cube = new THREE.Mesh(geometry, material)

		const scene = new THREE.Scene()
		scene.add(cube)

		const controls = new OrbitControls(camera, canvas)
		controls.addEventListener("change", renderer.render.bind(renderer, scene, camera))
		controls.update()
		renderer.render(scene, camera)

		// renderer.setAnimationLoop(animate)

		return () => {
			renderer.setAnimationLoop(null)
			controls.dispose()
			geometry.dispose()
			material.dispose()
			renderer.dispose()
		}
	}, [])

	return <canvas ref={canvasReference} width={400} height={400} className="w-80 h-80 min-w-0 min-h-0 rounded-md border border-theme-bg-2" />
}
