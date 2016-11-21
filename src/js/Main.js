/**
 * Created by siroko on 22/09/16.
 */

'use strict'

import dat from 'dat-gui';

import {WebGLRenderer} from 'three';
import {PerspectiveCamera} from 'three';
import {Scene} from 'three';
import {BoxGeometry} from 'three';
import {SpotLight} from 'three';
import {LightShadow} from 'three';
import {ImageUtils} from 'three';
import {PCFSoftShadowMap} from 'three';

import CameraControl from './utils/CameraControl';
import GPUGeometrySimulation from './utils/sim/GPUGeometrySimulation';

export default class Main {

    constructor() {

        this.initializeGui();
        this.init();
        this.setShadowmap();
        this.addEvents();
    }

    init() {

        this.container = document.getElementById('container');
        this.renderer = new WebGLRenderer( { antialias : true } );
        this.camera = new PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.cameraControl = new CameraControl( this.camera, [0, 0, 0] );
        this.scene = new Scene();

        let icosahedron = new BoxGeometry( 10, 10, 10 , 2, 2, 2);

        this.gpuGeometrySimulation = new GPUGeometrySimulation( {
            geom : icosahedron,
            matcap: ImageUtils.loadTexture('assets/matcap_twilight.jpg'),
            specialMatcap: ImageUtils.loadTexture('assets/emerald.jpg'),
            special2Matcap: ImageUtils.loadTexture('assets/matcap_purple.jpg'),
            sizeSimulation: 128,
            isMobile: false,
            renderer: this.renderer
        } );

        this.scene.add( this.gpuGeometrySimulation.bufferMesh );

        this.renderHandler = this.render.bind( this );
        this.container.appendChild( this.renderer.domElement );
        this.onResize( null );
        this.render( 0 );

    }

    initializeGui(){

        this.properties = {
            bendAngle : -2,
            offset : 0.5,
            bendAxisX : 0,
            bendAxisY : Math.PI * 0.5
        };

        this.gui = new dat.GUI();
        this.gui.add( this.properties, 'bendAngle' ).min( Math.PI * -2 ).max( Math.PI * 2 ).step( 0.01 );
        this.gui.add( this.properties, 'offset' ).min( 0 ).max( 1 ).step( 0.01 );
        this.gui.add( this.properties, 'bendAxisX').min( Math.PI * -0.5 ).max( Math.PI * 0.5 ).step( 0.01 );
        this.gui.add( this.properties, 'bendAxisY').min( Math.PI * -0.5 ).max( Math.PI * 0.5 ).step( 0.01 );

    }

    setShadowmap(){

        var SHADOW_MAP_WIDTH = 1024;
        var SHADOW_MAP_HEIGHT = 1024;

        this.light = new SpotLight( 0xffffff, 0.4 );
        this.light.distance = 5;
        this.light.penumbra = 0.1;
        this.light.decay = 1;
        this.light.angle = Math.PI * .8;
        this.light.position.set( 0, 4.4, 0 );
        this.light.target.position.set( 0, 0, 0 );

        this.light.castShadow = true;

        this.light.shadow = new LightShadow( new PerspectiveCamera( 50, 1, 2, 7 ) );
        this.light.shadow.bias = 0.0001;

        this.light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
        this.light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

        this.scene.add( this.light );

        this.renderer.autoClear = false;

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;

        // this.floor.castShadow = true;
        // this.floor.receiveShadow = true;
    }

    addEvents() {

        window.addEventListener( 'resize', this.onResize.bind( this ) );
    }

    render( timestamp ){

        requestAnimationFrame( this.renderHandler );

        this.cameraControl.update();
        this.camera.lookAt( this.scene.position );
        this.gpuGeometrySimulation.update();

        this.renderer.render( this.scene, this.camera );
    }

    onResize( e ){

        let w = window.innerWidth;
        let h = window.innerHeight;

        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( w, h );
        this.camera.aspect = w/h;
        this.camera.updateProjectionMatrix();
    }

}