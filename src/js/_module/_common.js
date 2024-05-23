import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

window.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  app.render();
}, false);

class ThreeApp {
  /**
   * カメラ定義のための定数
   */
  static CAMERA_PARAM = {
    // fovy は Field of View Y のことで、縦方向の視野角を意味する
    fovy: 60,
    // 描画する空間のアスペクト比（縦横比）
    aspect: window.innerWidth / window.innerHeight,
    // 描画する空間のニアクリップ面（最近面）
    near: 0.1,
    // 描画する空間のファークリップ面（最遠面）
    far: 200.0,
    // カメラの座標
    position: new THREE.Vector3(0.0, 2.0, 10.0),
    // カメラの注視点
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0x666666,       // 画面をクリアする色
    width: window.innerWidth,   // レンダラーに設定する幅
    height: window.innerHeight, // レンダラーに設定する高さ
  };
  /**
   * 平行光源定義のための定数
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,                            // 光の色
    intensity: 1.0,                             // 光の強度
    position: new THREE.Vector3(1.0, 1.0, 1.0), // 光の向き
  };
  /**
   * アンビエントライト定義のための定数
   */
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff, // 光の色
    intensity: 1,  // 光の強度
  };
  /**
   * マテリアル定義のための定数
   */
  static MATERIAL_PARAM1 = {
    color: 0xffffff,
  };
  static MATERIAL_PARAM2 = {
    color: 0x000000,
  };

  static POSITION_PARAM = {
    radius: 1, // 螺旋の半径
    height: 0.2, // 各ボックスの高さの間隔
    twist: 0.1, // 螺旋のひねり角度
  }

  renderer;         // レンダラ
  scene;            // シーン
  camera;           // カメラ
  directionalLight; // 平行光源（ディレクショナルライト）
  ambientLight;     // 環境光（アンビエントライト）
  material1;         // マテリアル
  material2;         // マテリアル
  boxGeometry;    // トーラスジオメトリ
  boxArray;       // トーラスメッシュの配列 @@@
  controls;         // オービットコントロール
  axesHelper;       // 軸ヘルパー
  isDown;           // キーの押下状態用フラグ

  /**
   * コンストラクタ
   * @constructor
   * @param {HTMLElement} wrapper - canvas 要素を append する親要素
   */
  constructor(wrapper) {
    // レンダラー
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far,
    );
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.color,
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position);
    this.scene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    // マテリアル
    this.material1 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM1);
    this.material2 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM2);

    const boxCount = 300;
    this.boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    this.boxArray1 = [];
    this.boxArray2 = [];


    for (let i = -150; i < boxCount - 150; ++i) {
      // トーラスメッシュのインスタンスを生成
      const box = new THREE.Mesh(this.boxGeometry, this.material1);
      // 座標をランダムに散らす
      // 位置の計算
      const angle = i * ThreeApp.POSITION_PARAM.twist;
      const x = ThreeApp.POSITION_PARAM.radius * Math.cos(angle);
      const z = ThreeApp.POSITION_PARAM.radius * Math.sin(angle);
      const y = i * ThreeApp.POSITION_PARAM.height;

      box.position.set(x, y, z);
      // シーンに追加する
      this.scene.add(box);
      this.boxArray1.push(box);

      // 初期角度をボックスに追加
      box.userData = { angle: angle };
    }

    for (let j = -150; j < boxCount - 150; ++j) {
      // トーラスメッシュのインスタンスを生成
      const box = new THREE.Mesh(this.boxGeometry, this.material2);
      // 座標をランダムに散らす
      // 位置の計算
      const angle = j * ThreeApp.POSITION_PARAM.twist;
      const x = ThreeApp.POSITION_PARAM.radius * Math.cos(angle);
      const z = ThreeApp.POSITION_PARAM.radius * Math.sin(angle);
      const y = j * ThreeApp.POSITION_PARAM.height;

      box.position.set(-x, -y, z);
      // シーンに追加する
      this.scene.add(box);
      this.boxArray2.push(box);

      // 初期角度をボックスに追加
      box.userData = { angle: angle };
    }

    // 軸ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // this のバインド
    this.render = this.render.bind(this);

    // ウィンドウのリサイズを検出できるようにする
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループの設定
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    //Y軸回転
    this.boxArray1.forEach((box) => {
      // ボックスの角度を更新
      box.userData.angle += 0.05;

      // 新しい位置の計算
      const x = ThreeApp.POSITION_PARAM.radius * Math.cos(box.userData.angle);
      const z = ThreeApp.POSITION_PARAM.radius * Math.sin(box.userData.angle);

      // 位置の更新
      box.position.x = x;
      box.position.z = z;
    });
    this.boxArray2.forEach((box) => {
      // ボックスの角度を更新
      box.userData.angle += 0.05;

      // 新しい位置の計算
      const x = ThreeApp.POSITION_PARAM.radius * Math.cos(box.userData.angle);
      const z = ThreeApp.POSITION_PARAM.radius * Math.sin(box.userData.angle);

      // 位置の更新
      box.position.x = -x;
      box.position.z = z;
    });

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}

