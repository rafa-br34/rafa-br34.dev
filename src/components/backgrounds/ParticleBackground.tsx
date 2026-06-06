import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

import { type ParticleLifeInterface, ParticleLifeLoader } from "@/lib/kernels/particle_life_compute"

// @todo This entire file is a mess, revisit later.
let navigating = false
let navigatingTimeout = 0

function setNavigating() {
	navigating = true
	clearTimeout(navigatingTimeout)
	navigatingTimeout = setTimeout(
		() => {
			navigating = false
		},
		300,
	) as unknown as number
}

// We monkey patch this because that on chromium browsers the background animation sucks up too much time
// Thus React doesn't re-flow until the user interacts (scrolls up/down)
{
	const { pushState, replaceState } = globalThis.history

	if (!(globalThis as any).pushStatePatched) {
		globalThis.history.pushState = function(...args: Parameters<typeof pushState>) {
			setNavigating()
			return pushState.apply(this, args)
		}
		;(globalThis as any).pushStatePatched = true
	}

	if (!(globalThis as any).replaceStatePatched) {
		globalThis.history.replaceState = function(...args: Parameters<typeof replaceState>) {
			setNavigating()
			return replaceState.apply(this, args)
		}
		;(globalThis as any).replaceStatePatched = true
	}
}

function createShader(context: WebGL2RenderingContext, source: string, type: GLenum) {
	const shaderHandle = context.createShader(type)
	context.shaderSource(shaderHandle, source)
	context.compileShader(shaderHandle)

	if (!context.getShaderParameter(shaderHandle, context.COMPILE_STATUS)) {
		throw new Error(`Shader compilation failed\n${context.getShaderInfoLog(shaderHandle)}`)
	}

	return shaderHandle
}

export function ParticleBackground(
	{
		className,
	}: {
		readonly className?: string
	},
) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const stateRef = useRef<
		{
			animationId: number
			computeKernel: ParticleLifeInterface
			allocs: number[]
		} | null
	>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) {
			return
		}

		let destroyed = false
		let animationId = 0
		let contextLost = false

		function onContextLost(event: Event) {
			event.preventDefault()
			contextLost = true
		}

		function onContextRestored() {
			contextLost = false
		}

		canvas.addEventListener("webglcontextlost", onContextLost)
		canvas.addEventListener("webglcontextrestored", onContextRestored)

		async function init() {
			const computeKernel = await ParticleLifeLoader()

			const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true })

			if (!gl) {
				throw new Error("Failed to get WebGL2 context")
			}
			const context = gl

			const shaderResp = await Promise.all([
				fetch("/assets/shaders/background_vertex.vert"),
				fetch("/assets/shaders/background_fragment.frag"),
			])
			const vertexSource = await shaderResp[0].text()
			const fragmentSource = await shaderResp[1].text()

			const program = context.createProgram()
			context.attachShader(program, createShader(context, vertexSource, context.VERTEX_SHADER))
			context.attachShader(program, createShader(context, fragmentSource, context.FRAGMENT_SHADER))
			context.linkProgram(program)
			context.useProgram(program)

			if (!context.getProgramParameter(program, context.LINK_STATUS)) {
				throw new Error(`Linking failed:\n${context.getProgramInfoLog(program)}`)
			}

			context.disable(context.DITHER)
			context.disable(context.DEPTH_TEST)
			context.depthMask(false)
			context.enable(context.CULL_FACE)
			context.cullFace(context.FRONT)
			context.frontFace(context.CCW)
			context.enable(context.BLEND)
			context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA)
			context.blendEquation(context.FUNC_ADD)
			context.clearColor(0, 0, 0, 0)
			context.clear(context.COLOR_BUFFER_BIT)

			const uScaling = context.getUniformLocation(program, "uScaling")
			const uRadius = context.getUniformLocation(program, "uRadius")
			const aModel = context.getAttribLocation(program, "aModel")
			const aProperties = context.getAttribLocation(program, "aProperties")
			const aPositionX = context.getAttribLocation(program, "aPositionX")
			const aPositionY = context.getAttribLocation(program, "aPositionY")

			// dprint-ignore
			const model = new Float32Array([
				 0,             2,
				 Math.sqrt(3), -1,
				-Math.sqrt(3), -1,
			])

			const scaleMultiplier = 1024 * 40
			const particleMatrixSize = 6
			const particleCount = 1024 * 10
			const particleSize = 128

			const sizeParticleMatrix = particleMatrixSize * particleMatrixSize
			const sizeParticleTypes = particleCount

			const allocParticlePosX = computeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * particleCount)
			const allocParticlePosY = computeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * particleCount)
			const allocParticleVelX = computeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * particleCount)
			const allocParticleVelY = computeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * particleCount)
			const allocParticleMatrix = computeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * sizeParticleMatrix)
			const allocParticleTypes = computeKernel._malloc(Uint8Array.BYTES_PER_ELEMENT * sizeParticleTypes)

			const allocs = [
				allocParticlePosX,
				allocParticlePosY,
				allocParticleVelX,
				allocParticleVelY,
				allocParticleMatrix,
				allocParticleTypes,
			]

			const particlePosX = new Float32Array(computeKernel.HEAPF32.buffer, allocParticlePosX, particleCount)
			const particlePosY = new Float32Array(computeKernel.HEAPF32.buffer, allocParticlePosY, particleCount)
			const particleVelX = new Float32Array(computeKernel.HEAPF32.buffer, allocParticleVelX, particleCount)
			const particleVelY = new Float32Array(computeKernel.HEAPF32.buffer, allocParticleVelY, particleCount)
			const particleMatrix = new Float32Array(computeKernel.HEAPF32.buffer, allocParticleMatrix, sizeParticleMatrix)
			const particleTypes = new Uint8Array(computeKernel.HEAPU8.buffer, allocParticleTypes, sizeParticleTypes)

			for (let i = 0; i < particleMatrixSize * particleMatrixSize; i++) {
				particleMatrix[i] = 2 * Math.random() - 1
			}

			const spinDirection = Math.random() > 0.5 ? 1 : -1
			const spinSpeed = 0.05
			const numArms = 6
			const twistFactor = 0.00025
			const maxRadius = scaleMultiplier * 0.8

			for (let i = 0; i < particleCount; i++) {
				const armIndex = i % numArms
				const armOffset = (armIndex / numArms) * Math.PI * 2
				const t = i / particleCount
				const radius = t * maxRadius + Math.random() * maxRadius * 0.02
				const spiralAngle = radius * twistFactor + armOffset + (Math.random() - 0.5) * 0.15
				particlePosX[i] = Math.sin(spiralAngle) * radius * spinDirection
				particlePosY[i] = Math.cos(spiralAngle) * radius
				particleTypes[i] = Math.floor(Math.random() * particleMatrixSize)
				particleVelX[i] = -particlePosY[i] * spinSpeed * spinDirection
				particleVelY[i] = particlePosX[i] * spinSpeed * spinDirection
			}

			const vaoPointer = context.createVertexArray()
			context.bindVertexArray(vaoPointer)

			const vboModel = context.createBuffer()
			context.bindBuffer(context.ARRAY_BUFFER, vboModel)
			context.bufferData(context.ARRAY_BUFFER, model, context.STATIC_DRAW)
			context.enableVertexAttribArray(aModel)
			context.vertexAttribPointer(aModel, 2, context.FLOAT, false, 0, 0)
			context.vertexAttribDivisor(aModel, 0)

			const vboParticlePosX = context.createBuffer()
			context.bindBuffer(context.ARRAY_BUFFER, vboParticlePosX)
			context.bufferData(context.ARRAY_BUFFER, particlePosX, context.STREAM_DRAW)
			context.enableVertexAttribArray(aPositionX)
			context.vertexAttribPointer(aPositionX, 1, context.FLOAT, false, 0, 0)
			context.vertexAttribDivisor(aPositionX, 1)

			const vboParticlePosY = context.createBuffer()
			context.bindBuffer(context.ARRAY_BUFFER, vboParticlePosY)
			context.bufferData(context.ARRAY_BUFFER, particlePosY, context.STREAM_DRAW)
			context.enableVertexAttribArray(aPositionY)
			context.vertexAttribPointer(aPositionY, 1, context.FLOAT, false, 0, 0)
			context.vertexAttribDivisor(aPositionY, 1)

			const vboParticleTypes = context.createBuffer()
			context.bindBuffer(context.ARRAY_BUFFER, vboParticleTypes)
			context.bufferData(context.ARRAY_BUFFER, particleTypes, context.STATIC_DRAW)
			context.enableVertexAttribArray(aProperties)
			context.vertexAttribIPointer(aProperties, 1, context.UNSIGNED_BYTE, 0, 0)
			context.vertexAttribDivisor(aProperties, 1)

			let scalingX = 0
			let scalingY = 0

			function updateSize() {
				const cx = canvas.clientWidth
				const cy = canvas.clientHeight

				canvas.width = cx
				canvas.height = cy

				context.viewport(0, 0, cx, cy)

				let rx: number, ry: number

				if (cx < cy) {
					rx = scaleMultiplier
					ry = (cy / cx) * scaleMultiplier
				}
				else {
					rx = (cx / cy) * scaleMultiplier
					ry = scaleMultiplier
				}

				scalingX = rx
				scalingY = ry

				context.uniform2f(uScaling, rx, ry)
				context.uniform1f(uRadius, particleSize)
			}

			window.addEventListener("resize", updateSize)
			updateSize()

			let lastFrame = performance.now()
			let frameSkip = 0
			const speed = 1.75 / (1 / 75)

			function updateFrame(currFrame: number = 0) {
				if (destroyed || contextLost) {
					return
				}

				// @todo Find a better way than this
				// Skip 1/4 frames when navigating (Check the monkey patch at the start of the file)
				if (navigating && frameSkip++ % 4 === 0) {
					animationId = requestAnimationFrame(updateFrame)
					return
				}

				const delta = Math.max((currFrame - lastFrame) / 1000, 0)
				const timeStep = Math.min(speed * delta, 2)
				lastFrame = currFrame

				computeKernel._compute_kernel_fast(
					allocParticleMatrix,
					particleMatrixSize,
					allocParticleTypes,
					allocParticlePosX,
					allocParticlePosY,
					allocParticleVelX,
					allocParticleVelY,
					particleCount,
					0.3,
					2048,
					0.9,
					2,
					timeStep,
					scalingX + particleSize,
					scalingY + particleSize,
				)

				context.clearColor(0, 0, 0, 0)
				context.clear(context.COLOR_BUFFER_BIT)

				context.bindBuffer(context.ARRAY_BUFFER, vboParticlePosX)
				context.bufferSubData(context.ARRAY_BUFFER, 0, particlePosX)
				context.bindBuffer(context.ARRAY_BUFFER, vboParticlePosY)
				context.bufferSubData(context.ARRAY_BUFFER, 0, particlePosY)
				context.bindBuffer(context.ARRAY_BUFFER, vboParticleTypes)

				context.drawArraysInstanced(context.TRIANGLES, 0, 3, particleCount)

				animationId = requestAnimationFrame(updateFrame)
			}

			stateRef.current = { animationId, computeKernel, allocs }
			animationId = requestAnimationFrame(updateFrame)
		}

		init().catch(console.error)

		return () => {
			destroyed = true
			cancelAnimationFrame(stateRef.current?.animationId ?? animationId)
			canvas.removeEventListener("webglcontextlost", onContextLost)
			canvas.removeEventListener("webglcontextrestored", onContextRestored)
			const state = stateRef.current

			if (state) {
				for (const ptr of state.allocs) {
					state.computeKernel._free(ptr)
				}
			}
		}
	}, [])

	return (
		<canvas
			ref={canvasRef}
			className={cn("w-full h-full pointer-events-none block", className)}
		/>
	)
}
