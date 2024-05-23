import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as TWEEN from "@tweenjs/tween.js";

window.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  const start = document.querySelector('#start')
  const scroll = document.querySelector('#scroll')
  start.addEventListener('click', () => {
    bodyScrollPrevent(false)
    app.firstFlag = false;
    app.randomScatter(app.boxArray);
    start.classList.add('is-hidden')
    setTimeout(() => {
      scroll.classList.remove('is-hidden')
    }, 500);
  })
  app.render();

  setTimeout(() => {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 0) {
        scroll.classList.add('is-hidden')
      } else {
        scroll.classList.remove('is-hidden')
      }
    })
  }, 10);
  bodyScrollPrevent(true)

  const restart = document.querySelector('#restart')
  restart.addEventListener('click', () => {
    location.reload()
    scroll.classList.add('is-hidden')
  })
}, false);

export class ThreeApp {
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 200.0,
    position: new THREE.Vector3(2.0, 0.0, 0.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };

  static RENDERER_PARAM = {
    clearColor: 0xffffff,
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
  boxGeometry;
  boxArray;
  controls;
  isDown;
  speed = 0.01;
  //アニメーション配列を用意
  animationScripts = [];
  scrollPercent = 0;
  time = Date.now() / 2000;//msを変数に格納
  initialPositions;
  initialRotations;
  spacing;
  gridSize;
  depth;
  group;
  firstFlag = true;

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

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // ボックスジオメトリのサイズと間隔
    this.spacing = 0.13;
    this.gridSize = 10;
    this.depth = 10;

    const boxCount = 1000;
    this.boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    this.boxArray = [];
    this.initialPositions = [];
    this.initialRotations = [];

    for (let i = 0; i < boxCount; ++i) {
      const box = new THREE.Mesh(this.boxGeometry, this.material);

      // グリッド配置用のインデックス計算
      const x = i % this.gridSize;
      const y = Math.floor((i % (this.gridSize * this.gridSize)) / this.gridSize);
      const z = Math.floor(i / (this.gridSize * this.gridSize));

      // 配置
      box.position.set(
          x * this.spacing - (this.gridSize * this.spacing) / 2,
          y * this.spacing - (this.gridSize * this.spacing) / 2,
          z * this.spacing - (this.depth * this.spacing) / 2
      );


      this.scene.add(box);
      this.boxArray.push(box);
      this.group.add(box);

      this.initialPositions.push(box.position.clone());
      this.initialRotations.push(box.rotation.clone());
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.render = this.render.bind(this);

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);


    //線形補完用関数を定義
    function lerp(x, y, a) {
      return (1 - a) * x + a * y;
    }

    //ブラウザのスクロール率を取得
    document.body.onscroll = () => {
      this.scrollPercent =
        (document.documentElement.scrollTop /
          (document.documentElement.scrollHeight -
            document.documentElement.clientHeight)) *
        100;
    };

    //各区間におけるスクロール率を取得
    const scalePercent = (start, end) => {
      return (this.scrollPercent - start) / (end - start);
    };

    //======================================================
    //アニメーション配列

    // ボックスをY軸を中心に円形に動かすアニメーション
    this.animationScripts.push({
      start: 0,
      end: 100,
      function: () => {
        const angle = scalePercent(0, 100) * Math.PI * 2;
        this.camera.position.x = Math.cos(angle) * 2;
        this.camera.position.z = Math.sin(angle) * 2;
        this.boxArray.forEach((box, index) => {
          const initialPosition = this.initialPositions[index];
          box.position.y = lerp(initialPosition.y, initialPosition.y+1.5, scalePercent(0, 20))

          const initialRotation = this.initialRotations[index];
          box.rotation.x = lerp(initialRotation.x, initialRotation.x+1.5, scalePercent(0, 20))
          box.rotation.y = lerp(initialRotation.y, initialRotation.y+1.5, scalePercent(0, 20))
          box.rotation.z = lerp(initialRotation.z, initialRotation.z+1.5, scalePercent(0, 20))
        });
      },
    });

    //アニメーション配列ここまで
    //======================================================
  }

  //アニメーション配列を実行する用関数
  playScrollAnimation() {
    if (window.scrollY > 0) {
      this.time = Date.now() / 2000;
      this.animationScripts.forEach((animation) => {
        if (this.scrollPercent >= animation.start && this.scrollPercent <= animation.end) {
          animation.function();
        }
      });
    }
  }

  render() {
    requestAnimationFrame(this.render);
    this.controls.update();
    TWEEN.update();

    if(this.firstFlag) {
      // グループ全体を回転させる
      this.group.rotation.x += 0.01;
      this.group.rotation.y += 0.01;
    } else {
      this.group.rotation.x = 0.0;
      this.group.rotation.y = 0.0;
    }

    this.playScrollAnimation();
    this.renderer.render(this.scene, this.camera);
  }

  randomScatter(boxes) {
    boxes.forEach((box, index) => {
      const x = Math.random() * 6 - 3;
      const y = Math.random() * 6 - 3;
      const z = Math.random() * 6 - 3;

      const changePositionFirst = new TWEEN.Tween(box.position)
        .to({ x: 0, y: 0, z: 0 }, 400)
        .easing(TWEEN.Easing.Exponential.Out)

      const changePositionSecond = new TWEEN.Tween(box.position)
        .to({ x: x, y: y, z: z }, 800)
        .easing(TWEEN.Easing.Circular.Out)

      const changeRotation = new TWEEN.Tween(box.rotation)
        .to({ x: x, y: y, z: z }, 800)
        .easing(TWEEN.Easing.Circular.Out)

      changePositionFirst.chain(changePositionSecond, changeRotation).start();



      // 初期位置を保存
      this.initialPositions[index].set(x, y, z);
      this.initialRotations[index].set(x, y, z);
    });
    this.boxArray = boxes;
  }
}



// モーダルなどのスクロール禁止スクリプト
function bodyScrollPrevent(flag) {
  let scrollPosition
  const body = document.getElementsByTagName('body')[0]
  //check iOS
  const ua = window.navigator.userAgent.toLowerCase()
  const isiOS =
    ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1 || (ua.indexOf('macintosh') > -1 && 'ontouchend' in document)
  //width scroll bar
  const scrollBarWidth = window.innerWidth - document.body.clientWidth

  if (flag) {
    body.style.paddingRight = scrollBarWidth + 'px'
    //if iOS, position:fixed
    if (isiOS) {
      scrollPosition = -window.scrollY
      body.style.position = 'fixed'
      body.style.width = '100%'
      body.style.top = scrollPosition + 'px'
      //if others, overflow:hidden
    } else {
      body.style.overflow = 'hidden'
      body.style.position = 'fixed'
    }
  } else if (!flag) {
    body.style.paddingRight = ''
    if (isiOS) {
      scrollPosition = parseInt(body.style.top.replace(/[^0-9]/g, ''))
      body.style.position = ''
      body.style.width = ''
      body.style.top = ''
      window.scrollTo(0, scrollPosition)
    } else {
      body.style.overflow = ''
      body.style.position = ''
    }
  }
}
