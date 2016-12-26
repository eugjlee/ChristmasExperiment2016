/**
 * Created by siroko on 21/11/16.
 */
'use strict'

import GPUGeometry from '../geom/GPUGeometry';
import SimulationTexture from './SimulationTexture';

import {ShaderMaterial} from 'three';
import {ShadowMaterial} from 'three';
import {RawShaderMaterial} from 'three';
import {BufferGeometry} from 'three';
import {Mesh} from 'three';
import {BufferAttribute} from 'three';
import {Vector2} from 'three';
import {ShaderLib} from 'three';

import vs_buffer from './glsl/vs-buffer-geometry-sim.glsl';
import fs_buffer from './glsl/fs-buffer-geometry-sim.glsl';
import vs_depth_buffer from './glsl/vs-buffer-geometry-sim-depth.glsl';

import vs_buffer_mobile from './glsl/vs-buffer-geometry-sim-mobile.glsl';
import fs_buffer_mobile from './glsl/fs-buffer-geometry-sim-mobile.glsl';

export default class GPUGeometrySimulation {

    constructor(params) {

        this.renderer = params.renderer;
        this.geom = params.geom;
        this.sizeSimulation = params.sizeSimulation;
        this.matcap = params.matcap;
        this.specialMatcap = params.specialMatcap;
        this.special2Matcap = params.special2Matcap;
        this.initialBuffer = params.initialBuffer;
        this.isMobile = params.isMobile;

        this.init();
        this.setupMesh();
    }

    init(){

        this.gpuGeometry = new GPUGeometry( {
            geom: this.geom,
            renderer: this.renderer
        } );

        this.simulator = new SimulationTexture( {
            sizeW: this.sizeSimulation,
            sizeH: this.sizeSimulation,
            initialBuffer: this.initialBuffer,
            renderer: this.renderer
        } );

        this.totalSimulation = this.sizeSimulation * this.sizeSimulation;
        this.totalVertices = this.gpuGeometry.total * this.totalSimulation;

    }

    setupMesh(){

        this.positions = new BufferAttribute( new Float32Array( this.totalVertices * 3 ), 3 );
        this.index2D = new BufferAttribute( new Float32Array( this.totalVertices * 4 ), 4 );

        var geomSize = Math.sqrt(this.gpuGeometry.total);
        var divSim = 1 / this.sizeSimulation;
        var divGeom = 1 / geomSize;

        var uvSim  = new Vector2( 0, 0 );
        var uvGeom = new Vector2( 0, 0 );
        var counter = 0;

        for ( var r = 0; r < this.totalSimulation; r++ ) {

            uvSim.x = ( r % this.sizeSimulation ) / this.sizeSimulation;
            if (r % this.sizeSimulation == 0 && r != 0) uvSim.y += divSim;

            for (var i = 0; i < this.gpuGeometry.total; i++) {

                uvGeom.x = ( i % geomSize ) / geomSize;
                if (i % geomSize == 0 && i != 0) uvGeom.y += divGeom;

                this.index2D.setXYZW( counter, uvSim.x, uvSim.y, uvGeom.x, uvGeom.y );
                this.positions.setXYZ( counter, Math.random() * 10, Math.random() * 10, Math.random() * 10 );

                counter++;

            }

            uvGeom.y = 0;
            counter --;
        }

        this.bufferGeometry = new BufferGeometry();
        this.bufferGeometry.addAttribute( 'position', this.positions );
        this.bufferGeometry.addAttribute( 'index2D', this.index2D );

        if( this.isMobile ){

            this.bufferMaterial = new RawShaderMaterial();
            this.bufferMaterial.vertexShader =  vs_buffer_mobile;
            this.bufferMaterial.fragmentShader = fs_buffer_mobile;

        } else {

            this.bufferMaterial = new ShadowMaterial();
            this.bufferMaterial.extensions.derivatives = true;
            this.bufferMaterial.lights = true;
            this.bufferMaterial.vertexShader =  vs_buffer;
            this.bufferMaterial.fragmentShader = fs_buffer;

        }

        this.bufferMaterial.uniforms['uGeometryTexture'] = { type: 't', value: this.gpuGeometry.geometryRT };
        this.bufferMaterial.uniforms['uGeometryNormals'] = { type: 't', value: this.gpuGeometry.normalsRT };
        this.bufferMaterial.uniforms['uSimulationTexture'] = { type: 't', value: this.simulator.targets[ 1 - this.simulator.pingpong ] };
        this.bufferMaterial.uniforms['uSimulationPrevTexture'] = { type: 't', value: this.simulator.targets[ this.simulator.pingpong ] };
        this.bufferMaterial.uniforms['uMatcap'] = { type: 't', value: this.matcap };
        this.bufferMaterial.uniforms['uSpecialMatcap'] = { type: 't', value: this.specialMatcap };
        this.bufferMaterial.uniforms['uSpecial2Matcap'] = { type: 't', value: this.special2Matcap };
        this.bufferMaterial.uniforms['uNormalMap'] = { type: 't', value: this.matcap};

        this.bufferMesh = new Mesh( this.bufferGeometry, this.bufferMaterial );
        this.bufferMesh.castShadow = true;
        this.bufferMesh.receiveShadow = true;

        this.bufferMesh.customDepthMaterial = new ShaderMaterial( {
            defines: {
                'USE_SHADOWMAP': '',
                'DEPTH_PACKING': '3201'
            },
            vertexShader: vs_depth_buffer,
            fragmentShader: ShaderLib.depth.fragmentShader,

            uniforms: this.bufferMaterial.uniforms
        } );
    }

    update( t ) {

        this.simulator.update(t);
        this.bufferMaterial.uniforms['uSimulationTexture'].value = this.simulator.targets[1 - this.simulator.pingpong];
        this.bufferMaterial.uniforms['uSimulationTexture'].needsUpdate = true;
        this.bufferMaterial.uniforms['uSimulationPrevTexture'].value = this.simulator.targets[this.simulator.pingpong];
        this.bufferMaterial.uniforms['uSimulationPrevTexture'].needsUpdate = true;

    }

}