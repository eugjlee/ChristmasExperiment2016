precision highp float;

uniform sampler2D uSimTexture;
uniform sampler2D uGeomTexture;

varying vec2 vUv;

void main() {

    vec4 sim = texture2D( uSimTexture, vUv );
    vec4 pos = texture2D( uGeomTexture, vUv );

    gl_FragColor = vec4( vec3(vUv, 0.0), 1.0 );
}
