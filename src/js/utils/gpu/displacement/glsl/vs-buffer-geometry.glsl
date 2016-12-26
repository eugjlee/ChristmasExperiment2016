#extension GL_OES_standard_derivatives : enable

precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 aV2I;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

uniform sampler2D uPositionsTexture;
uniform sampler2D uUvTexture;
uniform sampler2D uNormalTexture;

varying vec4 vPos;
varying vec2 vUv;

varying mat3 vNormalMatrix;
varying vec4 vOPosition;
varying vec3 vU;

varying vec3 vNormalValue;
varying vec2 vUvValue;

  void main(){

      vec4 pos = texture2D( uPositionsTexture, aV2I );
      vec4 uvValue = texture2D( uUvTexture, aV2I );
      vUvValue = uvValue.rg;
      vec4 normalValue = texture2D( uNormalTexture, aV2I );
      vNormalValue = normalValue.rgb;

      vPos = pos;
      vOPosition = modelViewMatrix * vPos;
      vU = normalize( vec3( modelViewMatrix * vPos ) );
      vUv = aV2I;
      vNormalMatrix = normalMatrix;


      gl_Position = projectionMatrix * modelViewMatrix * vPos;


  }