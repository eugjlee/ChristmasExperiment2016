/**
 * Created by siroko on 7/11/16.
 */

'use strict'

import BaseGLPass from '../core/BaseGLPass';


import {DataTexture} from 'three';
import {BufferGeometry} from 'three';
import {NearestFilter} from 'three';
import {RGBAFormat} from 'three';
import {FloatType} from 'three';


export default class GPUGeometry extends BaseGLPass {

    constructor( params ) {

        super(params);

        this.geom = params.geom;
        // Convert to buffergeometry if is a regular old geometry
        if( this.geom.faces ) {
            this.geom = new BufferGeometry().fromGeometry(params.geom);
        }

        this.pingpong = 0;

        let totalGeomVertices = this.geom.attributes.position.array.length / 3;

        this.lights             = params.lights;

        let sqrtTotalGeom       = Math.sqrt( totalGeomVertices );
        // Aproximatino to the nearest upper power of two number
        let totalPOT            = Math.pow( 2, Math.ceil( Math.log( sqrtTotalGeom ) / Math.log( 2 ) ) );

        this.sizeW = totalPOT;
        this.sizeH = totalPOT;

        this.total              = this.sizeW * this.sizeH;

        this.finalPositionsRT   = this.getRenderTarget( this.sizeW, this.sizeH );
        this.springRT           = this.getRenderTarget( this.sizeW, this.sizeH );

        this.data = new Float32Array( this.total * 4 );
        this.normal = new Float32Array( this.total * 4 );
        this.uv = new Float32Array( this.total * 4 );

        let it = 0;
        for (let i = 0; i < this.geom.attributes.position.array.length; i++) {
            var position = this.geom.attributes.position.array[ i ];
            var normal = this.geom.attributes.normal.array[ i ];
            this.data[ it ] = position;
            this.normal[ it ] = normal;
            if( ( i + 1 ) % 3 == 0 && i != 0 ) {
                it++;
                this.data[ it ] = 1;
                this.normal[ it ] = 1;
            }
            it ++;
        }
        let it2 = 0;

        if(this.geom.attributes.uv) {

            for (let r = 0; r < this.geom.attributes.uv.array.length; r++) {
                var uv = this.geom.attributes.uv.array[r];
                this.uv[it2] = uv;
                if (( r + 1 ) % 2 == 0 && r != 0) {
                    it2++;
                    this.uv[it2] = 1;
                    it2++;
                    this.uv[it2] = 1;
                }
                it2++;
            }

            this.uvRT = new DataTexture( this.uv, this.sizeW, this.sizeH, RGBAFormat, FloatType);
            this.uvRT.minFilter = NearestFilter;
            this.uvRT.magFilter = NearestFilter;
            this.uvRT.needsUpdate = true;
        } else {
            console.log('Geometry provided doesnt have UV coordinates');
        }

        this.geometryRT = new DataTexture( this.data, this.sizeW, this.sizeH, RGBAFormat, FloatType);
        this.geometryRT.minFilter = NearestFilter;
        this.geometryRT.magFilter = NearestFilter;
        this.geometryRT.needsUpdate = true;

        this.normalRT = new DataTexture( this.normal, this.sizeW, this.sizeH, RGBAFormat, FloatType);
        this.normalRT.minFilter = NearestFilter;
        this.normalRT.magFilter = NearestFilter;
        this.normalRT.needsUpdate = true;

    }
}