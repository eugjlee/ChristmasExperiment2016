/**
 * Created by siroko on 7/13/15.
 */

'use strict'

import {EventDispatcher} from 'three';
import {OrthographicCamera} from 'three';
import {Scene} from 'three';
import {PlaneBufferGeometry} from 'three';
import {Mesh} from 'three';
import {WebGLRenderTarget} from 'three';
import {FloatType} from 'three';
import {HalfFloatType} from 'three';
import {ClampToEdgeWrapping} from 'three';
import {NearestFilter} from 'three';
import {RGBAFormat} from 'three';

export default class BaseGLPass extends EventDispatcher {

    constructor( params ){

        super();

        this.renderer       = params.renderer;
        this.sceneRT        = new Scene();
        this.cameraOrto     = new OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
        this.quad_geom      = new PlaneBufferGeometry( 2, 2, 1, 1 );
        this.quad           = new Mesh( this.quad_geom, null );
        this.textureType    = FloatType;

        var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if(iOS) {
            this.textureType = HalfFloatType;
        }

        this.sceneRT.add( this.quad );

    }

    pass( material, target ) {

        this.quad.material = material;
        this.renderer.render( this.sceneRT, this.cameraOrto, target );
    }

    getRenderTarget( w, h ){

        var renderTarget = new WebGLRenderTarget( w, h, {
            wrapS: ClampToEdgeWrapping,
            wrapT: ClampToEdgeWrapping,
            minFilter: NearestFilter,
            magFilter: NearestFilter,
            format: RGBAFormat,
            type: this.textureType,
            stencilBuffer: false,
            depthBuffer: false,
            generateMipmaps: false
        } );

        renderTarget.needsUpdate = true;
        return renderTarget;
    }
}