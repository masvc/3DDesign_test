import * as THREE from 'three';  // Three.jsライブラリ全体をインポート
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';  // マウスでカメラを制御するための機能
import './style.css';  // スタイルシートの適用

// シーンの作成（3D空間の土台となるコンテナ）
const scene = new THREE.Scene();

// カメラの設定
// PerspectiveCamera(画角, アスペクト比, 描画開始距離, 描画終了距離)
const camera = new THREE.PerspectiveCamera(
  75,  // 画角（視野角）
  window.innerWidth / window.innerHeight,  // 画面のアスペクト比
  0.1,  // 描画開始距離（これより手前は表示されない）
  1000  // 描画終了距離（これより奥は表示されない）
);
camera.position.z = 5;  // カメラを手前に移動（値が大きいほど遠くに配置）

// レンダラーの設定（3D空間を2Dの画面に描画する）
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#three-canvas'),  // 描画するcanvas要素の指定
  antialias: true,  // アンチエイリアスを有効化（輪郭のギザギザを滑らかに）
});
// レンダラーのサイズを画面いっぱいに設定
renderer.setSize(window.innerWidth, window.innerHeight);
// ピクセル比を設定（Retinaディスプレイ対応）
renderer.setPixelRatio(window.devicePixelRatio);

// カメラコントロールの設定（マウス操作での視点移動）
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // 視点移動を滑らかに
controls.dampingFactor = 0.05;  // 滑らかさの程度

// 環境光の追加（全体的な明るさ）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);  // 色, 強さ
scene.add(ambientLight);

// 平行光源の追加（太陽光のような一方向からの光）
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);  // 色, 強さ
directionalLight.position.set(2, 2, 5);  // 光源の位置
scene.add(directionalLight);

// 3Dオブジェクト（キューブ）の作成
const geometry = new THREE.BoxGeometry(1, 1, 1);  // 形状（サイズ：幅, 高さ, 奥行き）
const material = new THREE.MeshStandardMaterial({  // 材質
  color: 0x00ff00  // 緑色
});
const cube = new THREE.Mesh(geometry, material);  // 形状と材質を組み合わせてオブジェクトを作成
scene.add(cube);  // シーンに追加

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);  // 次のフレームを要求
  
  // カメラコントロールを更新（滑らかな動きを実現）
  controls.update();
  
  // キューブを回転
  cube.rotation.x += 0.01;  // X軸周りの回転
  cube.rotation.y += 0.01;  // Y軸周りの回転
  
  // シーンを描画
  renderer.render(scene, camera);
}

// ウィンドウのリサイズ時の処理
window.addEventListener('resize', () => {
  // カメラのアスペクト比を更新
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // レンダラーのサイズを更新
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// アニメーションの開始
animate(); 