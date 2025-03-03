import * as THREE from 'three';  // Three.jsライブラリ全体をインポート
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';  // マウスでカメラを制御するための機能
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';  // GLTFローダーをインポート
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
// カメラの位置をラーメンを見下ろす角度に調整
camera.position.set(5, 4, 5);

// レンダラーの設定（3D空間を2Dの画面に描画する）
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#three-canvas'),  // 描画するcanvas要素の指定
  antialias: true,  // アンチエイリアスを有効化（輪郭のギザギザを滑らかに）
});
// レンダラーのサイズを画面いっぱいに設定
renderer.setSize(window.innerWidth, window.innerHeight);
// ピクセル比を設定（Retinaディスプレイ対応）
renderer.setPixelRatio(window.devicePixelRatio);
// 背景色を暖かみのある白に設定
renderer.setClearColor(0xfff8f0);  // 少しクリーム色がかった白

// カメラコントロールの設定（マウス操作での視点移動）
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // 視点移動を滑らかに
controls.dampingFactor = 0.05;  // 滑らかさの程度
// カメラの回転の制限（真上や真下からの視点を制限）
controls.minPolarAngle = Math.PI * 0.15; // 上からの視点を制限
controls.maxPolarAngle = Math.PI * 0.65; // 下からの視点を制限

// 環境光の追加（全体的な明るさ）
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);  // 強度を0.7から1.2に増加
scene.add(ambientLight);

// スポットライト（ラーメンを上から照らす）
const spotLight = new THREE.SpotLight(0xffffff, 1.5);  // 強度を1から1.5に増加
spotLight.position.set(0, 8, 0);  // 高さを上げる
spotLight.angle = Math.PI / 3;  // 照射角度を広げる
spotLight.penumbra = 0.2;  // やわらかい影に
spotLight.decay = 1.5;  // 減衰を緩やかに
spotLight.distance = 200;
scene.add(spotLight);

// 補助的な前方からのライト
const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
frontLight.position.set(0, 2, 5);
scene.add(frontLight);

// 補助的な後方からのライト（リムライト効果）
const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
backLight.position.set(0, 3, -5);
scene.add(backLight);

// ローディング管理
const loadingManager = new THREE.LoadingManager();
const loader = new GLTFLoader(loadingManager);

// ラーメンのモデルを読み込む
let ramen;
loader.load(
  '/models/ramen.glb',  // モデルのパス
  (gltf) => {
    ramen = gltf.scene;
    // モデルのサイズを調整（より大きく）
    ramen.scale.set(50, 50, 50);
    // モデルの位置調整（少し下げる）
    ramen.position.set(0, -1, 0);
    scene.add(ramen);
  },
  (progress) => {
    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
  },
  (error) => {
    console.error('Error loading model:', error);
    // エラー時は簡単な代替オブジェクトを表示
    const geometry = new THREE.CylinderGeometry(2, 2, 1, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const bowl = new THREE.Mesh(geometry, material);
    scene.add(bowl);
  }
);

// 湯気用のパーティクルシステム
function createSteamParticles() {
  const particleCount = 150;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];
  const lifetimes = [];
  const initialRadius = [];

  for (let i = 0; i < particleCount; i++) {
    const radius = Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.random() * 0.05;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    
    velocities.push({
      x: (Math.random() - 0.5) * 0.003,
      y: Math.random() * 0.02 + 0.015,
      z: (Math.random() - 0.5) * 0.003,
      angle: Math.random() * Math.PI * 2
    });
    
    lifetimes.push(Math.random() * 6 + 4);
    initialRadius.push(radius);
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xdddddd,
    size: 1.2,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: createSteamTexture()
  });

  const points = new THREE.Points(particles, material);
  points.position.y = 0.5;
  
  return {
    mesh: points,
    positions: positions,
    velocities: velocities,
    lifetimes: lifetimes,
    originalLifetimes: [...lifetimes],
    initialRadius: initialRadius
  };
}

// 湯気用のテクスチャを作成
function createSteamTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 湯気システムを作成
const steam = createSteamParticles();
scene.add(steam.mesh);

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  
  if (ramen) {
    ramen.rotation.y += 0.002;
  }
  
  // 湯気のアニメーション
  for (let i = 0; i < steam.lifetimes.length; i++) {
    steam.lifetimes[i] -= 0.016;
    
    if (steam.lifetimes[i] <= 0) {
      const radius = Math.random() * 2;
      const angle = Math.random() * Math.PI * 2;
      steam.positions[i * 3] = Math.cos(angle) * radius;
      steam.positions[i * 3 + 1] = Math.random() * 0.05;
      steam.positions[i * 3 + 2] = Math.sin(angle) * radius;
      steam.lifetimes[i] = steam.originalLifetimes[i];
      steam.initialRadius[i] = radius;
      steam.velocities[i].angle = Math.random() * Math.PI * 2;
    } else {
      const time = Date.now() * 0.0003;
      const height = steam.positions[i * 3 + 1];
      const lifeRatio = steam.lifetimes[i] / steam.originalLifetimes[i];
      
      // 渦を巻きながら上昇
      steam.velocities[i].angle += 0.01;
      const spiralRadius = steam.initialRadius[i] * (1 + height * 0.2);
      const spiralX = Math.cos(steam.velocities[i].angle) * spiralRadius;
      const spiralZ = Math.sin(steam.velocities[i].angle) * spiralRadius;
      
      steam.positions[i * 3] = spiralX + Math.sin(time + i) * 0.1;
      steam.positions[i * 3 + 1] += steam.velocities[i].y * lifeRatio;
      steam.positions[i * 3 + 2] = spiralZ + Math.cos(time + i) * 0.1;
      
      // 上昇に伴う広がり
      const spreadFactor = 1 + height * 0.2;
      steam.positions[i * 3] *= spreadFactor;
      steam.positions[i * 3 + 2] *= spreadFactor;
    }
  }
  
  steam.mesh.geometry.attributes.position.needsUpdate = true;
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