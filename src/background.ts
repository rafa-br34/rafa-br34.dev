import "../style/style.scss"
import { ComputeKernelLoader } from "./background_compute"

import $ from "jquery"

function CreateShader(Context: WebGL2RenderingContext, Source: string, Type: GLenum) {
	let ShaderHandle = Context.createShader(Type)

	Context.shaderSource(ShaderHandle, Source)
	Context.compileShader(ShaderHandle)

	if (!Context.getShaderParameter(ShaderHandle, Context.COMPILE_STATUS)) {
		throw new Error(`Shader compilation failed\n${Context.getShaderInfoLog(ShaderHandle)}`)
	}

	return ShaderHandle
}

async function GetShaders(ShaderNames: string[]) {
	let Coroutines = []
	let ShaderSources: Record<string, string> = {}

	for (let Filename of ShaderNames) {
		Coroutines.push(
			$.get(`assets/shaders/${Filename}`).done(Source => ShaderSources[Filename] = Source as string),
		)
	}

	await Promise.allSettled(Coroutines)

	return ShaderSources
}

declare global {
	interface Window {
		particle_entries: Float32Array
		particle_matrix: Float32Array
		particle_types: Uint8Array
	}
}

async function Main() {
	const ComputeKernel = await ComputeKernelLoader()

	let JQueryCanvas = $("#InteractiveBackground")

	if (!JQueryCanvas.length) {
		return
	}

	let Canvas = JQueryCanvas[0] as HTMLCanvasElement
	let Context = Canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true })

	if (!Context) {
		throw new Error("Failed to get context")
	}

	let Shaders = await GetShaders([
		"background_fragment.frag",
		"background_vertex.vert",
	])

	let Program = Context.createProgram()
	Context.attachShader(Program, CreateShader(Context, Shaders["background_vertex.vert"], Context.VERTEX_SHADER))
	Context.attachShader(Program, CreateShader(Context, Shaders["background_fragment.frag"], Context.FRAGMENT_SHADER))
	Context.linkProgram(Program)
	Context.useProgram(Program)

	if (!Context.getProgramParameter(Program, Context.LINK_STATUS)) {
		throw new Error(`Linking failed:\n${Context.getProgramInfoLog(Program)}`)
	}

	Context.disable(Context.DITHER)

	// Disable depth buffer
	Context.disable(Context.DEPTH_TEST)
	Context.depthMask(false)

	// Cull back faces
	Context.enable(Context.CULL_FACE)
	Context.cullFace(Context.FRONT)
	Context.frontFace(Context.CCW)

	// Enable transparency blending
	Context.enable(Context.BLEND)
	Context.blendFunc(Context.SRC_ALPHA, Context.ONE_MINUS_SRC_ALPHA)
	Context.blendEquation(Context.FUNC_ADD)

	Context.clearColor(0, 0, 0, 0)
	Context.clear(Context.COLOR_BUFFER_BIT)

	let u_Scaling = Context.getUniformLocation(Program, "u_Scaling")
	let u_Radius = Context.getUniformLocation(Program, "u_Radius")

	let a_Model = Context.getAttribLocation(Program, "a_Model")
	let a_Properties = Context.getAttribLocation(Program, "a_Properties")
	let a_Position_X = Context.getAttribLocation(Program, "a_Position_X")
	let a_Position_Y = Context.getAttribLocation(Program, "a_Position_Y")

	let Scaling_X = 0
	let Scaling_Y = 0

	let Model = new Float32Array([
		0,
		2,
		Math.sqrt(3),
		-1,
		-Math.sqrt(3),
		-1,
	])

	const ScaleMultiplier = 1024 * 40
	const ParticleMatrixSize = 6
	const ParticleCount = 1024 * 8
	const ParticleSize = 128

	let Size_ParticleMatrix = ParticleMatrixSize * ParticleMatrixSize
	let Size_ParticleTypes = ParticleCount

	let Alloc_ParticlePosX = ComputeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * ParticleCount)
	let Alloc_ParticlePosY = ComputeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * ParticleCount)
	let Alloc_ParticleVelX = ComputeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * ParticleCount)
	let Alloc_ParticleVelY = ComputeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * ParticleCount)
	let Alloc_ParticleMatrix = ComputeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * Size_ParticleMatrix)
	let Alloc_ParticleTypes = ComputeKernel._malloc(Uint8Array.BYTES_PER_ELEMENT * Size_ParticleTypes)

	let ParticlePosX = new Float32Array(ComputeKernel.HEAPF32.buffer, Alloc_ParticlePosX, ParticleCount)
	let ParticlePosY = new Float32Array(ComputeKernel.HEAPF32.buffer, Alloc_ParticlePosY, ParticleCount)
	let ParticleVelX = new Float32Array(ComputeKernel.HEAPF32.buffer, Alloc_ParticleVelX, ParticleCount)
	let ParticleVelY = new Float32Array(ComputeKernel.HEAPF32.buffer, Alloc_ParticleVelY, ParticleCount)
	let ParticleMatrix = new Float32Array(ComputeKernel.HEAPF32.buffer, Alloc_ParticleMatrix, Size_ParticleMatrix)
	let ParticleTypes = new Uint8Array(ComputeKernel.HEAPU8.buffer, Alloc_ParticleTypes, Size_ParticleTypes)

	for (let i = 0; i < ParticleMatrixSize * ParticleMatrixSize; i++) {
		ParticleMatrix[i] = 2 * Math.random() - 1
	}

	const Half = ParticleCount / 2

	for (let i = 0; i < Half; i++) {
		let Rotation = Math.random() * Math.PI * 2
		let Radius = Math.random() * 1024 * 4

		ParticlePosX[i] = Math.sin(Rotation) * Radius
		ParticlePosY[i] = Math.cos(Rotation) * Radius
		ParticleTypes[i] = Math.floor(Math.random() * ParticleMatrixSize)
	}

	for (let i = 0; i < Half; i++) {
		let Rotation = Math.random() * Math.PI * 2
		let Radius = Math.random() * ScaleMultiplier

		ParticlePosX[i + Half] = Math.sin(Rotation) * Radius
		ParticlePosY[i + Half] = Math.cos(Rotation) * Radius
		ParticleTypes[i + Half] = Math.floor(Math.random() * ParticleMatrixSize)
	}

	;(globalThis as any).particle_arrays = [
		ParticlePosX,
		ParticlePosY,
		ParticleVelX,
		ParticleVelY,
	]
	;(globalThis as any).particle_matrix = ParticleMatrix
	;(globalThis as any).particle_types = ParticleTypes

	// @todo For the love of god abstract this asap
	// Create access pointer
	let VAO_Pointer = Context.createVertexArray()
	Context.bindVertexArray(VAO_Pointer)

	// Create base model buffer
	let VBO_Model = Context.createBuffer()
	Context.bindBuffer(Context.ARRAY_BUFFER, VBO_Model)
	Context.bufferData(Context.ARRAY_BUFFER, Model, Context.STATIC_DRAW)

	// Link base model to pipeline
	Context.enableVertexAttribArray(a_Model)
	Context.vertexAttribPointer(a_Model, 2, Context.FLOAT, false, 0, 0)
	Context.vertexAttribDivisor(a_Model, 0)

	/*
	 * Position X and Y
	 */

	// Create particle instances position x
	let VBO_ParticlePosX = Context.createBuffer()
	Context.bindBuffer(Context.ARRAY_BUFFER, VBO_ParticlePosX)
	Context.bufferData(Context.ARRAY_BUFFER, ParticlePosX, Context.STREAM_DRAW)

	// Link particles to pipeline
	Context.enableVertexAttribArray(a_Position_X)
	Context.vertexAttribPointer(a_Position_X, 1, Context.FLOAT, false, 0, 0)
	Context.vertexAttribDivisor(a_Position_X, 1)

	// Create particle instances position y
	let VBO_ParticlePosY = Context.createBuffer()
	Context.bindBuffer(Context.ARRAY_BUFFER, VBO_ParticlePosY)
	Context.bufferData(Context.ARRAY_BUFFER, ParticlePosY, Context.STREAM_DRAW)

	// Link particles to pipeline
	Context.enableVertexAttribArray(a_Position_Y)
	Context.vertexAttribPointer(a_Position_Y, 1, Context.FLOAT, false, 0, 0)
	Context.vertexAttribDivisor(a_Position_Y, 1)

	// Create particle types
	let VBO_ParticleTypes = Context.createBuffer()
	Context.bindBuffer(Context.ARRAY_BUFFER, VBO_ParticleTypes)
	Context.bufferData(Context.ARRAY_BUFFER, ParticleTypes, Context.STATIC_DRAW)

	// Link particle types to pipeline
	Context.enableVertexAttribArray(a_Properties)
	Context.vertexAttribIPointer(a_Properties, 1, Context.UNSIGNED_BYTE, 0, 0)
	Context.vertexAttribDivisor(a_Properties, 1)

	function UpdateSize() {
		let CX = JQueryCanvas.width()
		let CY = JQueryCanvas.height()

		JQueryCanvas.attr("width", CX)
		JQueryCanvas.attr("height", CY)

		Context.viewport(0, 0, CX, CY)

		let RX = 0,
			RY = 0

		if (CX < CY) {
			RX = ScaleMultiplier
			RY = (CY / CX) * ScaleMultiplier
		}
		else {
			RX = (CX / CY) * ScaleMultiplier
			RY = ScaleMultiplier
		}

		Scaling_X = RX
		Scaling_Y = RY

		Context.uniform2f(u_Scaling, RX, RY)
		Context.uniform1f(u_Radius, ParticleSize)
	}

	window.addEventListener("resize", UpdateSize)
	UpdateSize()

	// @todo Experiment this further or ditch the idea
	/*
	let Tuning_Size = 32
	let Tuning_Entries = new Float32Array(Tuning_Size * 4)
	let Tuning_Types = new Uint8Array(Tuning_Size)
	let Tuning_Index = 0
	*/

	let LastFrame = performance.now()

	const Speed = 1.75 / (1 / 75)

	function UpdateFrame(CurrFrame: number = 0) {
		const Delta = Math.max((CurrFrame - LastFrame) / 1000, 0)
		const TimeStep = Math.min(Speed * Delta, 2)

		LastFrame = CurrFrame /*
		matrix_values: number, // float*
		matrix_size: number, // size_t
		particle_types: number, // uint8_t*
		particle_pos_x: number, // float*
		particle_pos_y: number, // float*
		particle_vel_x: number, // float*
		particle_vel_y: number, // float*
		particle_count: number, // size_t
		force_beta: number, // float
		force_range: number, // float
		force_dampening: number, // float
		force_multiplier: number, // float
		time_delta: number, // float
		world_size_x: number, // float
		world_size_y: number, // float
		*/

		ComputeKernel._compute_kernel_fast(
			Alloc_ParticleMatrix,
			ParticleMatrixSize,
			Alloc_ParticleTypes,
			Alloc_ParticlePosX,
			Alloc_ParticlePosY,
			Alloc_ParticleVelX,
			Alloc_ParticleVelY,
			ParticleCount,
			0.3, // force_beta
			2048, // force_range
			0.9, // force_dampening
			2, // force_multiplier
			TimeStep,
			Scaling_X + ParticleSize,
			Scaling_Y + ParticleSize,
		)

		/*
		// @todo Maybe reimplement this using webassembly?
		let Tuning_Objective = Math.floor(Math.random() * ParticleCount)

		Tuning_Entries[Tuning_Index * 4 + 0] = ParticleEntries[Tuning_Objective * + 0]
		Tuning_Entries[Tuning_Index * 4 + 1] = ParticleEntries[Tuning_Objective * + 1]
		Tuning_Entries[Tuning_Index * 4 + 2] = ParticleEntries[Tuning_Objective * + 2]
		Tuning_Entries[Tuning_Index * 4 + 3] = ParticleEntries[Tuning_Objective * + 3]
		Tuning_Types[Tuning_Index] = ParticleTypes[Tuning_Objective]

		if (Tuning_Index >= Tuning_Size) {
			let Scores = new Array(ParticleMatrixSize)

			Scores.fill(0, 0, -1)

			let LX = null
			let LY = null

			for (let i = 0; i < Tuning_Size; i++) {
				let Type = Tuning_Types[i]

				let PX = Tuning_Entries[i * 4 + 0]
				let PY = Tuning_Entries[i * 4 + 1]

				if (!LY || !LX) {
					LX = PX
					LY = PY
				}

				let DX = PX - LX
				let DY = PY - LY

				let VX = Tuning_Entries[i * 4 + 2]
				let VY = Tuning_Entries[i * 4 + 3]

				let Score_Position = -Math.sqrt(DX * DX + DY * DY)
				let Score_Velocity = Math.sqrt(VX * VX + VY * VY) * 2.5

				Scores[Type] += Score_Position + Score_Velocity
			}

			let Worst_Score = Number.MAX_VALUE
			let Worst_Type = 0

			for (let i = 0; i < ParticleMatrixSize; i++) {
				if (Worst_Score > Scores[i]) {
					Worst_Score = Scores[i]
					Worst_Type = i
				}
			}

			let MatrixIndex = Worst_Type * ParticleMatrixSize + Math.floor(Math.random() * ParticleMatrixSize)
			let MatrixValue = ParticleMatrix[MatrixIndex] + (2 * Math.random() - 1) / 100

			ParticleMatrix[MatrixIndex] = Math.max(0, Math.min(MatrixValue, 1))
			console.log(Worst_Type, Worst_Score)
			Tuning_Index = 0
		}
		Tuning_Index++
		*/

		Context.clearColor(0, 0, 0, 0)
		Context.clear(Context.COLOR_BUFFER_BIT)

		Context.bindBuffer(Context.ARRAY_BUFFER, VBO_ParticlePosX)
		Context.bufferSubData(Context.ARRAY_BUFFER, 0, ParticlePosX)

		Context.bindBuffer(Context.ARRAY_BUFFER, VBO_ParticlePosY)
		Context.bufferSubData(Context.ARRAY_BUFFER, 0, ParticlePosY)

		Context.bindBuffer(Context.ARRAY_BUFFER, VBO_ParticleTypes)

		Context.drawArraysInstanced(Context.TRIANGLES, 0, 3, ParticleCount)

		requestAnimationFrame(UpdateFrame)
	}
	UpdateFrame()
}

Main()
