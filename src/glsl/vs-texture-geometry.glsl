precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
                
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

uniform sampler2D uSimTexture;
uniform sampler2D uGeomTexture;

varying vec2 vUv;

void main() {

    vUv = vec2(uv.x, 1.0 - uv.y);

    vec4 sim = texture2D( uSimTexture, vUv );
    vec4 pos = texture2D( uGeomTexture, vUv );


    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.rgb, 1.0);
                  
}