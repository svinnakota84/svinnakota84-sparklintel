import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  BuildingSector,
  CastingDropZone,
  CastingFacadeProfile,
  CastingGlazingStyle,
  CastingMaterialSpec,
  CastingMethodId,
} from "../types";
import { getMarbleTexture, getWoodTexture } from "../three/proceduralTextures";

interface Casting3DViewerProps {
  sector: BuildingSector;
  methodId: CastingMethodId;
  facadeProfile: CastingFacadeProfile;
  glazingStyle: CastingGlazingStyle;
  floors: number;
  bays: number;
  xrayMode: boolean;
  concreteFinish: CastingMaterialSpec;
  shellAccentFinish: CastingMaterialSpec;
  mullionFinish: CastingMaterialSpec;
  lobbyInteriorFinish: CastingMaterialSpec;
  draggedFinish: CastingMaterialSpec | null;
  onDropFinish: (zone: CastingDropZone, spec: CastingMaterialSpec) => void;
}

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

export const Casting3DViewer: React.FC<Casting3DViewerProps> = ({
  sector,
  methodId,
  facadeProfile,
  glazingStyle,
  floors,
  bays,
  xrayMode,
  concreteFinish,
  shellAccentFinish,
  mullionFinish,
  lobbyInteriorFinish,
  draggedFinish,
  onDropFinish,
}) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [hoverZone, setHoverZone] = useState<CastingDropZone | null>(null);

  const propsRef = useRef({
    sector,
    methodId,
    facadeProfile,
    glazingStyle,
    floors,
    bays,
    xrayMode,
    concreteFinish,
    shellAccentFinish,
    mullionFinish,
    lobbyInteriorFinish,
    draggedFinish,
    onDropFinish,
  });
  propsRef.current = {
    sector,
    methodId,
    facadeProfile,
    glazingStyle,
    floors,
    bays,
    xrayMode,
    concreteFinish,
    shellAccentFinish,
    mullionFinish,
    lobbyInteriorFinish,
    draggedFinish,
    onDropFinish,
  };

  const apiRef = useRef<{
    rebuild: () => void;
    raycastZone: (clientX: number, clientY: number) => CastingDropZone | null;
  } | null>(null);

  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ECE8DF");
    scene.fog = new THREE.FogExp2("#ECE8DF", 0.011);

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.2, 160);
    camera.position.set(17, 11.5, 19);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight("#F4F8FC", "#9A8D7B", 0.78);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight("#FFF4E2", 2.05);
    sun.position.set(18, 26, 16);
    sun.castShadow = !isSoftwareGl;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -16;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 65;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);

    const rim = new THREE.DirectionalLight("#D6E4F5", 0.7);
    rim.position.set(-14, 10, -14);
    scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 4.0, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 8;
    controls.maxDistance = 42;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minPolarAngle = 0.12;

    // Ground site plane
    const groundMat = new THREE.MeshStandardMaterial({
      color: "#D9D3C7",
      roughness: 0.92,
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const structRoot = new THREE.Group();
    scene.add(structRoot);

    let zoneMeshes: THREE.Object3D[] = [];

    const disposeGroup = (grp: THREE.Object3D) => {
      const mats = new Set<THREE.Material>();
      grp.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mm) => mats.add(mm));
          } else if (m.material) {
            mats.add(m.material);
          }
        }
      });
      mats.forEach((m) => m.dispose());
    };

    const makeMat = (spec: CastingMaterialSpec, fallbackSmooth: number) => {
      if (spec.isWood) {
        return new THREE.MeshStandardMaterial({
          map: getWoodTexture(
            spec.hex,
            spec.secondaryHex ?? "#5C5449",
            Boolean(spec.isFluted),
            maxAnisotropy
          ),
          roughness: spec.roughness,
          metalness: spec.metalness,
        });
      }
      if (spec.isStone) {
        return new THREE.MeshStandardMaterial({
          map: getMarbleTexture(
            spec.hex,
            spec.secondaryHex ?? "#8C877E",
            maxAnisotropy
          ),
          roughness: spec.roughness,
          metalness: spec.metalness,
        });
      }
      return new THREE.MeshStandardMaterial({
        color: spec.hex,
        roughness: spec.roughness ?? fallbackSmooth,
        metalness: spec.metalness,
      });
    };

    const rebuild = () => {
      disposeGroup(structRoot);
      structRoot.clear();
      zoneMeshes = [];

      const p = propsRef.current;
      const bayWidth = p.sector === "commercial" ? 3.4 : 2.95;
      const totalW = p.bays * bayWidth;
      const totalD = p.sector === "commercial" ? 9.4 : 7.6;
      const floorH = p.sector === "commercial" ? 3.35 : 2.95;
      const totalH = p.floors * floorH;

      const concreteMat = makeMat(p.concreteFinish, 0.72);
      const shellMat = makeMat(p.shellAccentFinish, 0.6);
      const mullionMat = makeMat(p.mullionFinish, 0.35);
      const interiorPrimaryMat = new THREE.MeshStandardMaterial({
        color: p.lobbyInteriorFinish.hex,
        roughness: p.lobbyInteriorFinish.roughness,
        metalness: p.lobbyInteriorFinish.metalness,
      });
      const interiorAccentMat = new THREE.MeshStandardMaterial({
        color: p.lobbyInteriorFinish.secondaryHex ?? "#8E7552",
        roughness: 0.45,
        metalness: 0.25,
      });
      const steelRebarMat = new THREE.MeshStandardMaterial({
        color: "#43484F",
        roughness: 0.4,
        metalness: 0.8,
      });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: p.glazingStyle === "arched-bronze" ? "#D9D6CE" : "#C5D8E3",
        roughness: 0.08,
        metalness: 0.08,
        transmission: isSoftwareGl ? 0 : 0.74,
        transparent: true,
        opacity: p.xrayMode ? 0.22 : isSoftwareGl ? 0.38 : 0.9,
        ior: 1.5,
      });

      // 1. Cast Raft Foundation & Podium Terrace
      const raft = new THREE.Mesh(
        new THREE.BoxGeometry(totalW + 2.4, 0.42, totalD + 2.4),
        concreteMat
      );
      raft.position.set(0, 0.21, 0);
      raft.castShadow = true;
      raft.receiveShadow = true;
      raft.userData.castZone = "concrete";
      structRoot.add(raft);
      zoneMeshes.push(raft);

      const terraceStep = new THREE.Mesh(
        new THREE.BoxGeometry(totalW + 3.4, 0.16, totalD + 3.4),
        shellMat
      );
      terraceStep.position.set(0, 0.08, 0);
      terraceStep.receiveShadow = true;
      terraceStep.userData.castZone = "shellAccent";
      structRoot.add(terraceStep);
      zoneMeshes.push(terraceStep);

      // 2. Structural Cast RCC Columns & Core Shaft
      const colZs = [-totalD / 2 + 0.35, 0, totalD / 2 - 0.35];
      const colSize = p.sector === "commercial" ? 0.42 : 0.34;

      for (let bi = 0; bi <= p.bays; bi++) {
        const cx = -totalW / 2 + bi * bayWidth;
        colZs.forEach((cz) => {
          const col = new THREE.Mesh(
            new THREE.BoxGeometry(colSize, totalH, colSize),
            concreteMat
          );
          col.position.set(cx, 0.42 + totalH / 2, cz);
          col.castShadow = true;
          col.receiveShadow = true;
          col.userData.castZone = "concrete";
          structRoot.add(col);
          zoneMeshes.push(col);

          if (p.xrayMode) {
            // Rebar vertical dowel projection at parapet
            const rebar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.04, 0.04, 0.65, 6),
              steelRebarMat
            );
            rebar.position.set(cx, 0.42 + totalH + 0.32, cz);
            structRoot.add(rebar);
          }
        });
      }

      // Shear / Lift Core for multi-story monolithic stability
      const coreW = Math.min(2.6, bayWidth * 0.85);
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(coreW, totalH + 0.7, 2.2),
        concreteMat
      );
      core.position.set(-totalW / 2 + bayWidth * 0.5, 0.42 + (totalH + 0.7) / 2, -totalD * 0.18);
      core.castShadow = true;
      core.receiveShadow = true;
      core.userData.castZone = "concrete";
      structRoot.add(core);
      zoneMeshes.push(core);

      // 3. Floor Plates, Waffle Coffer Ribs / PT Beams, Facade Casting & Glazing
      const isWaffle = p.methodId === "waffle-coffered";
      const isPrecast =
        p.methodId === "precast-panels" || p.methodId === "precast-frame";

      for (let fl = 0; fl <= p.floors; fl++) {
        const ySlab = 0.42 + fl * floorH;
        const isRoof = fl === p.floors;
        const cantileverOut =
          p.facadeProfile === "cantilever" && fl > 0
            ? fl % 2 === 1
              ? 1.1
              : 0.45
            : isRoof
            ? 0.65
            : 0.35;

        const slabW = totalW + 0.8 + cantileverOut * 0.4;
        const slabD = totalD + 0.6 + cantileverOut;

        if (fl > 0) {
          // Cast Slab Plate
          const slabThick =
            p.methodId === "post-tension-slab" ? 0.22 : isWaffle ? 0.18 : 0.28;
          const slab = new THREE.Mesh(
            new THREE.BoxGeometry(slabW, slabThick, slabD),
            isRoof && p.facadeProfile === "folded-shell" ? shellMat : concreteMat
          );
          slab.position.set(0, ySlab, cantileverOut * 0.35);
          slab.castShadow = true;
          slab.receiveShadow = true;
          slab.userData.castZone =
            isRoof && p.facadeProfile === "folded-shell"
              ? "shellAccent"
              : "concrete";
          structRoot.add(slab);
          zoneMeshes.push(slab);

          // Exposed Waffle Grid Ribs OR Edge Formwork Reveal
          if (isWaffle || p.xrayMode) {
            for (let rx = 0; rx <= p.bays * 2; rx++) {
              const ribX = -totalW / 2 + (rx * totalW) / (p.bays * 2);
              const rib = new THREE.Mesh(
                new THREE.BoxGeometry(0.14, 0.26, totalD),
                concreteMat
              );
              rib.position.set(ribX, ySlab - 0.18, 0);
              rib.userData.castZone = "concrete";
              structRoot.add(rib);
            }
          }

          // Folded-Plate Roof Canopy (when folded-shell is chosen and this is roof)
          if (isRoof && p.facadeProfile === "folded-shell") {
            for (let bi = 0; bi < p.bays; bi++) {
              const foldX = -totalW / 2 + bayWidth * (bi + 0.5);
              const leftFold = new THREE.Mesh(
                new THREE.BoxGeometry(bayWidth * 0.56, 0.16, slabD + 0.4),
                shellMat
              );
              leftFold.position.set(
                foldX - bayWidth * 0.24,
                ySlab + 0.48,
                cantileverOut * 0.35
              );
              leftFold.rotation.z = 0.32;
              leftFold.castShadow = true;
              leftFold.userData.castZone = "shellAccent";

              const rightFold = new THREE.Mesh(
                new THREE.BoxGeometry(bayWidth * 0.56, 0.16, slabD + 0.4),
                shellMat
              );
              rightFold.position.set(
                foldX + bayWidth * 0.24,
                ySlab + 0.48,
                cantileverOut * 0.35
              );
              rightFold.rotation.z = -0.32;
              rightFold.castShadow = true;
              rightFold.userData.castZone = "shellAccent";

              structRoot.add(leftFold, rightFold);
              zoneMeshes.push(leftFold, rightFold);
            }
          }
        }

        // Walls, Glazing & Sculptural Facades for each Story (0 .. floors-1)
        if (!isRoof) {
          const yCenter = ySlab + floorH / 2;
          const frontZ = totalD / 2 - 0.12;
          const backZ = -totalD / 2 + 0.12;

          // Back Structural Cast Wall (with precast seam grooves if precast)
          if (!p.xrayMode) {
            if (isPrecast) {
              for (let bi = 0; bi < p.bays; bi++) {
                const panel = new THREE.Mesh(
                  new THREE.BoxGeometry(bayWidth - 0.08, floorH - 0.18, 0.24),
                  concreteMat
                );
                panel.position.set(
                  -totalW / 2 + bayWidth * (bi + 0.5),
                  yCenter,
                  backZ
                );
                panel.castShadow = true;
                panel.receiveShadow = true;
                panel.userData.castZone = "concrete";
                structRoot.add(panel);
                zoneMeshes.push(panel);
              }
            } else {
              const backWall = new THREE.Mesh(
                new THREE.BoxGeometry(totalW - 0.1, floorH - 0.18, 0.24),
                concreteMat
              );
              backWall.position.set(0, yCenter, backZ);
              backWall.castShadow = true;
              backWall.receiveShadow = true;
              backWall.userData.castZone = "concrete";
              structRoot.add(backWall);
              zoneMeshes.push(backWall);
            }
          }

          // Side Structural Shear Piers
          if (!p.xrayMode) {
            [-totalW / 2 + 0.12, totalW / 2 - 0.12].forEach((sx) => {
              const sidePier = new THREE.Mesh(
                new THREE.BoxGeometry(0.24, floorH - 0.18, totalD * 0.52),
                concreteMat
              );
              sidePier.position.set(sx, yCenter, -totalD * 0.18);
              sidePier.castShadow = true;
              sidePier.userData.castZone = "concrete";
              structRoot.add(sidePier);
              zoneMeshes.push(sidePier);
            });
          }

          // Front Facade Bays: Slim Curtain Glazing + Sculptural Casting Elements
          for (let bi = 0; bi < p.bays; bi++) {
            const bx = -totalW / 2 + bayWidth * (bi + 0.5);

            // Slim Architectural Glazing Pane
            const glass = new THREE.Mesh(
              new THREE.BoxGeometry(bayWidth - 0.26, floorH - 0.34, 0.06),
              glassMat
            );
            glass.position.set(bx, yCenter, frontZ - 0.12);
            structRoot.add(glass);

            // Slim Mullion Frame (George Buildings style ultra-slim aluminum/steel glazing)
            const mulH = new THREE.Mesh(
              new THREE.BoxGeometry(bayWidth - 0.18, 0.07, 0.12),
              mullionMat
            );
            mulH.position.set(bx, ySlab + floorH - 0.2, frontZ - 0.1);
            mulH.userData.castZone = "mullions";
            structRoot.add(mulH);
            zoneMeshes.push(mulH);

            const mulMid = new THREE.Mesh(
              new THREE.BoxGeometry(0.055, floorH - 0.28, 0.12),
              mullionMat
            );
            mulMid.position.set(bx, yCenter, frontZ - 0.1);
            mulMid.userData.castZone = "mullions";
            structRoot.add(mulMid);
            zoneMeshes.push(mulMid);

            // Facade Profile Specific Casting
            if (p.facadeProfile === "arched-gfrc") {
              // Sculpted GFRC Arch Head & Side Spandrels
              const archTop = new THREE.Mesh(
                new THREE.TorusGeometry(
                  (bayWidth - 0.36) / 2,
                  0.14,
                  10,
                  20,
                  Math.PI
                ),
                shellMat
              );
              archTop.position.set(bx, ySlab + floorH - 1.15, frontZ + 0.08);
              archTop.castShadow = true;
              archTop.userData.castZone = "shellAccent";
              structRoot.add(archTop);
              zoneMeshes.push(archTop);

              // Arch side piers
              [-1, 1].forEach((side) => {
                const pier = new THREE.Mesh(
                  new THREE.BoxGeometry(0.24, floorH - 0.22, 0.28),
                  shellMat
                );
                pier.position.set(
                  bx + side * (bayWidth / 2 - 0.14),
                  yCenter,
                  frontZ + 0.06
                );
                pier.castShadow = true;
                pier.userData.castZone = "shellAccent";
                structRoot.add(pier);
                zoneMeshes.push(pier);
              });
            } else if (p.facadeProfile === "brise-soleil") {
              // Vertical Cast Solar Fins across bay
              const finCount = 4;
              for (let fi = 0; fi < finCount; fi++) {
                const fx =
                  bx -
                  bayWidth * 0.36 +
                  (fi * bayWidth * 0.72) / (finCount - 1);
                const fin = new THREE.Mesh(
                  new THREE.BoxGeometry(0.09, floorH - 0.22, 0.42),
                  shellMat
                );
                fin.position.set(fx, yCenter, frontZ + 0.14);
                fin.castShadow = true;
                fin.userData.castZone = "shellAccent";
                structRoot.add(fin);
                zoneMeshes.push(fin);
              }
            } else if (p.facadeProfile === "cantilever" && fl > 0) {
              // Architectural Balcony Guardrail + Cast Planter Ledge
              const guard = new THREE.Mesh(
                new THREE.BoxGeometry(bayWidth - 0.12, 0.82, 0.05),
                glassMat
              );
              guard.position.set(bx, ySlab + 0.52, frontZ + 0.55);
              structRoot.add(guard);

              const ledgeTrim = new THREE.Mesh(
                new THREE.BoxGeometry(bayWidth, 0.1, 0.18),
                shellMat
              );
              ledgeTrim.position.set(bx, ySlab + 0.08, frontZ + 0.56);
              ledgeTrim.userData.castZone = "shellAccent";
              structRoot.add(ledgeTrim);
              zoneMeshes.push(ledgeTrim);
            }
          }
        }
      }

      // 4. Ground Floor Sculptural Designer Furniture Staging (Sophia Key Aesthetic)
      // Curved Travertine Reception/Dining Island + Boucle Modular Sofa visible inside ground bay
      const lobbyGroup = new THREE.Group();
      lobbyGroup.position.set(0.5, 0.42, 0.5);
      structRoot.add(lobbyGroup);

      // Curved Sculptural Boucle Sofa
      const sofaCurve = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 0.38, 24, 1, false, 0, Math.PI),
        interiorPrimaryMat
      );
      sofaCurve.rotation.y = Math.PI / 2;
      sofaCurve.position.set(-1.3, 0.22, 0.35);
      sofaCurve.castShadow = true;
      sofaCurve.userData.castZone = "lobbyInterior";
      lobbyGroup.add(sofaCurve);
      zoneMeshes.push(sofaCurve);

      // Monolithic Travertine Pedestal Table
      const pedTableTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 0.08, 24),
        interiorPrimaryMat
      );
      pedTableTop.position.set(1.2, 0.72, 0.4);
      pedTableTop.castShadow = true;
      pedTableTop.userData.castZone = "lobbyInterior";
      const pedBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.38, 0.68, 16),
        interiorAccentMat
      );
      pedBase.position.set(1.2, 0.34, 0.4);
      pedBase.userData.castZone = "lobbyInterior";
      lobbyGroup.add(pedTableTop, pedBase);
      zoneMeshes.push(pedTableTop, pedBase);

      // Warm Interior Chandelier Glow
      const warmLight = new THREE.PointLight("#FFDFB0", 2.2, 12, 1.4);
      warmLight.position.set(0, floorH * 0.72, 0.5);
      lobbyGroup.add(warmLight);

      // Auto-recenter OrbitControls target vertically as building height changes
      controls.target.set(0, Math.max(2.2, totalH * 0.45), 0);
    };

    rebuild();

    let frameId = 0;
    let busy = false;
    let dirty = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (busy) {
        dirty = true;
        return;
      }
      busy = true;
      frameId = requestAnimationFrame(() => {
        dirty = false;
        controls.update();
        renderer.render(scene, camera);
        const done = () => {
          busy = false;
          if (dirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const raycastZone = (
      clientX: number,
      clientY: number
    ): CastingDropZone | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(zoneMeshes, true);
      if (hits.length > 0) {
        const z = hits[0].object.userData?.castZone;
        if (
          z === "concrete" ||
          z === "shellAccent" ||
          z === "mullions" ||
          z === "lobbyInterior"
        ) {
          return z;
        }
      }
      return null;
    };

    apiRef.current = {
      rebuild: () => {
        rebuild();
        requestRender();
      },
      raycastZone,
    };

    controls.addEventListener("change", requestRender);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      requestRender();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener(
      "webglcontextrestored",
      onContextRestored
    );

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (nw > 0 && nh > 0) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
        requestRender();
      }
    });
    ro.observe(container);

    requestRender();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      controls.removeEventListener("change", requestRender);
      controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        onContextRestored
      );
      disposeGroup(scene);
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    apiRef.current?.rebuild();
  }, [
    sector,
    methodId,
    facadeProfile,
    glazingStyle,
    floors,
    bays,
    xrayMode,
    concreteFinish,
    shellAccentFinish,
    mullionFinish,
    lobbyInteriorFinish,
  ]);

  useEffect(() => {
    if (!draggedFinish) {
      setHoverZone(null);
    }
  }, [draggedFinish]);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const onSparkHover = (e: Event) => {
      const df = propsRef.current.draggedFinish;
      if (!df) return;
      const { clientX, clientY } = (
        e as CustomEvent<{ clientX: number; clientY: number }>
      ).detail;
      const hitZone = apiRef.current?.raycastZone(clientX, clientY);
      setHoverZone(hitZone ?? df.zone);
    };

    const onSparkDrop = (e: Event) => {
      const df = propsRef.current.draggedFinish;
      if (!df) return;
      const { clientX, clientY } = (
        e as CustomEvent<{ clientX: number; clientY: number }>
      ).detail;
      const hitZone = apiRef.current?.raycastZone(clientX, clientY);
      propsRef.current.onDropFinish(hitZone ?? df.zone, df);
      setHoverZone(null);
    };

    el.addEventListener("sparkhover", onSparkHover);
    el.addEventListener("sparkdrop", onSparkDrop);
    return () => {
      el.removeEventListener("sparkhover", onSparkHover);
      el.removeEventListener("sparkdrop", onSparkDrop);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedFinish) return;
    e.preventDefault();
    const hitZone = apiRef.current?.raycastZone(e.clientX, e.clientY);
    setHoverZone(hitZone ?? draggedFinish.zone);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedFinish) return;
    const hitZone = apiRef.current?.raycastZone(e.clientX, e.clientY);
    onDropFinish(hitZone ?? draggedFinish.zone, draggedFinish);
    setHoverZone(null);
  };

  return (
    <div
      ref={outerRef}
      data-3d-stage="casting"
      className="relative w-full h-full bg-[#ECE8DF] overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={() => setHoverZone(null)}
      onDrop={handleDrop}
    >
      <div ref={mountRef} className="w-full h-full touch-none" />
      {webglUnavailable && (
        <div role="status" className="absolute inset-0 grid place-content-center px-6 text-center">
          <div className="max-w-sm rounded-xl border border-black/10 bg-white/95 p-5">
            <p className="font-semibold text-[#141517]">3D preview unavailable</p>
            <p className="mt-2 text-sm text-[#54575a]">
              This browser could not start WebGL. You can still browse plans and change design options.
            </p>
          </div>
        </div>
      )}

      {draggedFinish && (
        <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-[#B45309]/70 flex items-end justify-center p-4">
          <div className="bg-[#141517] text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-md">
            Drop &ldquo;{draggedFinish.name}&rdquo; onto{" "}
            {hoverZone === "concrete"
              ? "Primary Cast Structure"
              : hoverZone === "shellAccent"
              ? "Sculptural Shell & Arches"
              : hoverZone === "mullions"
              ? "Glazing Mullion Frame"
              : "Interior Furniture Staging"}
          </div>
        </div>
      )}

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#ECE8DF] text-[#141517] p-6 text-center">
          <p className="text-sm font-medium">
            3D Casting Viewport paused — restoring graphics context.
          </p>
        </div>
      )}
    </div>
  );
};
