/**
 * Created by siroko on 7/8/15.
 */

'use strict'
import dat from 'dat-gui';

import {NearestFilter} from 'three';
import {RGBAFormat} from 'three';
import {FloatType} from 'three';
import {DataTexture} from 'three';
import {RawShaderMaterial} from 'three';
import {Color} from 'three';
import {Vector3} from 'three';

import vs_simpleQuad from './glsl/vs-simple-quad.glsl';
import fs_updatePositions from './glsl/fs-update-positions.glsl';
import BaseGLPass from './BaseGLPass';

export default class SimulationTexture extends BaseGLPass {

    constructor( params ) {

        super( params );

        this.sizeW          = params.sizeW;
        this.sizeH          = params.sizeH;
        this.total          = this.sizeW * this.sizeH;
        this.pointSize      = params.pointSize || 0;
        this.initialBuffer  = params.initialBuffer;
        this.directionFlow  = params.directionFlow|| new Vector3(0, 0.05, 0);
        this.locked         = params.locked || 0;
        this.colorParticle  = params.colorParticle || new Color(0xFFFFFF);
        this.noiseTimeScale = params.noiseTimeScale || 3;
        this.noisePositionScale = params.noisePositionScale || 0.11;
        this.noiseScale     = params.noiseScale || 0.039;
        this.lifeTime       = params.lifeTime || 100;
        this.persistence    = params.persistence || 0.01;
        this.speedDie       = params.speedDie || 0.001;
        this.offset         = params.offset || new Vector3(0, 0, 0);
        this.boundary       = params.boundary || {
                position : new Vector3( 0, 0, 0 ),
                size : new Vector3( 10, 10, 10 )
            };

        this.setup();

    }

    setup(){

        this.pingpong           = 0;
        this.finalPositionsRT   = this.getRenderTarget( this.sizeW, this.sizeH );

        this.data = new Float32Array( this.sizeW * this.sizeH * 4 );

        if( this.initialBuffer ) { // if initial buffer is defined just feed it to the data texture
            this.data = this.initialBuffer;
        } else { // else we just set it randomly

            for( var i = 0; i < this.total; i ++ ) {

                this.data[ i * 4 ]     = ( ( Math.random() * 2 - 1 ) * 0.5 ) * this.boundary.size.x + this.boundary.position.x;
                this.data[ i * 4 + 1 ] = ( ( Math.random() * 2 - 1 ) * 0.5 ) * this.boundary.size.y + this.boundary.position.y;
                this.data[ i * 4 + 2 ] = ( ( Math.random() * 2 - 1 ) * 0.5 ) * this.boundary.size.z + this.boundary.position.z;
                this.data[ i * 4 + 3 ] = 100; // frames life

            }

        }

        this.geometryRT = new DataTexture( this.data, this.sizeW, this.sizeH, RGBAFormat, FloatType );
        this.geometryRT.minFilter = NearestFilter;
        this.geometryRT.magFilter = NearestFilter;
        this.geometryRT.needsUpdate = true;

        this.updatePositionsMaterial = new RawShaderMaterial( {

            uniforms: {
                'uPrevPositionsMap'     : { type: "t",  value: this.geometryRT },
                'uGeomPositionsMap'     : { type: "t",  value: this.geometryRT },
                'uTime'                 : { type: "f",  value: 0 },
                'uLifeTime'             : { type: "f",  value: this.lifeTime },
                'uDirectionFlow'        : { type: "v3", value: this.directionFlow },
                'uOffsetPosition'       : { type: "v3", value: new Vector3() },
                'uLock'                 : { type: "i",  value: this.locked },
                'uCollision'            : { type: "v3", value: new Vector3() },
                'uNoiseTimeScale'       : { type: "f",  value: this.noiseTimeScale },
                'uNoisePositionScale'   : { type: "f",  value: this.noisePositionScale },
                'uNoiseScale'           : { type: "f",  value: this.noiseScale },
                'uOffset'               : { type: "v3", value: this.offset },
                'uPersistence'          : { type: "f",  value: this.persistence },
                'uSpeedDie'             : { type: "f",  value: this.speedDie },
                'uBoundary'             : { type: 'fv1', value : [
                    this.boundary.position.x,
                    this.boundary.position.y,
                    this.boundary.position.z,
                    this.boundary.size.x,
                    this.boundary.size.y,
                    this.boundary.size.z
                ] }
            },

            vertexShader                : vs_simpleQuad,
            fragmentShader              : fs_updatePositions
        } );

        this.targets = [  this.finalPositionsRT,  this.finalPositionsRT.clone() ];
        this.pass( this.updatePositionsMaterial,  this.finalPositionsRT );

        this.uniforms = {
            uNoiseTimeScale: this.noiseTimeScale,
            uNoisePositionScale: this.noisePositionScale,
            uNoiseScale: this.noiseScale
        };
        this.gui = new dat.GUI();
        this.gui.add(this.uniforms, 'uNoiseTimeScale', 0, 3);
        this.gui.add(this.uniforms, 'uNoisePositionScale', 0, 0.2);
        this.gui.add(this.uniforms, 'uNoiseScale', 0, 0.1);
    }

    update(){

        this.updatePositionsMaterial.uniforms.uTime.value = Math.sin(Date.now()) * 0.001;
        this.updatePositionsMaterial.uniforms.uPrevPositionsMap.value = this.targets[ this.pingpong ].texture;

        this.pingpong = 1 - this.pingpong;
        this.pass( this.updatePositionsMaterial, this.targets[ this.pingpong ] );

        for( var p in this.uniforms ){
            this.updatePositionsMaterial.uniforms[ p ].value = this.uniforms[ p ];
        }
    }
}