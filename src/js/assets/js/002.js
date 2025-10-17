import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

window.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  app.render();
}, false);

class windGenerator {
  static MATERIAL_PARAM = {
    color: 0xffffff,
  };

  material
  fanGeometry;
  fanGroup;

  constructor() {
    this.material = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);

    this.fanGroup = new THREE.Group();
    this.scene.add(this.group);

    this.fanGeometry = new THREE.BoxGeometry(1.0, 0.1, 0.1);
  }
}

export class ThreeApp {
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 200.0,
    position: new THREE.Vector3(1.0, 1.0, 2.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };

  static RENDERER_PARAM = {
    clearColor: 0x666666,
    width: window.innerWidth,
    height: window.innerHeight,
  };

  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 10.0,
    position: new THREE.Vector3(1.0, 0.0, 0.0),
  };

  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 5,
  };

  static MATERIAL_PARAM = {
    color: 0x00000,
  };

  renderer;
  scene;
  camera;
  directionalLight;
  ambientLight;
  material;
  controls;
  windGenerator; // 風力発電機

  constructor(wrapper) {
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    wrapper.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far,
    );
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    this.directionalLight = new THREE.DirectionalLight(
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.color,
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position);
    this.scene.add(this.directionalLight);

    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    this.material = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);

    this.windGenerator = new windGenerator();
    this.scene.add(this.windGenerator);

    // 軸ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.render = this.render.bind(this);

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);
  }

  render() {
    requestAnimationFrame(this.render);
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }
}
