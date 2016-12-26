/**
 * Created by siroko on 22/09/16.
 */

'use strict'

import dat from 'dat-gui';

import {WebGLRenderer} from 'three';
import {PerspectiveCamera} from 'three';
import {Scene} from 'three';
import {SpotLight} from 'three';
import {PointLight} from 'three';
import {AmbientLight} from 'three';
import {LightShadow} from 'three';
import {TextureLoader} from 'three';
import {JSONLoader} from 'three';
import {Mesh} from 'three';
import {BoxGeometry} from 'three';
import {MeshNormalMaterial} from 'three';
import {PlaneBufferGeometry} from 'three';
import {MeshPhongMaterial} from 'three';

import {PCFSoftShadowMap} from 'three';

import CameraControl from './utils/CameraControl';
import GPUGeometrySimulation from './utils/gpu/sim/GPUGeometrySimulation';

export default class Main {

    constructor() {

        this.initializeGui();
        this.init();
        this.setShadowmap();
        this.addEvents();
    }

    init() {

        this.textureLoader = new TextureLoader();
        this.container = document.getElementById('container');
        this.renderer = new WebGLRenderer( { antialias : true } );
        this.camera = new PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.cameraControl = new CameraControl( this.camera, [0, 0, 0] );
        this.scene = new Scene();

        let loader = new JSONLoader();
        let url = 'assets/obj/trump.json';
        loader.load( url, this.onLoadGeom.bind( this ) );

        this.floor = new Mesh( new PlaneBufferGeometry( 60, 60, 1, 1 ), new MeshPhongMaterial( {
            color: 0xDDDDDD,
            shininess: 0,
            specular: 0x111111
        } ) );

        this.floor.position.set( 0 , 0.1, 0 );
        this.floor.rotation.set( Math.PI * 1.5 , 0, 0 );
        this.scene.add( this.floor );
    }

    onLoadGeom( geometry, materials ){

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        this.geom = geometry;

        let s = 4;
        let square = s * s;
        let  initialBuffer = new Float32Array( square * 4, 4 );
        let  div = 1 / s;
        for (var i = 0; i < square ; i++) {
            initialBuffer[ i * 4 ] = ( 2. * div * ( ( i % s ) + 0.5 ) - 1 ) * 1 * 0.5;
            initialBuffer[ i * 4 + 1 ] = 0;
            initialBuffer[ i * 4 + 2 ] = ( 2. * div * ( Math.floor( i * div ) + 0.5 ) - 1 ) * 1 * 0.5;
            initialBuffer[ i * 4 + 3 ] = 1;

        }

        this.gpuGeometrySimulation = new GPUGeometrySimulation( {
            geom : geometry,
            initialBuffer: initialBuffer,
            matcap: this.textureLoader.load('assets/matcaps/matcap_twilight.jpg'),
            specialMatcap: this.textureLoader.load('assets/matcaps/emerald.jpg'),
            special2Matcap: this.textureLoader.load('assets/matcaps/matcap_purple.jpg'),
            sizeSimulation: s,
            isMobile: false,
            renderer: this.renderer
        } );

        // this.mesh = new Mesh(geometry, new MeshNormalMaterial({
        //     color: 0xFF00FF
        // }));
        // this.mesh.receiveShadow = true;
        // this.mesh.castShadow = true;

        this.scene.add( this.gpuGeometrySimulation.bufferMesh );
        this.gpuGeometrySimulation.bufferMesh.castShadow = true;
        this.gpuGeometrySimulation.bufferMesh.receiveShadow = true;
        // this.scene.add( this.mesh );

        this.renderHandler = this.render.bind( this );
        this.container.appendChild( this.renderer.domElement );
        this.onResize( null );
        this.render( 0 );
    }

    initializeGui(){

        // this.properties = {
        //     bendAngle : -2,
        //     offset : 0.5,
        //     bendAxisX : 0,
        //     bendAxisY : Math.PI * 0.5
        // };
        //
        // this.gui = new dat.GUI();
        // this.gui.add( this.properties, 'bendAngle' ).min( Math.PI * -2 ).max( Math.PI * 2 ).step( 0.01 );
        // this.gui.add( this.properties, 'offset' ).min( 0 ).max( 1 ).step( 0.01 );
        // this.gui.add( this.properties, 'bendAxisX' ).min( Math.PI * -0.5 ).max( Math.PI * 0.5 ).step( 0.01 );
        // this.gui.add( this.properties, 'bendAxisY' ).min( Math.PI * -0.5 ).max( Math.PI * 0.5 ).step( 0.01 );

    }

    setShadowmap(){

        var SHADOW_MAP_WIDTH = 1024;
        var SHADOW_MAP_HEIGHT = 1024;

        this.light = new SpotLight( 0xffffff, 0.1 );
        this.light.distance = 10;
        this.light.penumbra = 0.1;
        this.light.decay = 0;
        this.light.angle = Math.PI * 0.4;
        this.light.position.set( 0, 1.9, 0 );
        this.light.target.position.set( 0, 0, 0 );

        this.light.castShadow = true;

        this.light.shadow = new LightShadow( new PerspectiveCamera( 140, 1, 0.5, 5 ) );
        this.light.shadow.bias = 0.01;

        this.light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
        this.light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

        this.scene.add( this.light );

        // this.renderer.autoClear = false;

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;

        // this.floor.castShadow = true;
        this.floor.receiveShadow = true;

        this.pointLight = new PointLight( 0xFFFFFF, 0.4 );
        this.pointLight.position.set( 0, 3, 1 );
        this.scene.add( this.pointLight );

        this.pointLight2 = new PointLight( 0x446688, 0.2 );
        this.pointLight2.position.set( 0, 3, 1 );
        this.scene.add( this.pointLight2 );

        this.amb = new AmbientLight( 0x8C857C, 1 );
        this.scene.add( this.amb );

    }

    addEvents() {

        window.addEventListener( 'resize', this.onResize.bind( this ) );
    }

    render( timestamp ){

        requestAnimationFrame( this.renderHandler );

        this.cameraControl.update();
        this.gpuGeometrySimulation.update( timestamp );

        this.renderer.setClearColor( 0x837E76);
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