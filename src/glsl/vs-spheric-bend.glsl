precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
                
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

uniform float uBendAngle;
uniform float uBendOffset;
uniform float uBendAxisX;
uniform float uBendAxisY;

varying vec2 vUv;

vec3 bend(vec3 ip, float ba, vec2 b, float o, float a) {

	vec3 op = ip;
	ip.x = op.x * cos(a) - op.y * sin(a);
	ip.y = op.x * sin(a) + op.y * cos(a);

	if(ba != 0.0) {
		float radius = b.y / ba;
		float onp = (ip.x - b.x) / b.y - o;
		ip.z = cos(onp * ba) * radius - radius;
		ip.x = (b.x + b.y * o) + sin(onp * ba) * radius;
	}

	op = ip;
	ip.x = op.x * cos(-a) - op.y * sin(-a);
	ip.y = op.x * sin(-a) + op.y * cos(-a);

	return ip;
}

void main() {

    float bendAngle = uBendAngle;
    float bendOffset = uBendOffset;
    vec2 bounds = vec2(-1.5, 3.0);

    vec3 p = bend( position, bendAngle, bounds, bendOffset, uBendAxisX ) + bend( position, bendAngle, bounds, bendOffset, uBendAxisY );

    vUv = vec2(uv.x, 1.0 - uv.y);

    gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
                  
}