import "../style/style.sass"
import { ComputeKernelInterface, ComputeKernelLoader } from "./background_compute"

import $ from "jquery"

function CreateShader(Context: WebGL2RenderingContext, Source: string, Type: GLenum) {
	let ShaderHandle = Context.createShader(Type)

	Context.shaderSource(ShaderHandle, Source)
	Context.compileShader(ShaderHandle)

	if (!Context.getShaderParameter(ShaderHandle, Context.COMPILE_STATUS)) {
		throw Error(`Shader compilation failed\n${Context.getShaderInfoLog(ShaderHandle)}`)
	}

	return ShaderHandle
}

async function GetShaders(ShaderNames: string[]) {
	let Coroutines = []
	let ShaderSources: Record<string, string> = {}

	for (let Filename of ShaderNames)
		Coroutines.push(
			$.get(`assets/shaders/${Filename}`).done(Source => ShaderSources[Filename] = Source as string)
		)

	await Promise.allSettled(Coroutines)

	return ShaderSources
}

function WaitFrame() {
	return new Promise((Resolve, _Reject) => requestAnimationFrame(Resolve))
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

	if (!JQueryCanvas.length)
		return

	let Canvas = JQueryCanvas[0] as HTMLCanvasElement
	let Context = Canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true })

	if (!Context)
		throw Error("Failed to get context")

	let Shaders = await GetShaders([
		"background_fragment.frag",
		"background_vertex.vert",
	])

	let Program = Context.createProgram()
	Context.attachShader(Program, CreateShader(Context, Shaders["background_vertex.vert"], Context.VERTEX_SHADER))
	Context.attachShader(Program, CreateShader(Context, Shaders["background_fragment.frag"], Context.FRAGMENT_SHADER))
	Context.linkProgram(Program)
	Context.useProgram(Program)

	if (!Context.getProgramParameter(Program, Context.LINK_STATUS))
		throw Error(`Linking failed:\n${Context.getProgramInfoLog(Program)}`)

	Context.disable(Context.DITHER)

	// Disable depth buffer
	Context.disable(Context.DEPTH_TEST)
	Context.depthMask(false)

	// Cull back faces
	Context.enable(Context.CULL_FACE)
	Context.cullFace(Context.FRONT)
	Context.frontFace(Context.CCW)

	// Enable transparency blending
	Context.enable(Context.BLEND);
	Context.blendFunc(Context.SRC_ALPHA, Context.ONE_MINUS_SRC_ALPHA)
	Context.blendEquation(Context.FUNC_ADD);

	Context.clearColor(0, 0, 0, 0)
	Context.clear(Context.COLOR_BUFFER_BIT)

	let u_Scaling = Context.getUniformLocation(Program, "u_Scaling")
	let u_Size = Context.getUniformLocation(Program, "u_Size")

	let a_Model = Context.getAttribLocation(Program, "a_Model")
	let a_Properties = Context.getAttribLocation(Program, "a_Properties")
	let a_Positional = Context.getAttribLocation(Program, "a_Positional")

	let Scaling_X = 0
	let Scaling_Y = 0

	let Model = new Float32Array([
		 0, 2,
		 Math.sqrt(3), -1,
		-Math.sqrt(3), -1,
	])

	const ScaleMultiplier = 32768
	const ParticleMatrixSize = 6
	const ParticleCount = 3000
	const ParticleSize = 128.0

	let Size_ParticleEntries = ParticleCount * 4
	let Size_ParticleMatrix = ParticleMatrixSize * ParticleMatrixSize
	let Size_ParticleTypes = ParticleCount

	let Alloc_ParticleEntries = ComputeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * Size_ParticleEntries)
	let Alloc_ParticleMatrix = ComputeKernel._malloc(Float32Array.BYTES_PER_ELEMENT * Size_ParticleMatrix)
	let Alloc_ParticleTypes = ComputeKernel._malloc(Uint8Array.BYTES_PER_ELEMENT * Size_ParticleTypes)

	let ParticleEntries = new Float32Array(ComputeKernel.HEAPF32.buffer, Alloc_ParticleEntries, Size_ParticleEntries)
	let ParticleMatrix = new Float32Array(ComputeKernel.HEAPF32.buffer, Alloc_ParticleMatrix, Size_ParticleMatrix)
	let ParticleTypes = new Uint8Array(ComputeKernel.HEAPU8.buffer, Alloc_ParticleTypes, Size_ParticleTypes)

	for (let i = 0; i < ParticleMatrixSize * ParticleMatrixSize; i++) {
		ParticleMatrix[i] = 2 * Math.random() - 1
	}

	for (let i = 0; i < ParticleCount; i++) {
		let Rotation = Math.random() * Math.PI * 2
		let Radius = Math.random() * 1024

		ParticleEntries[i * 4 + 0] = Math.sin(Rotation) * Radius
		ParticleEntries[i * 4 + 1] = Math.cos(Rotation) * Radius
		ParticleTypes[i] = Math.floor(Math.random() * ParticleMatrixSize)
	}

	window.particle_entries = ParticleEntries
	window.particle_matrix = ParticleMatrix
	window.particle_types = ParticleTypes

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

	// Create particle instances
	let VBO_ParticleEntries = Context.createBuffer()
	Context.bindBuffer(Context.ARRAY_BUFFER, VBO_ParticleEntries)
	Context.bufferData(Context.ARRAY_BUFFER, ParticleEntries, Context.STREAM_DRAW)

	// Link particles to pipeline
	Context.enableVertexAttribArray(a_Positional)
	Context.vertexAttribPointer(a_Positional, 4, Context.FLOAT, false, 0, 0)
	Context.vertexAttribDivisor(a_Positional, 1)

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

		let
			RX = 0,
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
		Context.uniform1f(u_Size, ParticleSize)
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

	function UpdateFrame() {
		ComputeKernel._compute_kernel(
			Alloc_ParticleMatrix,     // matrix_values: number,    // FP32*
			ParticleMatrixSize,       // matrix_size: number,      // INT
			Alloc_ParticleTypes,      // particle_types: number,   // UI8*
			Alloc_ParticleEntries,    // particle_entries: number, // FP32*
			ParticleCount,            // particle_count: number,   // INT
			2048.0,                   // force_range: number,      // FP32
			2.0,                      // force_multiplier: number, // FP32
			0.90,                     // force_dampening: number,  // FP32
			0.3,                      // force_beta: number,       // FP32
			2.0,                      // time_delta: number,       // FP32
			Scaling_X + ParticleSize, // canvas_scaling_x: number, // FP32
			Scaling_Y + ParticleSize  // canvas_scaling_y: number  // FP32
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

		Context.bindBuffer(Context.ARRAY_BUFFER, VBO_ParticleEntries)
		Context.bufferSubData(Context.ARRAY_BUFFER, 0, ParticleEntries)

		Context.drawArraysInstanced(Context.TRIANGLES, 0, 3, ParticleCount)
		requestAnimationFrame(UpdateFrame)
	}
	UpdateFrame()
}

Main()
