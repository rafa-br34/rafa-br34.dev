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

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
		renderer.setPixelRatio(window.devicePixelRatio)

		const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100)
		camera.position.z = 5

		const geometry = new THREE.BoxGeometry(1, 1, 1)
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
		const cube = new THREE.Mesh(geometry, material)

		const scene = new THREE.Scene()
		scene.add(cube)

		const controls = new OrbitControls(camera, canvas)

		// Size the drawing buffer from the canvas' CSS box (scaled by
		// devicePixelRatio) without letting three.js override the CSS layout size.
		function resize() {
			const { clientWidth, clientHeight } = canvas
			if (clientWidth === 0 || clientHeight === 0) {
				return
			}
			camera.aspect = clientWidth / clientHeight
			camera.updateProjectionMatrix()
			renderer.setSize(clientWidth, clientHeight, false)
		}

		resize()
		const observer = new ResizeObserver(resize)
		observer.observe(canvas)

		function animate(time: number) {
			cube.rotation.x = time / 2000
			cube.rotation.y = time / 1000
			controls.update()
			renderer.render(scene, camera)
		}

		renderer.setAnimationLoop(animate)

		return () => {
			observer.disconnect()
			renderer.setAnimationLoop(null)
			controls.dispose()
			geometry.dispose()
			material.dispose()
			renderer.dispose()
		}
	}, [])

	return <canvas ref={canvasReference} className="h-40 w-40 min-h-0 min-w-0 rounded-md border border-theme-bg-2" />
}
