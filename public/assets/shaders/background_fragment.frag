#version 300 es

precision highp float;

// To framebuffer
out vec4 oFragColor;

// From vertex shader
in vec2 sPosition;
flat in uint sProperties;

void main() {
	float Alpha = 1.0 - smoothstep(1.0 - 3.0 * 0.25, 1.0, length(sPosition));

	const vec3 Colors[] = vec3[](
		vec3(0.8, 0.1, 0.1),
		vec3(0.1, 0.8, 0.1),
		vec3(0.1, 0.1, 0.8),
		vec3(0.8, 0.1, 0.8),
		vec3(0.8, 0.8, 0.1),
		vec3(0.1, 0.8, 0.8)
	);

	oFragColor = vec4(Colors[sProperties] / 1.5, Alpha);
}
