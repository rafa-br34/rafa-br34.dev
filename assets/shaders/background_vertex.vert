#version 300 es

// Uniforms
uniform vec2 u_Scaling;
uniform float u_Radius;

// From attribute buffer
in vec2 a_Model;
in uint a_Properties;
in float a_Position_X;
in float a_Position_Y;

// To fragment shader
out vec2 s_Position;
flat out uint s_Properties;

void main() {
	vec2 Position = vec2(a_Position_X, a_Position_Y);
	vec2 WorldSpace = a_Model * u_Radius + Position;
	vec2 ViewSpace = WorldSpace / u_Scaling;

	gl_Position = vec4(ViewSpace, 0, 1);
	s_Position = a_Model.xy;
	s_Properties = a_Properties;
}