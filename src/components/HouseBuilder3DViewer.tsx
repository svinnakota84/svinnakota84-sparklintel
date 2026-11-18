import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  ConstructionPlan,
  ExteriorDropZone,
  ExteriorMaterialSpec,
} from "../types";
import { getMarbleTexture, getWoodTexture } from "../three/proceduralTextures";

interface HouseBuilder3DViewerProps {
  plan: ConstructionPlan;
  buildStage: number; // 1..5
  facadeFinish: ExteriorMaterialSpec;
  claddingFinish: ExteriorMaterialSpec;
  timberFinish: ExteriorMaterialSpec;
  roofTrimFinish: ExteriorMaterialSpec;
  draggedFinish: ExteriorMaterialSpec | null;
  onDropFinishOnHouse: (
    zone: ExteriorDropZone,
    spec: ExteriorMaterialSpec
  ) => void;
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

export const HouseBuilder3DViewer: React.FC<HouseBuilder3DViewerProps> = ({
  plan,
  buildStage,
  facadeFinish,
  claddingFinish,
  timberFinish,
  roofTrimFinish,
  draggedFinish,
  onDropFinishOnHouse,
}) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [hoverZone, setHoverZone] = useState<ExteriorDropZone | null>(null);

  const propsRef = useRef({
    plan,
    buildStage,
    facadeFinish,
    claddingFinish,
    timberFinish,
    roofTrimFinish,
    draggedFinish,
    onDropFinishOnHouse,
  });
  propsRef.current = {
    plan,
    buildStage,
    facadeFinish,
    claddingFinish,
    timberFinish,
    roofTrimFinish,
    draggedFinish,
    onDropFinishOnHouse,
  };

  const apiRef = useRef<{
    rebuild: () => void;
    raycastZone: (clientX: number, clientY: number) => ExteriorDropZone | null;
  } | null>(null);

  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#EAE6DD");
    scene.fog = new THREE.FogExp2("#EAE6DD", 0.018);

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.2, 120);
    camera.position.set(13.5, 8.8, 14.5);

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
    renderer.toneMappingExposure = 1.05;
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

    // Lighting
    const hemi = new THREE.HemisphereLight("#F2F7FC", "#9E8F78", 0.75);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight("#FFF3DF", 2.1);
    sun.position.set(14, 18, 12);
    sun.castShadow = !isSoftwareGl;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 45;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);

    const rim = new THREE.DirectionalLight("#D6E4F5", 0.65);
    rim.position.set(-12, 8, -10);
    scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2.2, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 7;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minPolarAngle = 0.15;

    // Ground Terrain & Site Plot
    const groundMat = new THREE.MeshStandardMaterial({
      color: "#D8D2C5",
      roughness: 0.92,
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const houseRoot = new THREE.Group();
    scene.add(houseRoot);

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

    const rebuild = () => {
      disposeGroup(houseRoot);
      houseRoot.clear();
      zoneMeshes = [];

      const {
        plan: p,
        buildStage: stage,
        facadeFinish: fac,
        claddingFinish: clad,
        timberFinish: tim,
        roofTrimFinish: trim,
      } = propsRef.current;

      const isCompact = p.areaSqFt < 1800;
      const isDuplex = p.areaSqFt > 2800;
      const footprintW = isCompact ? 6.4 : isDuplex ? 9.2 : 8.0;
      const footprintD = isCompact ? 7.2 : isDuplex ? 8.6 : 7.8;

      // Materials
      const concreteMat = new THREE.MeshStandardMaterial({
        color: "#A39F97",
        roughness: 0.88,
      });
      const steelBarMat = new THREE.MeshStandardMaterial({
        color: "#525860",
        roughness: 0.45,
        metalness: 0.72,
      });
      const facadeMat = new THREE.MeshStandardMaterial({
        color: fac.hex,
        roughness: fac.roughness,
        metalness: fac.metalness,
      });
      const claddingMat = new THREE.MeshStandardMaterial({
        map: getMarbleTexture(
          clad.hex,
          clad.secondaryHex ?? "#8E7E68",
          maxAnisotropy
        ),
        roughness: clad.roughness,
        metalness: clad.metalness,
      });
      const timberMat = new THREE.MeshStandardMaterial({
        map: getWoodTexture(
          tim.hex,
          tim.secondaryHex ?? "#402818",
          true,
          maxAnisotropy
        ),
        roughness: tim.roughness,
        metalness: tim.metalness,
      });
      const trimMat = new THREE.MeshStandardMaterial({
        color: trim.hex,
        roughness: trim.roughness,
        metalness: trim.metalness,
      });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: "#C8DCE6",
        roughness: 0.08,
        metalness: 0.1,
        transmission: isSoftwareGl ? 0 : 0.72,
        transparent: true,
        opacity: isSoftwareGl ? 0.42 : 0.92,
        ior: 1.5,
      });

      // STAGE 1: Foundation Pads & Stone Plinth
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(footprintW + 0.6, 0.48, footprintD + 0.6),
        stage >= 3 ? claddingMat : concreteMat
      );
      plinth.position.set(0, 0.24, 0);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      plinth.userData.extZone = "cladding";
      houseRoot.add(plinth);
      zoneMeshes.push(plinth);

      // Foundation isolated footings & tie beams visible in Stage 1-2
      const colCols = 4;
      const colRows = 4;
      const colXs: number[] = [];
      const colZs: number[] = [];
      for (let i = 0; i < colCols; i++) {
        colXs.push(
          -footprintW / 2 + 0.35 + (i * (footprintW - 0.7)) / (colCols - 1)
        );
      }
      for (let j = 0; j < colRows; j++) {
        colZs.push(
          -footprintD / 2 + 0.35 + (j * (footprintD - 0.7)) / (colRows - 1)
        );
      }

      if (stage <= 2) {
        colXs.forEach((cx) => {
          colZs.forEach((cz) => {
            const pad = new THREE.Mesh(
              new THREE.BoxGeometry(0.85, 0.12, 0.85),
              concreteMat
            );
            pad.position.set(cx, 0.52, cz);
            houseRoot.add(pad);
          });
        });
      }

      // STAGE 2: RCC Columns & Beams
      if (stage >= 2) {
        const gfHeight = 3.0;
        const ffHeight = isDuplex ? 3.0 : 2.75;
        const totalColH = stage >= 3 ? gfHeight + ffHeight : gfHeight + 0.6;

        colXs.forEach((cx) => {
          colZs.forEach((cz) => {
            const col = new THREE.Mesh(
              new THREE.BoxGeometry(0.28, totalColH, 0.28),
              stage >= 4 ? facadeMat : concreteMat
            );
            col.position.set(cx, 0.48 + totalColH / 2, cz);
            col.castShadow = true;
            col.userData.extZone = "facade";
            houseRoot.add(col);
            zoneMeshes.push(col);

            if (stage === 2) {
              // Starter rebar dowel bars
              const dowel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6),
                steelBarMat
              );
              dowel.position.set(cx, 0.48 + totalColH + 0.25, cz);
              houseRoot.add(dowel);
            }
          });
        });

        // Primary Beams at Ground Roof Level
        colZs.forEach((cz) => {
          const beam = new THREE.Mesh(
            new THREE.BoxGeometry(footprintW - 0.4, 0.32, 0.24),
            concreteMat
          );
          beam.position.set(0, 0.48 + gfHeight, cz);
          beam.castShadow = true;
          houseRoot.add(beam);
        });
      }

      // STAGE 3+: Masonry Volumes & Cantilevered Roof Slabs
      if (stage >= 3) {
        // Ground Floor Primary Mass + Stone Cladding Accent Wall
        const gfMass = new THREE.Mesh(
          new THREE.BoxGeometry(footprintW - 0.3, 2.85, footprintD - 0.3),
          facadeMat
        );
        gfMass.position.set(0, 0.48 + 1.425, 0);
        gfMass.castShadow = true;
        gfMass.receiveShadow = true;
        gfMass.userData.extZone = "facade";
        houseRoot.add(gfMass);
        zoneMeshes.push(gfMass);

        // Front Stone Feature Wall
        const stoneFeature = new THREE.Mesh(
          new THREE.BoxGeometry(footprintW * 0.44, 2.95, 0.28),
          claddingMat
        );
        stoneFeature.position.set(-footprintW * 0.26, 0.48 + 1.475, footprintD / 2 - 0.08);
        stoneFeature.castShadow = true;
        stoneFeature.userData.extZone = "cladding";
        houseRoot.add(stoneFeature);
        zoneMeshes.push(stoneFeature);

        // Mid-Level Cantilevered Floor Slab
        const midSlab = new THREE.Mesh(
          new THREE.BoxGeometry(footprintW + 1.0, 0.24, footprintD + 0.9),
          trimMat
        );
        midSlab.position.set(0.18, 0.48 + 2.95, 0.25);
        midSlab.castShadow = true;
        midSlab.receiveShadow = true;
        midSlab.userData.extZone = "roofTrim";
        houseRoot.add(midSlab);
        zoneMeshes.push(midSlab);

        // Upper Floor Offset Volume (L-shaped modern composition)
        const ufW = footprintW * 0.72;
        const ufD = footprintD * 0.68;
        const ufH = isDuplex ? 2.85 : 2.55;
        const ufMass = new THREE.Mesh(
          new THREE.BoxGeometry(ufW, ufH, ufD),
          facadeMat
        );
        ufMass.position.set(-footprintW * 0.12, 0.48 + 3.07 + ufH / 2, -footprintD * 0.14);
        ufMass.castShadow = true;
        ufMass.receiveShadow = true;
        ufMass.userData.extZone = "facade";
        houseRoot.add(ufMass);
        zoneMeshes.push(ufMass);

        // Cantilevered Roof Slab + Parapet Trim
        const roofSlab = new THREE.Mesh(
          new THREE.BoxGeometry(ufW + 1.3, 0.24, ufD + 1.1),
          trimMat
        );
        roofSlab.position.set(-footprintW * 0.06, 0.48 + 3.07 + ufH + 0.12, -footprintD * 0.08);
        roofSlab.castShadow = true;
        roofSlab.userData.extZone = "roofTrim";
        houseRoot.add(roofSlab);
        zoneMeshes.push(roofSlab);
      }

      // STAGE 4+: Architectural Glazing, Mullions & Timber Louvers
      if (stage >= 4) {
        // Large Ground Floor Living Glazing
        const gfWindow = new THREE.Mesh(
          new THREE.BoxGeometry(footprintW * 0.44, 2.35, 0.08),
          glassMat
        );
        gfWindow.position.set(footprintW * 0.22, 0.48 + 1.35, footprintD / 2 - 0.12);
        houseRoot.add(gfWindow);

        // Mullion frame around GF window
        const mullionTop = new THREE.Mesh(
          new THREE.BoxGeometry(footprintW * 0.46, 0.08, 0.14),
          trimMat
        );
        mullionTop.position.set(footprintW * 0.22, 0.48 + 2.54, footprintD / 2 - 0.12);
        mullionTop.userData.extZone = "roofTrim";
        houseRoot.add(mullionTop);
        zoneMeshes.push(mullionTop);

        // Vertical Mullion dividers
        [-0.55, 0.55].forEach((offset) => {
          const vMul = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 2.38, 0.12),
            trimMat
          );
          vMul.position.set(
            footprintW * 0.22 + offset,
            0.48 + 1.35,
            footprintD / 2 - 0.12
          );
          vMul.userData.extZone = "roofTrim";
          houseRoot.add(vMul);
          zoneMeshes.push(vMul);
        });

        // Timber Soffit Underside of Cantilevered Roof
        const ufW = footprintW * 0.72;
        const ufD = footprintD * 0.68;
        const ufH = isDuplex ? 2.85 : 2.55;
        const soffit = new THREE.Mesh(
          new THREE.BoxGeometry(ufW + 1.24, 0.05, ufD + 1.04),
          timberMat
        );
        soffit.position.set(-footprintW * 0.06, 0.48 + 3.07 + ufH - 0.01, -footprintD * 0.08);
        soffit.userData.extZone = "timber";
        houseRoot.add(soffit);
        zoneMeshes.push(soffit);

        // Vertical Architectural Timber Louvers on Upper Floor
        const louverCount = 9;
        for (let i = 0; i < louverCount; i++) {
          const lx = -footprintW * 0.45 + i * 0.28;
          const louver = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, ufH - 0.1, 0.22),
            timberMat
          );
          louver.position.set(
            lx,
            0.48 + 3.07 + ufH / 2,
            -footprintD * 0.14 + ufD / 2 + 0.06
          );
          louver.castShadow = true;
          louver.userData.extZone = "timber";
          houseRoot.add(louver);
          zoneMeshes.push(louver);
        }

        // Upper Floor Corner Glass + Balcony Rail
        const ufGlass = new THREE.Mesh(
          new THREE.BoxGeometry(ufW * 0.42, ufH - 0.35, 0.08),
          glassMat
        );
        ufGlass.position.set(
          footprintW * 0.06,
          0.48 + 3.07 + (ufH - 0.2) / 2,
          -footprintD * 0.14 + ufD / 2 + 0.02
        );
        houseRoot.add(ufGlass);

        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(footprintW * 0.42, 0.85, 0.04),
          glassMat
        );
        rail.position.set(footprintW * 0.25, 0.48 + 3.5, footprintD / 2 + 0.48);
        houseRoot.add(rail);
      }

      // STAGE 5: Complete Exterior, Courtyard Water Feature, Steps & Warm Lighting
      if (stage >= 5) {
        // Stepped Entrance Walk
        for (let s = 0; s < 3; s++) {
          const step = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 0.12, 0.42),
            claddingMat
          );
          step.position.set(0.2, 0.06 + s * 0.12, footprintD / 2 + 1.15 - s * 0.38);
          step.receiveShadow = true;
          step.userData.extZone = "cladding";
          houseRoot.add(step);
          zoneMeshes.push(step);
        }

        // Ishanya (North-East) Courtyard Water Feature
        const poolRim = new THREE.Mesh(
          new THREE.BoxGeometry(2.6, 0.18, 2.2),
          claddingMat
        );
        poolRim.position.set(footprintW / 2 - 0.6, 0.09, footprintD / 2 + 1.5);
        poolRim.receiveShadow = true;
        const water = new THREE.Mesh(
          new THREE.BoxGeometry(2.35, 0.19, 1.95),
          new THREE.MeshPhysicalMaterial({
            color: "#3F7D85",
            roughness: 0.08,
            metalness: 0.1,
            clearcoat: 1.0,
          })
        );
        water.position.set(footprintW / 2 - 0.6, 0.095, footprintD / 2 + 1.5);
        houseRoot.add(poolRim, water);

        // Landscape Greenery Planter Box
        const planter = new THREE.Mesh(
          new THREE.BoxGeometry(2.8, 0.38, 0.9),
          claddingMat
        );
        planter.position.set(-footprintW * 0.25, 0.19, footprintD / 2 + 0.95);
        planter.castShadow = true;
        houseRoot.add(planter);

        const bushMat = new THREE.MeshStandardMaterial({
          color: "#526B48",
          roughness: 0.85,
        });
        [-0.8, 0, 0.8].forEach((bx) => {
          const shrub = new THREE.Mesh(
            new THREE.SphereGeometry(0.36, 12, 10),
            bushMat
          );
          shrub.position.set(
            -footprintW * 0.25 + bx,
            0.52,
            footprintD / 2 + 0.95
          );
          shrub.castShadow = true;
          houseRoot.add(shrub);
        });

        // Warm Interior Living Glow
        const warmGlow = new THREE.PointLight("#FFCF8B", 2.4, 9, 1.4);
        warmGlow.position.set(0.5, 2.2, 0.8);
        houseRoot.add(warmGlow);
      }
    };

    rebuild();

    // Render on demand
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
    ): ExteriorDropZone | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(zoneMeshes, true);
      if (hits.length > 0) {
        const z = hits[0].object.userData?.extZone;
        if (
          z === "facade" ||
          z === "cladding" ||
          z === "timber" ||
          z === "roofTrim"
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
    plan,
    buildStage,
    facadeFinish,
    claddingFinish,
    timberFinish,
    roofTrimFinish,
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
      propsRef.current.onDropFinishOnHouse(hitZone ?? df.zone, df);
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
    onDropFinishOnHouse(hitZone ?? draggedFinish.zone, draggedFinish);
    setHoverZone(null);
  };

  return (
    <div
      ref={outerRef}
      data-3d-stage="exterior"
      className="relative w-full h-full bg-[#EAE6DD] overflow-hidden"
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
            {hoverZone === "facade"
              ? "Facade Walls"
              : hoverZone === "cladding"
              ? "Stone Plinth & Cladding"
              : hoverZone === "timber"
              ? "Timber Louvers"
              : "Roof & Window Trim"}
          </div>
        </div>
      )}

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#EAE6DD] text-[#141517] p-6 text-center">
          <p className="text-sm font-medium">
            3D House Viewport paused — restoring graphics context.
          </p>
        </div>
      )}
    </div>
  );
};
