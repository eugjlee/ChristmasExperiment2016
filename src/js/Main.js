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
import {SpotLightShadow} from 'three';
import {TextureLoader} from 'three';
import {JSONLoader} from 'three';
import {Mesh} from 'three';
import {BoxGeometry} from 'three';
import {MeshNormalMaterial} from 'three';
import {PlaneBufferGeometry} from 'three';
import {MeshPhongMaterial} from 'three';

import {PCFSoftShadowMap} from 'three';

import {CameraHelper} from 'three';

import ShadowMapViewer from './utils/gpu/light/ShadowMapViewer';
import CameraControl from './utils/CameraControl';
import GPUGeometrySimulation from './utils/gpu/sim/GPUGeometrySimulation';

export default class Main {

    constructor() {

        this.initializeGui();
        this.init();
        this.setShadowmap();
        this.addEvents();
    };

    init() {

        this.textureLoader = new TextureLoader();
        this.container = document.getElementById('container');
        this.renderer = new WebGLRenderer( { antialias : true } );
        this.camera = new PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.01, 10 );
        this.cameraControl = new CameraControl( this.camera, [0, 0.15, 0] );
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
    };

    onLoadGeom( geometry, materials ){

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        this.geom = geometry;

        let s = 1;
        let square = s * s;
        let  initialBuffer = new Float32Array( square * 4, 4 );
        let  div = 1 / s;
        for (let i = 0; i < square ; i++) {
            initialBuffer[ i * 4 ] = ( 2. * div * ( ( i % s ) + 0.5 ) - 1 ) * 1 * 0.5;
            initialBuffer[ i * 4 + 1 ] = 1.5;
            initialBuffer[ i * 4 + 2 ] = ( 2. * div * ( Math.floor( i * div ) + 0.5 ) - 1 ) * 1 * 0.5;
            initialBuffer[ i * 4 + 3 ] = 100;

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

        this.scene.add( this.gpuGeometrySimulation.bufferMesh );
        this.gpuGeometrySimulation.bufferMesh.castShadow = true;
        this.gpuGeometrySimulation.bufferMesh.receiveShadow = true;

        this.renderHandler = this.render.bind( this );
        this.container.appendChild( this.renderer.domElement );
        this.onResize( null );
        this.render( 0 );
    };

    initializeGui() {

        this.lightProperties = {
            positionX : 0.0000,
            positionY : 1.7000,
            positionZ : 0.0000,
            targetX: 0.0000,
            targetY: 0.0000,
            targetZ: 0.0000,
            fov : 70.0000,
            near: 0.10000,
            far: 10.0000,
            decay: 0.00000,
            penumbra: 0.10000,
            distance: 10.0000,
            angle: Math.PI * 0.4,
            bias: 0.0100

        };

        this.gui = new dat.GUI();
        this.gui.add( this.lightProperties, 'positionX' ).min( -10 ).max( 10 ).step( 0.001 );
        this.gui.add( this.lightProperties, 'positionY' ).min( -10 ).max( 10 ).step( 0.001 );
        this.gui.add( this.lightProperties, 'positionZ' ).min( -10 ).max( 10 ).step( 0.001 );
        this.gui.add( this.lightProperties, 'targetX' ).min( -10 ).max( 10 ).step( 0.001 );
        this.gui.add( this.lightProperties, 'targetY' ).min( -10 ).max( 10 ).step( 0.001 );
        this.gui.add( this.lightProperties, 'targetZ' ).min( -10 ).max( 10 ).step( 0.001 );
        this.gui.add( this.lightProperties, 'fov' ).min( 10 ).max( 360 ).step( 1 );
        this.gui.add( this.lightProperties, 'near' ).min( 0.001 ).max( 1 ).step( 0.001 );
        this.gui.add( this.lightProperties, 'far' ).min( 5 ).max( 30 ).step( 0.01 );
        this.gui.add( this.lightProperties, 'decay' ).min( 0 ).max( 3 ).step( 0.001 );
        this.gui.add( this.lightProperties, 'penumbra' ).min( 0 ).max( 5 ).step( 0.001 );
        this.gui.add( this.lightProperties, 'distance' ).min( 1 ).max( 100 ).step( 0.1 );
        this.gui.add( this.lightProperties, 'angle' ).min( 0 ).max( Math.PI * 2 ).step( 0.01 );
        this.gui.add( this.lightProperties, 'bias' ).min( -0.5 ).max( 0.5 ).step( 0.001 );

    };

    setShadowmap(){

        const SHADOW_MAP_WIDTH = 1024;
        const SHADOW_MAP_HEIGHT = 1024;

        this.light = new SpotLight( 0xffffff, 0.1 );
        this.light.distance = 10;
        this.light.penumbra = 0.1;
        this.light.decay = 0;
        this.light.angle = Math.PI * 0.4;
        this.light.position.set( 0, 10, 0 );
        //this.light.target.position.set( 0, 0, 0 );

        this.light.castShadow = true;

        this.light.shadow = new SpotLightShadow( new PerspectiveCamera( 70, 1, 1, 12 ) );
        this.light.shadow.bias = 0.01;

        this.light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
        this.light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

        this.scene.add( this.light );

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

        this.debugShadowMap();

    };

    debugShadowMap(){

        this.scene.add(  new CameraHelper( this.light.shadow.camera ) );

        this.lightShadowMapViewer = new ShadowMapViewer( this.light );
        this.lightShadowMapViewer.position.x = 0;
        this.lightShadowMapViewer.position.y = 0;
        this.lightShadowMapViewer.size.width = 256;
        this.lightShadowMapViewer.size.height = 256;
        this.lightShadowMapViewer.update();

    };

    addEvents() {

        window.addEventListener( 'resize', this.onResize.bind( this ) );
    };

    render( timestamp ){

        requestAnimationFrame( this.renderHandler );

        this.updateGui();

        this.cameraControl.update();
        this.gpuGeometrySimulation.update( timestamp );

        this.renderer.setClearColor( 0x837E76);
        this.renderer.render( this.scene, this.camera );

        if(this.lightShadowMapViewer) {
            this.lightShadowMapViewer.update();
            this.lightShadowMapViewer.render( this.renderer );
        }

    };

    updateGui(){

        this.light.position.set(this.lightProperties.positionX, this.lightProperties.positionY, this.lightProperties.positionZ);
        this.light.distance = this.lightProperties.distance;
        this.light.penumbra = this.lightProperties.penumbra;
        this.light.decay = this.lightProperties.decay;
        this.light.angle = Math.PI * 0.4;

        this.light.target.position.set( this.lightProperties.targetX, this.lightProperties.targetY, this.lightProperties.targetZ );
        this.light.shadow.bias = this.lightProperties.bias;
        this.light.shadow.camera.lookAt(this.lightProperties.targetX, this.lightProperties.targetY, this.lightProperties.targetZ );
        this.light.shadow.camera.fov = this.lightProperties.fov;
        this.light.shadow.camera.near = this.lightProperties.near;
        this.light.shadow.camera.far = this.lightProperties.far;
        this.light.shadow.camera.updateProjectionMatrix();
    };

    onResize( e ){

        let w = window.innerWidth;
        let h = window.innerHeight;

        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( w, h );
        this.camera.aspect = w/h;
        this.camera.updateProjectionMatrix();
    };

}