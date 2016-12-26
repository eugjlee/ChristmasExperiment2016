#extension GL_OES_standard_derivatives : enable
#define MAX_POINT_LIGHTS 2

precision highp float;
precision highp sampler2D;

uniform sampler2D occlusionMap;
uniform sampler2D lightMap;

uniform sampler2D diffuseMap;
uniform sampler2D textureMap;
uniform sampler2D normalMap;

uniform vec3 pointLightColor[MAX_POINT_LIGHTS];
uniform vec3 pointLightPosition[MAX_POINT_LIGHTS];
uniform float pointLightIntensity[MAX_POINT_LIGHTS];
uniform float uLights;
uniform vec3 uTint;

uniform float intensity;

varying vec4 vPos;

varying mat3 vNormalMatrix;
varying vec4 vOPosition;
varying vec3 vU;
varying vec2 vUv;

varying vec3 vNormalValue;
varying vec2 vUvValue;

float random(vec3 scale,float seed){return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);}

float blendLighten(float base, float blend) {
	return max(blend,base);
}

vec3 blendLighten(vec3 base, vec3 blend) {
	return vec3(blendLighten(base.r,blend.r),blendLighten(base.g,blend.g),blendLighten(base.b,blend.b));
}

vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
	return (blendLighten(base, blend) * opacity + base * (1.0 - opacity));
}

void main(){

    vec4 base = texture2D( diffuseMap, vUvValue );

    gl_FragColor = vec4(vec4( vec4(blendLighten(base.rgb, uTint * 0.07), 1.0) * intensity ).rgb, 1.0);

}
