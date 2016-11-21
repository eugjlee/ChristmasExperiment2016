precision highp float;
precision highp sampler2D;

attribute vec4 index2D;

uniform sampler2D uGeometryTexture;
uniform sampler2D uGeometryNormals;
uniform sampler2D uSimulationTexture;
uniform sampler2D uSimulationPrevTexture;

varying vec4 vNormal;
varying vec4 vSimColor;

mat4 rotationMatrix(vec3 axis, float angle){

    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

void main(){

    vec4 geomVertexPosition = texture2D( uGeometryTexture, index2D.zw );
    vec4 geomVertexNormal = texture2D( uGeometryNormals, index2D.zw );
    vec4 simPosition = texture2D( uSimulationTexture, index2D.xy );
    vec4 simPrevPosition = texture2D( uSimulationPrevTexture, index2D.xy );

    vec3 rotationVec = normalize( simPrevPosition.rgb - simPosition.rgb );

    mat4 rx = rotationMatrix( vec3( 1.0, 0.0, 0.0 ), rotationVec.x + simPosition.x );
    mat4 ry = rotationMatrix( vec3( 0.0, 1.0, 0.0 ), rotationVec.y + simPosition.y );
    mat4 rz = rotationMatrix( vec3( 0.0, 0.0, 1.0 ), rotationVec.z + simPosition.z );
    mat4 rMatrix = rx * ry * rz;

    vec4 rotatedPosition = geomVertexPosition * rMatrix;
        rotatedPosition *= (simPosition.a / 100.) * 0.02;
        simPosition *= 0.1;
    //    simPosition.y -= 0.5;
    //    simPosition.z -= 1.;
        vec3 p = simPosition.rgb + rotatedPosition.rgb;

    vNormal = geomVertexNormal;
    vSimColor = simPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );

}