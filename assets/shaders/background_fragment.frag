#version 300 es

precision highp float;

// To framebuffer
out vec4 o_FragColor;

// From vertex shader
in vec2 s_Position;
flat in uint s_Properties;

void main() {
	float Alpha = 1.0 - smoothstep(1.0 - 3.0 * 0.25, 1.0, length(s_Position));

	const vec3 Colors[] = vec3[](
		vec3(1, 0, 0),
		vec3(0, 1, 0),
		vec3(0, 0, 1),
		vec3(1, 0, 1),
		vec3(1, 1, 0),
		vec3(0, 1, 1)
	);

	o_FragColor = vec4(Colors[s_Properties] / 1.5, Alpha);
}
