import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  CabinetDoorStyle,
  CabinetMaterialSpec,
  CameraPreset,
  FurnitureOption,
  KitchenLayoutType,
} from "../types";
import {
  getFloorPlankTexture,
  getMarbleTexture,
  getTileTexture,
  getVastuCompassTexture,
  getWoodTexture,
} from "../three/proceduralTextures";

export interface Kitchen3DViewerProps {
  layout: KitchenLayoutType;
  doorStyle: CabinetDoorStyle;
  upperFinish: CabinetMaterialSpec;
  lowerFinish: CabinetMaterialSpec;
  islandFinish: CabinetMaterialSpec;
  countertopFinish: CabinetMaterialSpec;
  backsplashFinish: CabinetMaterialSpec;
  hardwareFinish: CabinetMaterialSpec;
  diningOption: FurnitureOption;
  stoolOption: FurnitureOption;
  sofaOption: FurnitureOption;
  lightingOption: FurnitureOption;
  cameraPreset: CameraPreset;
  doorsOpen: boolean;
  explodedView: number;
  showVastuCompass: boolean;
  onSelectZone?: (zone: "upper" | "lower" | "island" | "furniture") => void;
  draggedSwatchLabel?: string | null;
  onDropAtZone?: (zone: "upper" | "lower" | "island" | "countertop" | "backsplash") => void;
}

const CAMERA_TARGETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  overview: { pos: [5.4, 3.6, 5.8], target: [-0.2, 1.0, 0.2] },
  island: { pos: [2.4, 2.0, 3.3], target: [0.0, 0.88, 0.85] },
  cabinets: { pos: [0.2, 1.65, 2.3], target: [-0.2, 1.4, -1.6] },
  living: { pos: [-4.4, 2.7, 5.2], target: [-2.8, 0.75, 1.4] },
  top: { pos: [0.0, 8.8, 0.5], target: [-0.8, 0.0, 0.6] },
};

const _vec3 = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function makeCabinetMaterial(
  spec: CabinetMaterialSpec,
  anisotropy: number
): THREE.MeshPhysicalMaterial {
  if (spec.isWood) {
    const map = getWoodTexture(
      spec.hex,
      spec.secondaryHex ?? "#3E2A1E",
      Boolean(spec.isFluted),
      anisotropy
    );
    return new THREE.MeshPhysicalMaterial({
      map,
      roughness: spec.roughness,
      metalness: spec.metalness,
      clearcoat: 0.14,
      clearcoatRoughness: 0.45,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(spec.hex),
    roughness: spec.roughness,
    metalness: spec.metalness,
    clearcoat: spec.category === "lacquer" ? 0.68 : 0.08,
    clearcoatRoughness: spec.category === "lacquer" ? 0.18 : 0.5,
  });
}

function makeCountertopMaterial(
  spec: CabinetMaterialSpec,
  anisotropy: number
): THREE.MeshPhysicalMaterial {
  const map = getMarbleTexture(
    spec.hex,
    spec.secondaryHex ?? "#B8B2A6",
    anisotropy
  );
  return new THREE.MeshPhysicalMaterial({
    map,
    roughness: spec.roughness,
    metalness: spec.metalness,
    clearcoat: 0.55,
    clearcoatRoughness: 0.16,
  });
}

function makeBacksplashMaterial(
  spec: CabinetMaterialSpec,
  anisotropy: number
): THREE.MeshStandardMaterial {
  if (spec.isMarble) {
    return new THREE.MeshStandardMaterial({
      map: getMarbleTexture(spec.hex, spec.secondaryHex ?? "#C8A96B", anisotropy),
      roughness: spec.roughness,
      metalness: spec.metalness,
    });
  }
  return new THREE.MeshStandardMaterial({
    map: getTileTexture(spec.hex, spec.secondaryHex ?? "#CFC8BC", anisotropy),
    roughness: spec.roughness,
    metalness: spec.metalness,
  });
}

function makeHardwareMaterial(spec: CabinetMaterialSpec): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(spec.hex),
    roughness: spec.roughness,
    metalness: spec.metalness,
    anisotropy: 0.7,
    clearcoat: 0.2,
  });
}

function buildCabinetDoorGroup(
  w: number,
  h: number,
  depth: number,
  style: CabinetDoorStyle,
  frontMat: THREE.Material,
  hardwareMat: THREE.Material,
  glassMat: THREE.Material,
  isUpper: boolean,
  hingeSide: "left" | "right",
  zoneTag: "upper" | "lower" | "island"
): THREE.Group {
  const pivot = new THREE.Group();
  const sign = hingeSide === "left" ? 1 : -1;
  const doorMeshGroup = new THREE.Group();
  doorMeshGroup.position.x = (sign * w) / 2;

  if (style === "vitrine" && isUpper) {
    const frameT = 0.042;
    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(w, frameT, depth),
      frontMat
    );
    topBar.position.y = h / 2 - frameT / 2;
    const botBar = new THREE.Mesh(
      new THREE.BoxGeometry(w, frameT, depth),
      frontMat
    );
    botBar.position.y = -h / 2 + frameT / 2;
    const leftBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameT, h - frameT * 2, depth),
      frontMat
    );
    leftBar.position.x = -w / 2 + frameT / 2;
    const rightBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameT, h - frameT * 2, depth),
      frontMat
    );
    rightBar.position.x = w / 2 - frameT / 2;

    const glassPane = new THREE.Mesh(
      new THREE.BoxGeometry(w - frameT * 2, h - frameT * 2, depth * 0.45),
      glassMat
    );
    glassPane.userData.zone = zoneTag;

    [topBar, botBar, leftBar, rightBar, glassPane].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.zone = zoneTag;
      doorMeshGroup.add(m);
    });
  } else {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.005, h - 0.005, depth),
      frontMat
    );
    panel.castShadow = true;
    panel.receiveShadow = true;
    panel.userData.zone = zoneTag;
    doorMeshGroup.add(panel);

    if (style === "shaker") {
      const stile = 0.052;
      const trimDepth = 0.012;
      const tTop = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.006, stile, trimDepth),
        frontMat
      );
      tTop.position.set(0, h / 2 - stile / 2, depth / 2 + trimDepth / 2);
      const tBot = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.006, stile, trimDepth),
        frontMat
      );
      tBot.position.set(0, -h / 2 + stile / 2, depth / 2 + trimDepth / 2);
      const tL = new THREE.Mesh(
        new THREE.BoxGeometry(stile, h - stile * 2, trimDepth),
        frontMat
      );
      tL.position.set(-w / 2 + stile / 2, 0, depth / 2 + trimDepth / 2);
      const tR = new THREE.Mesh(
        new THREE.BoxGeometry(stile, h - stile * 2, trimDepth),
        frontMat
      );
      tR.position.set(w / 2 - stile / 2, 0, depth / 2 + trimDepth / 2);
      [tTop, tBot, tL, tR].forEach((m) => {
        m.castShadow = true;
        m.receiveShadow = true;
        m.userData.zone = zoneTag;
        doorMeshGroup.add(m);
      });
    } else if (style === "fluted") {
      const ribCount = Math.max(5, Math.floor(w / 0.042));
      for (let i = 0; i < ribCount; i++) {
        const rx = -w / 2 + 0.024 + (i * (w - 0.048)) / Math.max(1, ribCount - 1);
        const rib = new THREE.Mesh(
          new THREE.BoxGeometry(0.014, h - 0.02, 0.009),
          frontMat
        );
        rib.position.set(rx, 0, depth / 2 + 0.004);
        rib.castShadow = true;
        rib.userData.zone = zoneTag;
        doorMeshGroup.add(rib);
      }
    }
  }

  // Architectural Pull Handle
  if (style !== "slab") {
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, isUpper ? 0.2 : 0.18, 12),
      hardwareMat
    );
    const hx = hingeSide === "left" ? w / 2 - 0.045 : -w / 2 + 0.045;
    const hy = isUpper ? -h / 2 + 0.16 : h / 2 - 0.16;
    handle.position.set(hx, hy, depth / 2 + 0.024);
    handle.castShadow = true;
    handle.userData.zone = zoneTag;
    doorMeshGroup.add(handle);
  } else {
    // Handleless recessed J-channel accent bar
    const channel = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.02, 0.012, 0.01),
      hardwareMat
    );
    channel.position.set(0, isUpper ? -h / 2 + 0.01 : h / 2 - 0.01, depth / 2 + 0.004);
    channel.userData.zone = zoneTag;
    doorMeshGroup.add(channel);
  }

  pivot.add(doorMeshGroup);
  return pivot;
}

export const KitchenFurniture3DViewer: React.FC<Kitchen3DViewerProps> = ({
  layout,
  doorStyle,
  upperFinish,
  lowerFinish,
  islandFinish,
  countertopFinish,
  backsplashFinish,
  hardwareFinish,
  diningOption,
  stoolOption,
  sofaOption,
  lightingOption,
  cameraPreset,
  doorsOpen,
  explodedView,
  showVastuCompass,
  onSelectZone,
  draggedSwatchLabel,
  onDropAtZone,
}) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [hoverDropZone, setHoverDropZone] = useState<
    "upper" | "lower" | "island" | "countertop" | "backsplash" | null
  >(null);

  const propsRef = useRef({
    layout,
    doorStyle,
    upperFinish,
    lowerFinish,
    islandFinish,
    countertopFinish,
    backsplashFinish,
    hardwareFinish,
    diningOption,
    stoolOption,
    sofaOption,
    lightingOption,
    cameraPreset,
    doorsOpen,
    explodedView,
    showVastuCompass,
    onSelectZone,
    draggedSwatchLabel,
    onDropAtZone,
  });
  propsRef.current = {
    layout,
    doorStyle,
    upperFinish,
    lowerFinish,
    islandFinish,
    countertopFinish,
    backsplashFinish,
    hardwareFinish,
    diningOption,
    stoolOption,
    sofaOption,
    lightingOption,
    cameraPreset,
    doorsOpen,
    explodedView,
    showVastuCompass,
    onSelectZone,
    draggedSwatchLabel,
    onDropAtZone,
  };

  const sceneApiRef = useRef<{
    rebuildDynamicScene: () => void;
    triggerCameraPreset: (preset: CameraPreset) => void;
    requestRender: () => void;
    raycastDropZone: (
      clientX: number,
      clientY: number
    ) => "upper" | "lower" | "island" | "countertop" | "backsplash" | null;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#EFECE5");
    scene.fog = new THREE.FogExp2("#EFECE5", 0.032);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(5.4, 3.6, 5.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    // Studio Reflection Environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmrem.dispose();

    // 3-Point Warm/Cool Architectural Lighting
    const hemiLight = new THREE.HemisphereLight("#F5F8FC", "#B8A992", 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight("#FFF5E4", 2.0);
    keyLight.position.set(6.5, 8.5, 5.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight("#DCE7F5", 0.75);
    rimLight.position.set(-6, 5, -5);
    scene.add(rimLight);

    const warmIslandLight = new THREE.PointLight("#FFE3B3", 1.2, 8, 1.5);
    warmIslandLight.position.set(0, 2.35, 0.85);
    scene.add(warmIslandLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(-0.2, 1.0, 0.2);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.0;
    controls.maxDistance = 12.5;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minPolarAngle = 0.15;

    // Static Architectural Studio Shell
    const staticGroup = new THREE.Group();
    scene.add(staticGroup);

    const floorTex = getFloorPlankTexture(maxAnisotropy);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.72,
      metalness: 0.02,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 16), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    staticGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
      color: "#F4F1EA",
      roughness: 0.88,
      metalness: 0.0,
    });

    // Back kitchen wall (North)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.2, 0.18), wallMat);
    backWall.position.set(-1.1, 1.6, -2.05);
    backWall.receiveShadow = true;
    staticGroup.add(backWall);

    // Right architectural wall with sunlit window opening (East)
    const rightWallBottom = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.95, 7.6),
      wallMat
    );
    rightWallBottom.position.set(3.6, 0.475, 1.7);
    rightWallBottom.receiveShadow = true;
    staticGroup.add(rightWallBottom);

    const rightWallTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.7, 7.6),
      wallMat
    );
    rightWallTop.position.set(3.6, 2.85, 1.7);
    staticGroup.add(rightWallTop);

    const rightWallPillarA = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.55, 2.2),
      wallMat
    );
    rightWallPillarA.position.set(3.6, 1.725, -0.95);
    staticGroup.add(rightWallPillarA);

    const rightWallPillarB = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.55, 2.2),
      wallMat
    );
    rightWallPillarB.position.set(3.6, 1.725, 4.4);
    staticGroup.add(rightWallPillarB);

    // Window Mullions
    const mullionMat = new THREE.MeshStandardMaterial({
      color: "#22252A",
      roughness: 0.35,
      metalness: 0.7,
    });
    const mullionFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.56, 0.06),
      mullionMat
    );
    mullionFrame.position.set(3.6, 1.725, 1.7);
    staticGroup.add(mullionFrame);

    // Baseboard trim
    const trimMat = new THREE.MeshStandardMaterial({
      color: "#E4DFD5",
      roughness: 0.65,
    });
    const baseboard = new THREE.Mesh(
      new THREE.BoxGeometry(9.5, 0.1, 0.03),
      trimMat
    );
    baseboard.position.set(-1.1, 0.05, -1.95);
    staticGroup.add(baseboard);

    // Vastu Compass Overlay Disc (Y = 0.02 to prevent Z-fighting)
    const compassTex = getVastuCompassTexture(maxAnisotropy);
    const compassMat = new THREE.MeshBasicMaterial({
      map: compassTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const compassMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 7.2),
      compassMat
    );
    compassMesh.rotation.x = -Math.PI / 2;
    compassMesh.position.set(-0.5, 0.02, 1.1);
    compassMesh.visible = propsRef.current.showVastuCompass;
    scene.add(compassMesh);

    // Dynamic Configurable Group
    const dynamicRoot = new THREE.Group();
    scene.add(dynamicRoot);

    // Animation Trackers
    let animatedDoors: { pivot: THREE.Group; sign: number }[] = [];
    let upperGroupRef: THREE.Group | null = null;
    let countertopRefs: THREE.Object3D[] = [];
    let islandGroupRef: THREE.Group | null = null;
    let clickableMeshes: THREE.Object3D[] = [];

    let currentDoorOpen = propsRef.current.doorsOpen ? 1 : 0;
    let currentExplode = propsRef.current.explodedView;

    let camTransitionActive = false;
    const camTargetPos = new THREE.Vector3(5.4, 3.6, 5.8);
    const camTargetLook = new THREE.Vector3(-0.2, 1.0, 0.2);

    const disposeGroup = (group: THREE.Object3D) => {
      const mats = new Set<THREE.Material>();
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mats.add(mat));
          } else if (m.material) {
            mats.add(m.material);
          }
        }
      });
      mats.forEach((m) => m.dispose());
    };

    const rebuildDynamicScene = () => {
      disposeGroup(dynamicRoot);
      dynamicRoot.clear();
      animatedDoors = [];
      countertopRefs = [];
      clickableMeshes = [];

      const p = propsRef.current;

      const upperMat = makeCabinetMaterial(p.upperFinish, maxAnisotropy);
      const lowerMat = makeCabinetMaterial(p.lowerFinish, maxAnisotropy);
      const islandMat = makeCabinetMaterial(p.islandFinish, maxAnisotropy);
      const counterMat = makeCountertopMaterial(p.countertopFinish, maxAnisotropy);
      const splashMat = makeBacksplashMaterial(p.backsplashFinish, maxAnisotropy);
      const hwMat = makeHardwareMaterial(p.hardwareFinish);
      const carcassMat = new THREE.MeshStandardMaterial({
        color: "#EAE6DD",
        roughness: 0.72,
      });
      const toeKickMat = new THREE.MeshStandardMaterial({
        color: "#2B2D30",
        roughness: 0.65,
        metalness: 0.1,
      });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: "#DDE6E8",
        roughness: 0.12,
        metalness: 0.05,
        transmission: isSoftwareGl ? 0 : 0.75,
        transparent: true,
        opacity: isSoftwareGl ? 0.36 : 1,
        ior: 1.5,
        thickness: 0.04,
      });
      const applianceMat = new THREE.MeshStandardMaterial({
        color: "#202226",
        roughness: 0.28,
        metalness: 0.78,
      });
      const steelSinkMat = new THREE.MeshStandardMaterial({
        color: "#C4C9CE",
        roughness: 0.22,
        metalness: 0.9,
      });

      // 1. BACK WALL LOWER CABINETS (4 modules spanning X: -1.6 to +1.6)
      const lowerGroup = new THREE.Group();
      dynamicRoot.add(lowerGroup);

      const toeKick = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.11, 0.56),
        toeKickMat
      );
      toeKick.position.set(0.2, 0.055, -1.66);
      toeKick.castShadow = true;
      toeKick.receiveShadow = true;
      lowerGroup.add(toeKick);

      const moduleCount = 6;
      const modW = 0.6;
      const startX = -1.6 + modW / 2;

      for (let i = 0; i < moduleCount; i++) {
        const mx = startX + i * modW;
        const carcass = new THREE.Mesh(
          new THREE.BoxGeometry(modW - 0.01, 0.75, 0.6),
          carcassMat
        );
        carcass.position.set(mx, 0.485, -1.64);
        carcass.castShadow = true;
        carcass.receiveShadow = true;
        carcass.userData.zone = "lower";
        lowerGroup.add(carcass);

        const hingeSide = i % 2 === 0 ? "left" : "right";
        const doorPivot = buildCabinetDoorGroup(
          modW - 0.014,
          0.73,
          0.024,
          p.doorStyle,
          lowerMat,
          hwMat,
          glassMat,
          false,
          hingeSide,
          "lower"
        );
        doorPivot.position.set(
          hingeSide === "left" ? mx - (modW - 0.014) / 2 : mx + (modW - 0.014) / 2,
          0.485,
          -1.33
        );
        lowerGroup.add(doorPivot);
        animatedDoors.push({
          pivot: doorPivot,
          sign: hingeSide === "left" ? -1 : 1,
        });
        clickableMeshes.push(doorPivot);
      }

      // Tall Refrigerator / Pantry Tower on Left (X = -1.95)
      const tallCarcass = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 2.28, 0.64),
        lowerMat
      );
      tallCarcass.position.set(-2.0, 1.14, -1.64);
      tallCarcass.castShadow = true;
      tallCarcass.receiveShadow = true;
      tallCarcass.userData.zone = "lower";
      lowerGroup.add(tallCarcass);

      // Integrated French-door Stainless Fridge Panel
      const fridgeBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.84, 0.04),
        applianceMat
      );
      fridgeBody.position.set(-2.0, 1.05, -1.31);
      fridgeBody.castShadow = true;
      lowerGroup.add(fridgeBody);
      const fridgeHandleL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.62, 10),
        hwMat
      );
      fridgeHandleL.position.set(-2.05, 1.25, -1.27);
      const fridgeHandleR = fridgeHandleL.clone();
      fridgeHandleR.position.set(-1.95, 1.25, -1.27);
      lowerGroup.add(fridgeHandleL, fridgeHandleR);

      // Back Countertop Slab
      const backCounter = new THREE.Mesh(
        new THREE.BoxGeometry(3.66, 0.045, 0.66),
        counterMat
      );
      backCounter.position.set(0.2, 0.885, -1.62);
      backCounter.castShadow = true;
      backCounter.receiveShadow = true;
      backCounter.userData.zone = "countertop";
      dynamicRoot.add(backCounter);
      countertopRefs.push(backCounter);
      clickableMeshes.push(backCounter);

      // Induction Cooktop on Back Counter
      const cooktop = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.014, 0.48),
        applianceMat
      );
      cooktop.position.set(0.2, 0.914, -1.62);
      dynamicRoot.add(cooktop);

      // Backsplash Wall Section
      const backsplash = new THREE.Mesh(
        new THREE.BoxGeometry(3.66, 0.62, 0.025),
        splashMat
      );
      backsplash.position.set(0.2, 1.21, -1.94);
      backsplash.receiveShadow = true;
      backsplash.userData.zone = "backsplash";
      dynamicRoot.add(backsplash);
      clickableMeshes.push(backsplash);

      // Architectural Chimney Range Hood above Cooktop
      const hoodBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.84, 0.08, 0.48),
        applianceMat
      );
      hoodBase.position.set(0.2, 1.66, -1.68);
      hoodBase.castShadow = true;
      const hoodFlue = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.72, 0.28),
        applianceMat
      );
      hoodFlue.position.set(0.2, 2.04, -1.78);
      hoodFlue.castShadow = true;
      dynamicRoot.add(hoodBase, hoodFlue);

      // 2. UPPER WALL CABINETS (Left + Right of Chimney Hood)
      upperGroupRef = new THREE.Group();
      dynamicRoot.add(upperGroupRef);

      const upperModules = [
        { x: -1.3, w: 0.58 },
        { x: -0.7, w: 0.58 },
        { x: 1.1, w: 0.58 },
        { x: 1.7, w: 0.58 },
      ];

      upperModules.forEach((um, idx) => {
        const uCarcass = new THREE.Mesh(
          new THREE.BoxGeometry(um.w, 0.82, 0.36),
          carcassMat
        );
        uCarcass.position.set(um.x, 1.94, -1.77);
        uCarcass.castShadow = true;
        uCarcass.receiveShadow = true;
        uCarcass.userData.zone = "upper";
        upperGroupRef!.add(uCarcass);

        // Interior shelf visible inside vitrine glass
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(um.w - 0.04, 0.02, 0.3),
          carcassMat
        );
        shelf.position.set(um.x, 1.92, -1.77);
        upperGroupRef!.add(shelf);

        const hingeSide = idx % 2 === 0 ? "left" : "right";
        const uDoor = buildCabinetDoorGroup(
          um.w - 0.01,
          0.81,
          0.022,
          p.doorStyle,
          upperMat,
          hwMat,
          glassMat,
          true,
          hingeSide,
          "upper"
        );
        uDoor.position.set(
          hingeSide === "left" ? um.x - (um.w - 0.01) / 2 : um.x + (um.w - 0.01) / 2,
          1.94,
          -1.58
        );
        upperGroupRef!.add(uDoor);
        animatedDoors.push({
          pivot: uDoor,
          sign: hingeSide === "left" ? -1 : 1,
        });
        clickableMeshes.push(uDoor);
      });

      // Under-cabinet warm LED strip glow bar
      const ledStripMat = new THREE.MeshBasicMaterial({ color: "#FFE8BA" });
      const ledL = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.012, 0.02), ledStripMat);
      ledL.position.set(-1.0, 1.525, -1.64);
      const ledR = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.012, 0.02), ledStripMat);
      ledR.position.set(1.4, 1.525, -1.64);
      upperGroupRef.add(ledL, ledR);

      // 3. LAYOUT-SPECIFIC WING (Right L-wing or U-wing)
      if (p.layout === "l-island" || p.layout === "u-chef") {
        // Right counter run along East wall
        const wingCarcass = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.86, 2.2),
          lowerMat
        );
        wingCarcass.position.set(2.35, 0.43, -0.55);
        wingCarcass.castShadow = true;
        wingCarcass.receiveShadow = true;
        wingCarcass.userData.zone = "lower";
        dynamicRoot.add(wingCarcass);

        const wingTop = new THREE.Mesh(
          new THREE.BoxGeometry(0.66, 0.045, 2.26),
          counterMat
        );
        wingTop.position.set(2.35, 0.885, -0.55);
        wingTop.castShadow = true;
        wingTop.receiveShadow = true;
        dynamicRoot.add(wingTop);
        countertopRefs.push(wingTop);
      }

      if (p.layout === "u-chef") {
        // Left Peninsula Wing
        const leftWing = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.86, 2.0),
          lowerMat
        );
        leftWing.position.set(-2.05, 0.43, -0.35);
        leftWing.castShadow = true;
        leftWing.receiveShadow = true;
        leftWing.userData.zone = "lower";
        dynamicRoot.add(leftWing);

        const leftWingTop = new THREE.Mesh(
          new THREE.BoxGeometry(0.66, 0.045, 2.05),
          counterMat
        );
        leftWingTop.position.set(-2.05, 0.885, -0.35);
        leftWingTop.castShadow = true;
        dynamicRoot.add(leftWingTop);
        countertopRefs.push(leftWingTop);
      }

      // 4. WATERFALL KITCHEN ISLAND OR PARALLEL GALLEY COUNTER
      islandGroupRef = new THREE.Group();
      dynamicRoot.add(islandGroupRef);

      const islandZ = p.layout === "galley" ? 0.3 : 0.72;
      const islandW = p.layout === "galley" ? 3.2 : 2.65;
      const islandD = 0.96;

      const islandBase = new THREE.Mesh(
        new THREE.BoxGeometry(islandW - 0.14, 0.85, islandD - 0.24),
        islandMat
      );
      islandBase.position.set(0.05, 0.435, islandZ - 0.08);
      islandBase.castShadow = true;
      islandBase.receiveShadow = true;
      islandBase.userData.zone = "island";
      islandGroupRef.add(islandBase);

      // Decorative island front paneling / fluted slats
      for (let k = 0; k < 4; k++) {
        const px = 0.05 - (islandW - 0.24) / 2 + 0.3 + k * ((islandW - 0.5) / 3);
        const panelFront = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, 0.74, 0.022),
          islandMat
        );
        panelFront.position.set(px, 0.46, islandZ - 0.08 + (islandD - 0.24) / 2 + 0.01);
        panelFront.castShadow = true;
        panelFront.userData.zone = "island";
        islandGroupRef.add(panelFront);
      }

      // Waterfall Countertop + Sides
      const islandTop = new THREE.Mesh(
        new THREE.BoxGeometry(islandW, 0.048, islandD),
        counterMat
      );
      islandTop.position.set(0.05, 0.885, islandZ);
      islandTop.castShadow = true;
      islandTop.receiveShadow = true;
      islandTop.userData.zone = "countertop";
      islandGroupRef.add(islandTop);
      countertopRefs.push(islandTop);

      const wfLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.048, 0.9, islandD),
        counterMat
      );
      wfLeft.position.set(0.05 - islandW / 2 + 0.024, 0.45, islandZ);
      wfLeft.castShadow = true;
      wfLeft.userData.zone = "countertop";
      const wfRight = wfLeft.clone();
      wfRight.position.x = 0.05 + islandW / 2 - 0.024;
      wfRight.userData.zone = "countertop";
      islandGroupRef.add(wfLeft, wfRight);
      clickableMeshes.push(islandBase, islandTop, wfLeft, wfRight);

      // Undermount Sink + Arched Gooseneck Faucet
      const sinkBasin = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.02, 0.42),
        steelSinkMat
      );
      sinkBasin.position.set(-0.45, 0.902, islandZ - 0.06);
      islandGroupRef.add(sinkBasin);

      const faucetCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.45, 0.91, islandZ - 0.3),
        new THREE.Vector3(-0.45, 1.18, islandZ - 0.3),
        new THREE.Vector3(-0.45, 1.24, islandZ - 0.18),
        new THREE.Vector3(-0.45, 1.13, islandZ - 0.1),
      ]);
      const faucetTube = new THREE.Mesh(
        new THREE.TubeGeometry(faucetCurve, 18, 0.012, 10, false),
        hwMat
      );
      faucetTube.castShadow = true;
      islandGroupRef.add(faucetTube);

      // 5. PENDANT LIGHTING ABOVE ISLAND
      const lightPrimaryMat = new THREE.MeshPhysicalMaterial({
        color: p.lightingOption.primaryHex,
        emissive: "#FFDFB0",
        emissiveIntensity: 0.42,
        roughness: 0.25,
        metalness: p.lightingOption.styleVariant === "b" ? 0.85 : 0.1,
      });
      const cordMat = new THREE.MeshStandardMaterial({
        color: p.lightingOption.accentHex,
        roughness: 0.35,
        metalness: 0.85,
      });

      if (p.lightingOption.styleVariant === "b") {
        // Linear Brass Bar
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(1.75, 0.045, 0.055),
          lightPrimaryMat
        );
        bar.position.set(0.05, 2.22, islandZ);
        bar.castShadow = true;
        const stemL = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 0.98, 8),
          cordMat
        );
        stemL.position.set(-0.55, 2.71, islandZ);
        const stemR = stemL.clone();
        stemR.position.x = 0.65;
        dynamicRoot.add(bar, stemL, stemR);
      } else {
        [-0.65, 0.05, 0.75].forEach((px) => {
          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.007, 0.007, 0.95, 8),
            cordMat
          );
          stem.position.set(px, 2.72, islandZ);
          const shadeGeom =
            p.lightingOption.styleVariant === "c"
              ? new THREE.CylinderGeometry(0.07, 0.15, 0.22, 20)
              : new THREE.SphereGeometry(0.115, 20, 16);
          const shade = new THREE.Mesh(shadeGeom, lightPrimaryMat);
          shade.position.set(px, 2.2, islandZ);
          shade.castShadow = true;
          dynamicRoot.add(stem, shade);
        });
      }

      // 6. COUNTER STOOLS AT ISLAND OVERHANG
      const stoolSeatMat = new THREE.MeshStandardMaterial({
        color: p.stoolOption.primaryHex,
        roughness: p.stoolOption.isWood ? 0.55 : 0.72,
      });
      const stoolFrameMat = new THREE.MeshStandardMaterial({
        color: p.stoolOption.accentHex,
        roughness: p.stoolOption.styleVariant === "a" ? 0.5 : 0.28,
        metalness: p.stoolOption.styleVariant === "a" ? 0.05 : 0.85,
      });

      [-0.72, 0.05, 0.82].forEach((sx) => {
        const stoolGroup = new THREE.Group();
        stoolGroup.position.set(sx, 0, islandZ + 0.58);
        const seat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.19, 0.18, 0.055, 20),
          stoolSeatMat
        );
        seat.position.y = 0.64;
        seat.castShadow = true;
        stoolGroup.add(seat);

        const back = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.16, 0.04),
          stoolSeatMat
        );
        back.position.set(0, 0.75, 0.15);
        back.castShadow = true;
        stoolGroup.add(back);

        [
          [-0.13, -0.13],
          [0.13, -0.13],
          [-0.13, 0.13],
          [0.13, 0.13],
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.014, 0.01, 0.63, 8),
            stoolFrameMat
          );
          leg.position.set(lx, 0.315, lz);
          leg.castShadow = true;
          stoolGroup.add(leg);
        });

        const footRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.145, 0.008, 8, 20),
          stoolFrameMat
        );
        footRing.rotation.x = Math.PI / 2;
        footRing.position.y = 0.22;
        stoolGroup.add(footRing);

        stoolGroup.userData.zone = "furniture";
        dynamicRoot.add(stoolGroup);
        clickableMeshes.push(stoolGroup);
      });

      // 7. DINING TABLE & CHAIRS SUITE (Left-Front Zone: X = -3.1, Z = 0.4)
      const diningGroup = new THREE.Group();
      diningGroup.position.set(-3.2, 0, -0.15);
      dynamicRoot.add(diningGroup);

      const tableTopMat = p.diningOption.isWood
        ? new THREE.MeshStandardMaterial({
            map: getWoodTexture(
              p.diningOption.primaryHex,
              "#3A2417",
              false,
              maxAnisotropy
            ),
            roughness: 0.45,
          })
        : new THREE.MeshStandardMaterial({
            map: getMarbleTexture(
              p.diningOption.primaryHex,
              "#A69984",
              maxAnisotropy
            ),
            roughness: 0.28,
          });
      const tableBaseMat = new THREE.MeshStandardMaterial({
        color: p.diningOption.accentHex,
        roughness: 0.4,
        metalness: p.diningOption.styleVariant === "c" ? 0.6 : 0.1,
      });

      const tableTop = new THREE.Mesh(
        p.diningOption.styleVariant === "b"
          ? new THREE.CylinderGeometry(0.85, 0.85, 0.05, 32)
          : new THREE.BoxGeometry(1.15, 0.05, 1.95),
        tableTopMat
      );
      if (p.diningOption.styleVariant === "b") {
        tableTop.scale.set(0.75, 1, 1.2);
      }
      tableTop.position.y = 0.74;
      tableTop.castShadow = true;
      tableTop.receiveShadow = true;
      tableTop.userData.zone = "furniture";
      diningGroup.add(tableTop);

      if (p.diningOption.styleVariant === "b") {
        // Dual cylinder travertine pedestals
        [-0.42, 0.42].forEach((pz) => {
          const ped = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.2, 0.72, 20),
            tableTopMat
          );
          ped.position.set(0, 0.36, pz);
          ped.castShadow = true;
          diningGroup.add(ped);
        });
      } else {
        [
          [-0.45, -0.78],
          [0.45, -0.78],
          [-0.45, 0.78],
          [0.45, 0.78],
        ].forEach(([tx, tz]) => {
          const tLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.02, 0.72, 10),
            tableBaseMat
          );
          tLeg.position.set(tx, 0.36, tz);
          tLeg.castShadow = true;
          diningGroup.add(tLeg);
        });
      }

      // 4 Dining Chairs
      const chairOffsets: [number, number, number][] = [
        [-0.72, -0.45, Math.PI / 2],
        [-0.72, 0.45, Math.PI / 2],
        [0.72, -0.45, -Math.PI / 2],
        [0.72, 0.45, -Math.PI / 2],
      ];
      chairOffsets.forEach(([cx, cz, rotY]) => {
        const chair = new THREE.Group();
        chair.position.set(cx, 0, cz);
        chair.rotation.y = rotY;
        const cSeat = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.045, 0.42),
          tableBaseMat
        );
        cSeat.position.y = 0.45;
        cSeat.castShadow = true;
        const cBack = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.38, 0.04),
          tableTopMat
        );
        cBack.position.set(0, 0.65, -0.19);
        cBack.castShadow = true;
        chair.add(cSeat, cBack);
        [
          [-0.17, -0.17],
          [0.17, -0.17],
          [-0.17, 0.17],
          [0.17, 0.17],
        ].forEach(([lx, lz]) => {
          const cLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.012, 0.44, 8),
            tableTopMat
          );
          cLeg.position.set(lx, 0.22, lz);
          cLeg.castShadow = true;
          chair.add(cLeg);
        });
        chair.userData.zone = "furniture";
        diningGroup.add(chair);
      });
      clickableMeshes.push(diningGroup);

      // 8. OPEN-PLAN LIVING LOUNGE SOFA & COFFEE TABLE (Front-Left Zone)
      const loungeGroup = new THREE.Group();
      loungeGroup.position.set(-2.7, 0, 2.95);
      dynamicRoot.add(loungeGroup);

      // Woven Area Rug (Y = 0.025 above floor)
      const rug = new THREE.Mesh(
        new THREE.BoxGeometry(3.1, 0.012, 2.2),
        new THREE.MeshStandardMaterial({
          color: "#E4DED2",
          roughness: 0.94,
        })
      );
      rug.position.set(0.15, 0.025, 0.0);
      rug.receiveShadow = true;
      loungeGroup.add(rug);

      const sofaFabricMat = new THREE.MeshPhysicalMaterial({
        color: p.sofaOption.primaryHex,
        roughness: p.sofaOption.styleVariant === "b" ? 0.38 : 0.88,
        sheen: p.sofaOption.styleVariant === "b" ? 0.1 : 0.65,
        sheenRoughness: 0.6,
        sheenColor: new THREE.Color("#FFFFFF"),
      });
      const sofaBaseMat = new THREE.MeshStandardMaterial({
        color: p.sofaOption.accentHex,
        roughness: 0.45,
        metalness: p.sofaOption.styleVariant === "c" ? 0.75 : 0.05,
      });

      // Sofa Main Seat + Chaise L-Return
      const sofaPlinth = new THREE.Mesh(
        new THREE.BoxGeometry(2.45, 0.14, 0.92),
        sofaBaseMat
      );
      sofaPlinth.position.set(0.1, 0.1, 0.55);
      sofaPlinth.castShadow = true;
      const sofaSeat = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.26, 0.88),
        sofaFabricMat
      );
      sofaSeat.position.set(0.1, 0.29, 0.55);
      sofaSeat.castShadow = true;
      sofaSeat.receiveShadow = true;

      const sofaBack = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.44, 0.22),
        sofaFabricMat
      );
      sofaBack.position.set(0.1, 0.58, 0.88);
      sofaBack.castShadow = true;

      const chaise = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.26, 0.85),
        sofaFabricMat
      );
      chaise.position.set(-0.66, 0.29, -0.28);
      chaise.castShadow = true;
      const armR = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.42, 0.88),
        sofaFabricMat
      );
      armR.position.set(1.22, 0.44, 0.55);
      armR.castShadow = true;

      // Coffee Table
      const coffeeTable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.48, 0.34, 24),
        tableTopMat
      );
      coffeeTable.position.set(0.45, 0.19, -0.35);
      coffeeTable.castShadow = true;
      coffeeTable.receiveShadow = true;

      [sofaPlinth, sofaSeat, sofaBack, chaise, armR, coffeeTable].forEach((m) => {
        m.userData.zone = "furniture";
        loungeGroup.add(m);
      });
      clickableMeshes.push(loungeGroup);
    };

    rebuildDynamicScene();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Coalesced On-Demand Render Loop
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let prevTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        renderDirty = false;
        const dt = Math.min(0.08, Math.max(0.001, (now - prevTime) / 1000));
        prevTime = now;

        const targetDoor = propsRef.current.doorsOpen ? 1 : 0;
        const targetExplode = propsRef.current.explodedView;

        let needsMoreFrames = false;

        if (Math.abs(currentDoorOpen - targetDoor) > 0.005) {
          currentDoorOpen = THREE.MathUtils.damp(
            currentDoorOpen,
            targetDoor,
            7,
            dt
          );
          needsMoreFrames = true;
        } else {
          currentDoorOpen = targetDoor;
        }

        if (Math.abs(currentExplode - targetExplode) > 0.005) {
          currentExplode = THREE.MathUtils.damp(
            currentExplode,
            targetExplode,
            7,
            dt
          );
          needsMoreFrames = true;
        } else {
          currentExplode = targetExplode;
        }

        // Apply door swings
        const openAngle = currentDoorOpen * (Math.PI * 0.42);
        animatedDoors.forEach((d) => {
          d.pivot.rotation.y = d.sign * openAngle;
        });

        // Apply exploded view offsets
        if (upperGroupRef) {
          upperGroupRef.position.y = currentExplode * 0.42;
          upperGroupRef.position.z = currentExplode * 0.22;
        }
        countertopRefs.forEach((ct) => {
          ct.position.y = 0.885 + currentExplode * 0.28;
        });
        if (islandGroupRef) {
          islandGroupRef.position.z = currentExplode * 0.45;
        }

        // Camera Preset Smooth Glide
        if (camTransitionActive) {
          const distPos = camera.position.distanceTo(camTargetPos);
          const distTgt = controls.target.distanceTo(camTargetLook);
          if (distPos > 0.015 || distTgt > 0.015) {
            const alpha = 1 - Math.exp(-6.5 * dt);
            camera.position.lerp(camTargetPos, alpha);
            controls.target.lerp(camTargetLook, alpha);
            needsMoreFrames = true;
          } else {
            camera.position.copy(camTargetPos);
            controls.target.copy(camTargetLook);
            camTransitionActive = false;
          }
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty || needsMoreFrames) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    const triggerCameraPreset = (preset: CameraPreset) => {
      const cfg = CAMERA_TARGETS[preset];
      camTargetPos.set(...cfg.pos);
      camTargetLook.set(...cfg.target);
      camTransitionActive = true;
      requestRender();
    };

    const raycaster = new THREE.Raycaster();
    const pointerDownPos = new THREE.Vector2();
    const ndc = new THREE.Vector2();

    const raycastDropZone = (
      clientX: number,
      clientY: number
    ): "upper" | "lower" | "island" | "countertop" | "backsplash" | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, true);
      if (hits.length > 0) {
        let cur: THREE.Object3D | null = hits[0].object;
        while (cur) {
          const z = cur.userData?.zone;
          if (
            z === "upper" ||
            z === "lower" ||
            z === "island" ||
            z === "countertop" ||
            z === "backsplash"
          ) {
            return z;
          }
          cur = cur.parent;
        }
      }
      return null;
    };

    sceneApiRef.current = {
      rebuildDynamicScene: () => {
        rebuildDynamicScene();
        compassMesh.visible = propsRef.current.showVastuCompass;
        requestRender();
      },
      triggerCameraPreset,
      requestRender,
      raycastDropZone,
    };

    // Cancel automatic camera glide if user grabs controls
    const onControlStart = () => {
      camTransitionActive = false;
    };
    const onControlChange = () => {
      requestRender();
    };
    controls.addEventListener("start", onControlStart);
    controls.addEventListener("change", onControlChange);

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos.set(e.clientX, e.clientY);
    };
    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (dist > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, true);
      if (hits.length > 0) {
        let cur: THREE.Object3D | null = hits[0].object;
        while (cur) {
          const z = cur.userData?.zone;
          if (z === "upper" || z === "lower" || z === "island" || z === "furniture") {
            propsRef.current.onSelectZone?.(z);
            break;
          }
          cur = cur.parent;
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // WebGL Context Loss Guard
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      requestRender();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

    // Resize Observer
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        requestRender();
      }
    });
    ro.observe(container);

    // Initial render
    _vec3.set(0, 0, 0);
    requestRender();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      controls.removeEventListener("start", onControlStart);
      controls.removeEventListener("change", onControlChange);
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        onContextRestored
      );
      disposeGroup(scene);
      envTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Rebuild dynamic meshes when finishes/layout/furniture change
  useEffect(() => {
    sceneApiRef.current?.rebuildDynamicScene();
  }, [
    layout,
    doorStyle,
    upperFinish,
    lowerFinish,
    islandFinish,
    countertopFinish,
    backsplashFinish,
    hardwareFinish,
    diningOption,
    stoolOption,
    sofaOption,
    lightingOption,
    showVastuCompass,
  ]);

  // Trigger smooth camera preset glides
  useEffect(() => {
    sceneApiRef.current?.triggerCameraPreset(cameraPreset);
  }, [cameraPreset]);

  // Trigger smooth door / exploded animations
  useEffect(() => {
    sceneApiRef.current?.requestRender();
  }, [doorsOpen, explodedView]);

  useEffect(() => {
    if (!draggedSwatchLabel) {
      setHoverDropZone(null);
    }
  }, [draggedSwatchLabel]);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const onSparkHover = (e: Event) => {
      if (!propsRef.current.draggedSwatchLabel) return;
      const { clientX, clientY } = (
        e as CustomEvent<{ clientX: number; clientY: number }>
      ).detail;
      const hit = sceneApiRef.current?.raycastDropZone(clientX, clientY);
      setHoverDropZone(hit ?? "lower");
    };

    const onSparkDrop = (e: Event) => {
      if (!propsRef.current.draggedSwatchLabel) return;
      const { clientX, clientY } = (
        e as CustomEvent<{ clientX: number; clientY: number }>
      ).detail;
      const hit = sceneApiRef.current?.raycastDropZone(clientX, clientY);
      propsRef.current.onDropAtZone?.(hit ?? "lower");
      setHoverDropZone(null);
    };

    el.addEventListener("sparkhover", onSparkHover);
    el.addEventListener("sparkdrop", onSparkDrop);
    return () => {
      el.removeEventListener("sparkhover", onSparkHover);
      el.removeEventListener("sparkdrop", onSparkDrop);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedSwatchLabel) return;
    e.preventDefault();
    const hit = sceneApiRef.current?.raycastDropZone(e.clientX, e.clientY);
    setHoverDropZone(hit ?? "lower");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedSwatchLabel) return;
    const hit = sceneApiRef.current?.raycastDropZone(e.clientX, e.clientY);
    onDropAtZone?.(hit ?? "lower");
    setHoverDropZone(null);
  };

  return (
    <div
      ref={outerRef}
      data-3d-stage="interior"
      className="relative w-full h-full bg-[#EFECE5] overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={() => setHoverDropZone(null)}
      onDrop={handleDrop}
    >
      <div ref={mountRef} className="w-full h-full touch-none" />
      {draggedSwatchLabel && (
        <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-[#B45309]/70 flex items-start justify-center pt-16 sm:pt-5">
          <div className="bg-[#141517] text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-md">
            Drop &ldquo;{draggedSwatchLabel}&rdquo; onto{" "}
            {hoverDropZone === "upper"
              ? "Upper Cabinets"
              : hoverDropZone === "island"
              ? "Kitchen Island"
              : hoverDropZone === "countertop"
              ? "Countertop Stone"
              : hoverDropZone === "backsplash"
              ? "Backsplash Tile"
              : "Lower Cabinets"}
          </div>
        </div>
      )}
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#EFECE5] text-[#141517] p-6 text-center">
          <div>
            <p className="font-display text-xl font-semibold">
              3D Viewport Paused
            </p>
            <p className="text-sm text-[#57534E] mt-1">
              Graphics context is restoring. Please wait or switch tabs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
