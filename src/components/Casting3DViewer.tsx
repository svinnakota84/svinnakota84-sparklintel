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
  CastStructureForm,
} from "../types";
import { getMarbleTexture, getWoodTexture } from "../three/proceduralTextures";

interface Casting3DViewerProps {
  structureForm: CastStructureForm;
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
  structureForm,
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
    structureForm,
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
    structureForm,
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

      // Branch geometry generation by structureForm so users can design Walls, Shells, Courtyards, Halls, Bridges & Buildings
      if (p.structureForm === "perimeter-walls") {
        // ARCHITECTURAL BOUNDARY & FEATURE WALLS + SCULPTURAL ENTRY GATEHOUSE
        const wallH = Math.min(5.2, 2.2 + p.floors * 0.55);
        const spanW = totalW + 3.2;
        const wingD = 6.2;

        // Continuous Strip Footing & Courtyard Reflection Plinth
        const plinth = new THREE.Mesh(
          new THREE.BoxGeometry(spanW + 1.4, 0.28, wingD + 2.4),
          shellMat
        );
        plinth.position.set(0, 0.14, 0);
        plinth.receiveShadow = true;
        plinth.userData.castZone = "shellAccent";
        structRoot.add(plinth);
        zoneMeshes.push(plinth);

        const stripFooting = new THREE.Mesh(
          new THREE.BoxGeometry(spanW + 0.6, 0.42, 0.9),
          concreteMat
        );
        stripFooting.position.set(0, 0.21, -wingD / 2 + 0.4);
        stripFooting.receiveShadow = true;
        stripFooting.userData.castZone = "concrete";
        structRoot.add(stripFooting);
        zoneMeshes.push(stripFooting);

        // Precast Segmented Main Compound Wall + Coping Capstones + Entry Portal
        const segCount = Math.max(4, p.bays + 2);
        const segW = spanW / segCount;
        const wallZ = -wingD / 2 + 0.4;

        for (let i = 0; i < segCount; i++) {
          const sx = -spanW / 2 + segW * (i + 0.5);
          const isPortal = i === Math.floor(segCount / 2);

          // Cast Pilaster Column at left edge of segment
          const pilaster = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, wallH + 0.22, 0.52),
            concreteMat
          );
          pilaster.position.set(sx - segW / 2, 0.28 + (wallH + 0.22) / 2, wallZ);
          pilaster.castShadow = true;
          pilaster.receiveShadow = true;
          pilaster.userData.castZone = "concrete";
          structRoot.add(pilaster);
          zoneMeshes.push(pilaster);

          if (p.xrayMode) {
            const rebar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6),
              steelRebarMat
            );
            rebar.position.set(sx - segW / 2, 0.28 + wallH + 0.5, wallZ);
            structRoot.add(rebar);
          }

          if (isPortal) {
            // Sculpted GFRC Arch or Cantilever Gate Canopy + Slim Vertical Slats
            const lintel = new THREE.Mesh(
              new THREE.BoxGeometry(segW + 0.3, 0.45, 1.35),
              shellMat
            );
            lintel.position.set(sx, 0.28 + wallH + 0.15, wallZ + 0.18);
            lintel.castShadow = true;
            lintel.userData.castZone = "shellAccent";
            structRoot.add(lintel);
            zoneMeshes.push(lintel);

            if (p.facadeProfile === "arched-gfrc") {
              const portalArch = new THREE.Mesh(
                new THREE.TorusGeometry(segW * 0.42, 0.14, 10, 20, Math.PI),
                shellMat
              );
              portalArch.position.set(sx, 0.28 + wallH * 0.68, wallZ + 0.22);
              portalArch.castShadow = true;
              portalArch.userData.castZone = "shellAccent";
              structRoot.add(portalArch);
              zoneMeshes.push(portalArch);
            } else if (p.facadeProfile === "folded-shell") {
              [-0.25, 0.25].forEach((s) => {
                const fold = new THREE.Mesh(
                  new THREE.BoxGeometry(segW * 0.6, 0.18, 1.4),
                  shellMat
                );
                fold.position.set(sx + s * segW, 0.28 + wallH + 0.38, wallZ + 0.18);
                fold.rotation.z = s < 0 ? 0.38 : -0.38;
                fold.castShadow = true;
                fold.userData.castZone = "shellAccent";
                structRoot.add(fold);
                zoneMeshes.push(fold);
              });
            }

            for (let si = -3; si <= 3; si++) {
              const slat = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, wallH * 0.88, 0.08),
                mullionMat
              );
              slat.position.set(sx + si * (segW * 0.11), 0.28 + wallH * 0.44, wallZ);
              slat.userData.castZone = "mullions";
              structRoot.add(slat);
              zoneMeshes.push(slat);
            }
          } else {
            // Cast Concrete Wall Panel styled by architectural facadeProfile
            if (!p.xrayMode) {
              if (p.facadeProfile === "folded-shell") {
                [-0.24, 0.24].forEach((offset) => {
                  const angled = new THREE.Mesh(
                    new THREE.BoxGeometry(segW * 0.56, wallH, 0.24),
                    offset < 0 ? concreteMat : shellMat
                  );
                  angled.position.set(
                    sx + offset * segW,
                    0.28 + wallH / 2,
                    wallZ + (offset < 0 ? 0.16 : -0.16)
                  );
                  angled.rotation.y = offset < 0 ? 0.32 : -0.32;
                  angled.castShadow = true;
                  angled.receiveShadow = true;
                  angled.userData.castZone = offset < 0 ? "concrete" : "shellAccent";
                  structRoot.add(angled);
                  zoneMeshes.push(angled);
                });
              } else {
                const wallPanel = new THREE.Mesh(
                  new THREE.BoxGeometry(segW - 0.14, wallH, 0.3),
                  i % 2 === 0 ? concreteMat : shellMat
                );
                wallPanel.position.set(sx, 0.28 + wallH / 2, wallZ);
                wallPanel.castShadow = true;
                wallPanel.receiveShadow = true;
                wallPanel.userData.castZone =
                  i % 2 === 0 ? "concrete" : "shellAccent";
                structRoot.add(wallPanel);
                zoneMeshes.push(wallPanel);
              }
            }

            if (p.facadeProfile === "arched-gfrc") {
              const bayArch = new THREE.Mesh(
                new THREE.TorusGeometry(segW * 0.34, 0.11, 8, 18, Math.PI),
                shellMat
              );
              bayArch.position.set(sx, 0.28 + wallH * 0.52, wallZ + 0.2);
              bayArch.castShadow = true;
              bayArch.userData.castZone = "shellAccent";
              structRoot.add(bayArch);
              zoneMeshes.push(bayArch);
            } else if (p.facadeProfile === "brise-soleil") {
              for (let fi = -2; fi <= 2; fi++) {
                const fin = new THREE.Mesh(
                  new THREE.BoxGeometry(0.08, wallH * 0.86, 0.44),
                  shellMat
                );
                fin.position.set(sx + fi * (segW * 0.16), 0.28 + wallH * 0.5, wallZ + 0.18);
                fin.castShadow = true;
                fin.userData.castZone = "shellAccent";
                structRoot.add(fin);
                zoneMeshes.push(fin);
              }
            } else if (p.facadeProfile === "cantilever") {
              const blade = new THREE.Mesh(
                new THREE.BoxGeometry(segW + 0.18, 0.16, 0.95),
                shellMat
              );
              blade.position.set(sx, 0.28 + wallH + 0.08, wallZ + 0.26);
              blade.castShadow = true;
              blade.userData.castZone = "shellAccent";
              structRoot.add(blade);
              zoneMeshes.push(blade);
            }

            const coping = new THREE.Mesh(
              new THREE.BoxGeometry(segW + 0.04, 0.12, 0.42),
              shellMat
            );
            coping.position.set(sx, 0.28 + wallH + 0.06, wallZ);
            coping.castShadow = true;
            coping.userData.castZone = "shellAccent";
            structRoot.add(coping);
            zoneMeshes.push(coping);

            // Slim Architectural Metal Screen Fin Insert
            const screenBar = new THREE.Mesh(
              new THREE.BoxGeometry(segW * 0.55, 0.08, 0.36),
              mullionMat
            );
            screenBar.position.set(sx, 0.28 + wallH * 0.72, wallZ);
            screenBar.userData.castZone = "mullions";
            structRoot.add(screenBar);
            zoneMeshes.push(screenBar);
          }
        }

        // Return End Pilaster + Perpendicular Flanking Return Walls
        const endPilaster = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, wallH + 0.22, 0.52),
          concreteMat
        );
        endPilaster.position.set(spanW / 2, 0.28 + (wallH + 0.22) / 2, wallZ);
        endPilaster.castShadow = true;
        endPilaster.userData.castZone = "concrete";
        structRoot.add(endPilaster);
        zoneMeshes.push(endPilaster);

        [-spanW / 2, spanW / 2].forEach((wx) => {
          const retWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, wallH * 0.78, wingD * 0.72),
            concreteMat
          );
          retWall.position.set(wx, 0.28 + (wallH * 0.78) / 2, wallZ + wingD * 0.36);
          retWall.castShadow = true;
          retWall.receiveShadow = true;
          retWall.userData.castZone = "concrete";
          structRoot.add(retWall);
          zoneMeshes.push(retWall);
        });

        // Courtyard Reflection Bench & Planter Staging inside Wall Enclosure
        const bench = new THREE.Mesh(
          new THREE.BoxGeometry(2.6, 0.46, 0.75),
          interiorPrimaryMat
        );
        bench.position.set(-1.6, 0.51, 0.8);
        bench.castShadow = true;
        bench.userData.castZone = "lobbyInterior";
        structRoot.add(bench);
        zoneMeshes.push(bench);

        const waterPool = new THREE.Mesh(
          new THREE.BoxGeometry(3.2, 0.08, 1.8),
          glassMat
        );
        waterPool.position.set(1.8, 0.3, 0.8);
        structRoot.add(waterPool);

        camera.position.set(12.2, 6.4, 14.2);
        controls.target.set(0, Math.max(1.8, wallH * 0.48), -0.4);
      } else if (p.structureForm === "curved-pavilion") {
        // CURVED SHELL & GFRC VAULTED PAVILION STRUCTURE
        const pavH = Math.min(5.4, 3.2 + p.floors * 0.55);
        const plinth = new THREE.Mesh(
          new THREE.BoxGeometry(totalW + 2.8, 0.44, totalD + 2.2),
          concreteMat
        );
        plinth.position.set(0, 0.22, 0);
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        plinth.userData.castZone = "concrete";
        structRoot.add(plinth);
        zoneMeshes.push(plinth);

        const stepDeck = new THREE.Mesh(
          new THREE.BoxGeometry(totalW + 3.8, 0.16, totalD + 3.0),
          shellMat
        );
        stepDeck.position.set(0, 0.08, 0);
        stepDeck.receiveShadow = true;
        stepDeck.userData.castZone = "shellAccent";
        structRoot.add(stepDeck);
        zoneMeshes.push(stepDeck);

        // Rhythmic Precast Colonade Piers + Curved Barrel Vault Concrete Roof Shells
        for (let bi = 0; bi <= p.bays; bi++) {
          const cx = -totalW / 2 + bi * bayWidth;
          [-totalD / 2 + 0.45, totalD / 2 - 0.45].forEach((cz) => {
            const pier = new THREE.Mesh(
              new THREE.CylinderGeometry(0.24, 0.3, pavH, 16),
              concreteMat
            );
            pier.position.set(cx, 0.44 + pavH / 2, cz);
            pier.castShadow = true;
            pier.receiveShadow = true;
            pier.userData.castZone = "concrete";
            structRoot.add(pier);
            zoneMeshes.push(pier);
          });

          if (bi < p.bays) {
            const bx = cx + bayWidth / 2;
            // Curved Thin-Shell Barrel Vault Roof Segment spanning across Z depth
            const radius = bayWidth * 0.56;
            const shellVault = new THREE.Mesh(
              new THREE.CylinderGeometry(
                radius,
                radius,
                totalD + 1.4,
                22,
                1,
                true,
                0,
                Math.PI
              ),
              shellMat
            );
            shellVault.material.side = THREE.DoubleSide;
            shellVault.rotation.x = Math.PI / 2;
            shellVault.rotation.z = Math.PI / 2;
            shellVault.position.set(bx, 0.44 + pavH - 0.1, 0);
            shellVault.castShadow = true;
            shellVault.receiveShadow = true;
            shellVault.userData.castZone = "shellAccent";
            structRoot.add(shellVault);
            zoneMeshes.push(shellVault);

            // Slim Full-Height Glass Curtain & Mullions inside Open Pavilion
            const glass = new THREE.Mesh(
              new THREE.BoxGeometry(bayWidth - 0.25, pavH - 0.2, 0.06),
              glassMat
            );
            glass.position.set(bx, 0.44 + (pavH - 0.2) / 2, -totalD / 2 + 0.8);
            structRoot.add(glass);

            const mulTop = new THREE.Mesh(
              new THREE.BoxGeometry(bayWidth - 0.1, 0.08, 0.14),
              mullionMat
            );
            mulTop.position.set(bx, 0.44 + pavH - 0.12, totalD / 2 - 0.45);
            mulTop.userData.castZone = "mullions";
            structRoot.add(mulTop);
            zoneMeshes.push(mulTop);
          }
        }

        // Rear Structural Precast Screen Wall
        if (!p.xrayMode) {
          const rearWall = new THREE.Mesh(
            new THREE.BoxGeometry(totalW - 0.1, pavH - 0.15, 0.26),
            concreteMat
          );
          rearWall.position.set(0, 0.44 + (pavH - 0.15) / 2, -totalD / 2 + 0.35);
          rearWall.castShadow = true;
          rearWall.userData.castZone = "concrete";
          structRoot.add(rearWall);
          zoneMeshes.push(rearWall);
        }

        camera.position.set(14.5, 7.8, 16.5);
        controls.target.set(0, pavH * 0.55, 0);
      } else if (p.structureForm === "courtyard-l-wing") {
        // L-SHAPE COURTYARD MULTI-STORY CAST WINGS + REFLECTION POOL
        const armW = totalW;
        const armD = 4.2;

        // Stepped Courtyard Plinth
        const plinth = new THREE.Mesh(
          new THREE.BoxGeometry(armW + 4.4, 0.36, armW + 1.4),
          concreteMat
        );
        plinth.position.set(0.6, 0.18, 0.4);
        plinth.receiveShadow = true;
        plinth.userData.castZone = "concrete";
        structRoot.add(plinth);
        zoneMeshes.push(plinth);

        // Courtyard Reflection Pool in Front-Right Quadrant
        const poolDeck = new THREE.Mesh(
          new THREE.BoxGeometry(armW * 0.58, 0.08, armW * 0.52),
          glassMat
        );
        poolDeck.position.set(1.5, 0.4, 1.5);
        structRoot.add(poolDeck);

        // Wing A (Back Horizontal Wing)
        for (let fl = 0; fl < p.floors; fl++) {
          const yBot = 0.36 + fl * floorH;
          if (!p.xrayMode) {
            const wallBack = new THREE.Mesh(
              new THREE.BoxGeometry(armW, floorH - 0.2, 0.24),
              concreteMat
            );
            wallBack.position.set(0, yBot + floorH / 2, -armW / 2 + 0.3);
            wallBack.castShadow = true;
            wallBack.userData.castZone = "concrete";
            structRoot.add(wallBack);
            zoneMeshes.push(wallBack);
          }
          const glassFront = new THREE.Mesh(
            new THREE.BoxGeometry(armW - 0.5, floorH - 0.3, 0.06),
            glassMat
          );
          glassFront.position.set(0, yBot + floorH / 2, -armW / 2 + armD - 0.2);
          structRoot.add(glassFront);

          const slabA = new THREE.Mesh(
            new THREE.BoxGeometry(armW + 0.8, 0.26, armD + 0.6),
            shellMat
          );
          slabA.position.set(0, yBot + floorH, -armW / 2 + armD / 2);
          slabA.castShadow = true;
          slabA.userData.castZone = "shellAccent";
          structRoot.add(slabA);
          zoneMeshes.push(slabA);

          // Wing B (Left Perpendicular Wing)
          if (!p.xrayMode) {
            const wallSide = new THREE.Mesh(
              new THREE.BoxGeometry(0.24, floorH - 0.2, armW * 0.68),
              concreteMat
            );
            wallSide.position.set(-armW / 2 + 0.2, yBot + floorH / 2, 0.9);
            wallSide.castShadow = true;
            wallSide.userData.castZone = "concrete";
            structRoot.add(wallSide);
            zoneMeshes.push(wallSide);
          }

          const glassInner = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, floorH - 0.3, armW * 0.62),
            glassMat
          );
          glassInner.position.set(-armW / 2 + armD - 0.4, yBot + floorH / 2, 0.9);
          structRoot.add(glassInner);

          const slabB = new THREE.Mesh(
            new THREE.BoxGeometry(armD, 0.26, armW * 0.72),
            shellMat
          );
          slabB.position.set(-armW / 2 + armD / 2, yBot + floorH, 0.9);
          slabB.castShadow = true;
          slabB.userData.castZone = "shellAccent";
          structRoot.add(slabB);
          zoneMeshes.push(slabB);

          // Slim Vertical Mullions
          for (let mi = 0; mi <= p.bays; mi++) {
            const mx = -armW / 2 + (mi * armW) / p.bays;
            const colA = new THREE.Mesh(
              new THREE.BoxGeometry(0.24, floorH, 0.24),
              mullionMat
            );
            colA.position.set(mx, yBot + floorH / 2, -armW / 2 + armD - 0.15);
            colA.userData.castZone = "mullions";
            structRoot.add(colA);
            zoneMeshes.push(colA);
          }
        }

        camera.position.set(15.5, 9.8, 17.5);
        controls.target.set(0, Math.max(2.0, totalH * 0.42), 0);
      } else if (p.structureForm === "waffle-atrium") {
        // WAFFLE-SLAB LONG-SPAN COLUMN-FREE EXHIBITION / LIVING HALL
        const hallH = 3.8 + p.floors * 0.75;
        const hallW = totalW + 2.2;
        const hallD = totalD + 1.8;

        const base = new THREE.Mesh(
          new THREE.BoxGeometry(hallW + 1.6, 0.4, hallD + 1.6),
          concreteMat
        );
        base.position.set(0, 0.2, 0);
        base.receiveShadow = true;
        base.userData.castZone = "concrete";
        structRoot.add(base);
        zoneMeshes.push(base);

        // Corner Monumental Piers (zero interior columns!)
        [
          [-hallW / 2 + 0.35, -hallD / 2 + 0.35],
          [hallW / 2 - 0.35, -hallD / 2 + 0.35],
          [-hallW / 2 + 0.35, hallD / 2 - 0.35],
          [hallW / 2 - 0.35, hallD / 2 - 0.35],
        ].forEach(([px, pz]) => {
          const cornerPier = new THREE.Mesh(
            new THREE.BoxGeometry(0.75, hallH, 0.75),
            concreteMat
          );
          cornerPier.position.set(px, 0.4 + hallH / 2, pz);
          cornerPier.castShadow = true;
          cornerPier.userData.castZone = "concrete";
          structRoot.add(cornerPier);
          zoneMeshes.push(cornerPier);
        });

        // Exposed Two-Way Waffle Concrete Ceiling Coffer Grid
        const topPlate = new THREE.Mesh(
          new THREE.BoxGeometry(hallW + 1.0, 0.24, hallD + 1.0),
          shellMat
        );
        topPlate.position.set(0, 0.4 + hallH + 0.12, 0);
        topPlate.castShadow = true;
        topPlate.userData.castZone = "shellAccent";
        structRoot.add(topPlate);
        zoneMeshes.push(topPlate);

        const ribsX = p.bays * 2 + 1;
        for (let rx = 0; rx <= ribsX; rx++) {
          const x = -hallW / 2 + (rx * hallW) / ribsX;
          const beamZ = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.48, hallD + 0.6),
            concreteMat
          );
          beamZ.position.set(x, 0.4 + hallH - 0.22, 0);
          beamZ.castShadow = true;
          beamZ.userData.castZone = "concrete";
          structRoot.add(beamZ);
          zoneMeshes.push(beamZ);
        }
        for (let rz = 0; rz <= 6; rz++) {
          const z = -hallD / 2 + (rz * hallD) / 6;
          const beamX = new THREE.Mesh(
            new THREE.BoxGeometry(hallW + 0.6, 0.48, 0.14),
            concreteMat
          );
          beamX.position.set(0, 0.4 + hallH - 0.22, z);
          beamX.castShadow = true;
          beamX.userData.castZone = "concrete";
          structRoot.add(beamX);
          zoneMeshes.push(beamX);
        }

        // Clerestory + Panoramic Curtain Glazing & Slim Mullions
        const frontGlass = new THREE.Mesh(
          new THREE.BoxGeometry(hallW - 0.9, hallH - 0.5, 0.06),
          glassMat
        );
        frontGlass.position.set(0, 0.4 + (hallH - 0.5) / 2, hallD / 2 - 0.35);
        structRoot.add(frontGlass);

        for (let mi = 1; mi < p.bays * 2; mi++) {
          const mx = -hallW / 2 + (mi * hallW) / (p.bays * 2);
          const mul = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, hallH - 0.45, 0.12),
            mullionMat
          );
          mul.position.set(mx, 0.4 + (hallH - 0.45) / 2, hallD / 2 - 0.35);
          mul.userData.castZone = "mullions";
          structRoot.add(mul);
          zoneMeshes.push(mul);
        }

        camera.position.set(15.5, 8.8, 17.5);
        controls.target.set(0, hallH * 0.52, 0);
      } else if (p.structureForm === "cantilever-bridge") {
        // CANTILEVER OVERHANG & ELEVATED SKY-BRIDGE ON TWIN SHEAR CORES
        const bridgeSpan = totalW + 3.6;
        const deckY = 3.4;
        const deckH = Math.max(2.9, floorH * Math.min(2, p.floors));

        const podium = new THREE.Mesh(
          new THREE.BoxGeometry(bridgeSpan + 1.4, 0.38, totalD + 1.4),
          concreteMat
        );
        podium.position.set(0, 0.19, 0);
        podium.receiveShadow = true;
        podium.userData.castZone = "concrete";
        structRoot.add(podium);
        zoneMeshes.push(podium);

        // Twin Monolithic Anchoring Concrete Cores
        [-totalW * 0.3, totalW * 0.3].forEach((coreX) => {
          const core = new THREE.Mesh(
            new THREE.BoxGeometry(2.1, deckY + deckH + 0.3, 3.8),
            concreteMat
          );
          core.position.set(coreX, 0.38 + (deckY + deckH + 0.3) / 2, -0.6);
          core.castShadow = true;
          core.receiveShadow = true;
          core.userData.castZone = "concrete";
          structRoot.add(core);
          zoneMeshes.push(core);
        });

        // Elevated Post-Tensioned Cantilevered Bridge Floor + Roof Slabs
        const lowerDeck = new THREE.Mesh(
          new THREE.BoxGeometry(bridgeSpan, 0.45, totalD * 0.72),
          shellMat
        );
        lowerDeck.position.set(0, 0.38 + deckY, 0.25);
        lowerDeck.castShadow = true;
        lowerDeck.receiveShadow = true;
        lowerDeck.userData.castZone = "shellAccent";
        structRoot.add(lowerDeck);
        zoneMeshes.push(lowerDeck);

        const roofDeck = new THREE.Mesh(
          new THREE.BoxGeometry(bridgeSpan + 0.4, 0.36, totalD * 0.76),
          shellMat
        );
        roofDeck.position.set(0, 0.38 + deckY + deckH, 0.25);
        roofDeck.castShadow = true;
        roofDeck.userData.castZone = "shellAccent";
        structRoot.add(roofDeck);
        zoneMeshes.push(roofDeck);

        // Tapered Post-Tensioned Side Cantilever Spine Girders
        [-totalD * 0.34, totalD * 0.34].forEach((gz) => {
          const girder = new THREE.Mesh(
            new THREE.BoxGeometry(bridgeSpan, 0.58, 0.24),
            concreteMat
          );
          girder.position.set(0, 0.38 + deckY - 0.1, 0.25 + gz);
          girder.castShadow = true;
          girder.userData.castZone = "concrete";
          structRoot.add(girder);
          zoneMeshes.push(girder);
        });

        // Bridge Panoramic Glazing + Mullion Grid
        const bridgeGlass = new THREE.Mesh(
          new THREE.BoxGeometry(bridgeSpan - 0.4, deckH - 0.45, 0.06),
          glassMat
        );
        bridgeGlass.position.set(0, 0.38 + deckY + deckH / 2, 0.25 + totalD * 0.34);
        structRoot.add(bridgeGlass);

        for (let bi = 0; bi <= p.bays + 1; bi++) {
          const mx = -bridgeSpan / 2 + 0.3 + (bi * (bridgeSpan - 0.6)) / (p.bays + 1);
          const mul = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, deckH - 0.3, 0.14),
            mullionMat
          );
          mul.position.set(mx, 0.38 + deckY + deckH / 2, 0.25 + totalD * 0.34);
          mul.userData.castZone = "mullions";
          structRoot.add(mul);
          zoneMeshes.push(mul);
        }

        camera.position.set(15.5, 8.8, 17.5);
        controls.target.set(0, deckY + deckH * 0.35, 0);
      } else {
        // DEFAULT: MULTI-STORY RESIDENTIAL / COMMERCIAL BUILDING FRAME
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
              const rebar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 0.65, 6),
                steelRebarMat
              );
              rebar.position.set(cx, 0.42 + totalH + 0.32, cz);
              structRoot.add(rebar);
            }
          });
        }

        const coreW = Math.min(2.6, bayWidth * 0.85);
        const core = new THREE.Mesh(
          new THREE.BoxGeometry(coreW, totalH + 0.7, 2.2),
          concreteMat
        );
        core.position.set(
          -totalW / 2 + bayWidth * 0.5,
          0.42 + (totalH + 0.7) / 2,
          -totalD * 0.18
        );
        core.castShadow = true;
        core.receiveShadow = true;
        core.userData.castZone = "concrete";
        structRoot.add(core);
        zoneMeshes.push(core);

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
            const slabThick =
              p.methodId === "post-tension-slab"
                ? 0.22
                : isWaffle
                ? 0.18
                : 0.28;
            const slab = new THREE.Mesh(
              new THREE.BoxGeometry(slabW, slabThick, slabD),
              isRoof && p.facadeProfile === "folded-shell"
                ? shellMat
                : concreteMat
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

          if (!isRoof) {
            const yCenter = ySlab + floorH / 2;
            const frontZ = totalD / 2 - 0.12;
            const backZ = -totalD / 2 + 0.12;

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

            for (let bi = 0; bi < p.bays; bi++) {
              const bx = -totalW / 2 + bayWidth * (bi + 0.5);

              const glass = new THREE.Mesh(
                new THREE.BoxGeometry(bayWidth - 0.26, floorH - 0.34, 0.06),
                glassMat
              );
              glass.position.set(bx, yCenter, frontZ - 0.12);
              structRoot.add(glass);

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

              if (p.facadeProfile === "arched-gfrc") {
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

        camera.position.set(16.2 + p.floors * 0.55, 9.2 + p.floors * 1.0, 17.8 + p.floors * 0.55);
        controls.target.set(0, Math.max(2.2, totalH * 0.45), 0);
      }

      // Ground Floor Sculptural Designer Furniture Staging (Sophia Key Aesthetic)
      const lobbyGroup = new THREE.Group();
      lobbyGroup.position.set(0.5, 0.42, 0.5);
      structRoot.add(lobbyGroup);

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

      const warmLight = new THREE.PointLight("#FFDFB0", 2.2, 12, 1.4);
      warmLight.position.set(0, floorH * 0.72, 0.5);
      lobbyGroup.add(warmLight);
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
    structureForm,
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
