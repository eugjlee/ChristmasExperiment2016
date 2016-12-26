/**
 * Created by siroko on 07/12/16.
 */

import BaseGLPass from '../core/BaseGLPass';
import GPUGeometry from '../geom/GPUGeometry';

import ImprovedNoise from '../../noise/ImprovedNoise';
import {BufferAttribute} from 'three';
import {BufferGeometry} from 'three';
import {RawShaderMaterial} from 'three';
import {Mesh} from 'three';
import {MeshBasicMaterial} from 'three';

import vs_simpleQuad from './glsl/vs-simple-quad.glsl';
import fs_updatePositions from './glsl/fs-update-positions-geometry.glsl';
import fs_updateSpring from './glsl/fs-update-positions-spring.glsl';

export default class GPUDisplacedGeometry extends BaseGLPass{

    constructor( params ) {

        super(params);

        this.geom = params.geom;
        // Convert to buffergeometry if is a regular old geometry
        if( this.geom.faces ) {
            this.geom = new BufferGeometry().fromGeometry(params.geom);
        }

        this.renderer = params.renderer;
        this.gpuGeometry = new GPUGeometry( {
            geom: this.geom,
            renderer: this.renderer
        } );

        this.lights = params.lights;

        this.pingpong = 0;

        this.index2D = new BufferAttribute( new Float32Array( this.gpuGeometry.total * 2 ), 2 );
        this.positions = new BufferAttribute( new Float32Array( this.gpuGeometry.total * 3 ), 3 );

        var div = 1 / this.gpuGeometry.sizeW;
        var uv = new THREE.Vector2(0, 0);
        for (let i = 0; i < this.gpuGeometry.total; i++) {

            uv.x = ( i % this.gpuGeometry.sizeW ) / this.gpuGeometry.sizeW;
            if ( i % this.gpuGeometry.sizeW == 0 && i != 0) uv.y += div;

            this.index2D.setXY( i, uv.x, uv.y );

            if( this.geom.attributes.position.array[ i * 3 ] ) {
                this.positions.setXYZ( i,
                    this.geom.attributes.position.array[i * 3],
                    this.geom.attributes.position.array[i * 3 + 1],
                    this.geom.attributes.position.array[i * 3 + 2]
                );
            } else {
                this.positions.setXYZ( i, 0, 0, 0 );
            }
        }

        console.log( this.gpuGeometry.total, this.gpuGeometry.sizeW);

        this.bufferGeometry = new BufferGeometry();
        this.bufferGeometry.addAttribute( 'aV2I', this.index2D );
        this.bufferGeometry.addAttribute( 'position', this.positions );

        if( this.lights ) {
            this.bufferMaterial = new RawShaderMaterial({
                'uniforms': {
                    "uLights": { type: 'f', value: 1 },
                    "uPositionsTexture": { type: 't', value: this.gpuGeometry.geometryRT },
                    "uNormalTexture": { type: 't', value: this.gpuGeometry.normalRT },
                    "uUvTexture": { type: 't', value: this.gpuGeometry.uvRT },
                    "normalMap": params.uniforms.normalMap,
                    "textureMap": params.uniforms.textureMap,
                    "diffuseMap": params.uniforms.diffuseMap,
                    "occlusionMap": params.uniforms.occlusionMap,
                    "intensity": { type: 'f', value: 1 },
                    "lightMap": params.uniforms.lightMap,
                    "pointLightPosition": { type: 'v3v', value: [this.lights[0].position, this.lights[1].position] },
                    "pointLightColor": { type: 'v3v', value: [this.lights[0].color, this.lights[1].color]},
                    "pointLightIntensity": { type: 'fv', value: [this.lights[0].intensity, this.lights[1].intensity] },
                    "uTint": params.uniforms.uTint
                },

                vertexShader: vs_bufferGeometry,
                fragmentShader: fs_bufferGeometry

            });
        } else {
            this.bufferMaterial = new THREE.RawShaderMaterial({
                'uniforms': {
                    "uLights": { type: 'f', value: 0 },
                    "uPositionsTexture": {type: 't', value: this.geometryRT},
                    "normalMap": params.uniforms.normalMap,
                    "textureMap": params.uniforms.textureMap
                },

                vertexShader: vs_bufferGeometry,
                fragmentShader: fs_bufferGeometry

            });
        }

        this.mesh = new THREE.Mesh( this.bufferGeometry, this.bufferMaterial );
        this.mesh.updateMatrix();

        this.updateSpringMaterial = new RawShaderMaterial( {
            'uniforms': {
                'uBasePositions'        : { type: 't', value: this.geometryRT },
                'uPrevPositions'        : { type: 't', value: this.geometryRT },
                'uPrevPositionsGeom'    : { type: 't', value: this.geometryRT },
                'uTime'                 : { type: 'f', value: 1 },
                'uTouch'                : params.uniforms.uTouch,
                'uWorldPosition'        : params.uniforms.uWorldPosition,
                'uModelMatrix'          : { type: 'm4', value: this.mesh.matrix }
            },

            vertexShader                : vs_simpleQuad,
            fragmentShader              : fs_updateSpring

        } );

        this.updatePositionsMaterial = new RawShaderMaterial({
            'uniforms': {
                'uPrevPositions'        : { type: 't', value: this.geometryRT },
                'uSpringTexture'        : { type: 't', value: this.springRT }
            },
            vertexShader                : vs_simpleQuad,
            fragmentShader              : fs_updatePositions
        });

        this.planeDebug = new Mesh( this.quad_geom, new MeshBasicMaterial({map:this.springRT}));
        this.planeDebug.rotation.x = Math.PI * 1.5;

        this.springPositionsTargets     = [ this.springRT, this.springRT.clone() ];
        this.finalPositionsTargets      = [ this.finalPositionsRT, this.finalPositionsRT.clone() ];

        this.pass( this.updateSpringMaterial, this.springPositionsTargets[ this.pingpong ] );
        this.pass( this.updatePositionsMaterial, this.finalPositionsTargets[ this.pingpong ] );

    };

    update( t ){

        this.updateSpringMaterial.uniforms.uPrevPositions.value = this.springPositionsTargets[ this.pingpong ];
        this.updateSpringMaterial.uniforms.uPrevPositionsGeom.value = this.finalPositionsTargets[ this.pingpong ];
        this.updatePositionsMaterial.uniforms.uSpringTexture.value = this.springPositionsTargets[ this.pingpong ];

        this.updatePositionsMaterial.uniforms.uPrevPositions.value = this.finalPositionsTargets[ this.pingpong ];

        this.bufferMaterial.uniforms.intensity.value = 0.5 + Math.abs(ImprovedNoise().noise(t * 0.01 + this.mesh.position.x, t * 0.01 + this.mesh.position.z, this.mesh.position.y ) * 1.5);
        this.bufferMaterial.uniforms.uPositionsTexture.value = this.finalPositionsTargets[ this.pingpong ];
        this.bufferMaterial.needsUpdate = true;

        this.pingpong = 1 - this.pingpong;
        this.pass( this.updateSpringMaterial, this.springPositionsTargets[ this.pingpong ] );
        this.pass( this.updatePositionsMaterial, this.finalPositionsTargets[ this.pingpong ] );

    };

    clamp( value, min, max ){
        return value < min ? min : value > max ? max : value;
    };
}