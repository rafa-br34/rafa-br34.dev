#version 300 es

// Uniforms
uniform vec2 uScaling;
uniform float uRadius;

// From attribute buffer
in vec2 aModel;
in uint aProperties;
in float aPositionX;
in float aPositionY;

// To fragment shader
out vec2 sPosition;
flat out uint sProperties;

void main() {
	vec2 Position = vec2(aPositionX, aPositionY);
	vec2 WorldSpace = aModel * uRadius + Position;
	vec2 ViewSpace = WorldSpace / uScaling;

	gl_Position = vec4(ViewSpace, 0, 1);
	sPosition = aModel.xy;
	sProperties = aProperties;
}