import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let mixer: THREE.AnimationMixer | null = null;
const clock = new THREE.Clock();

type GLBRendererProps = {
  src: string;
  width: number;
  height: number;
  onLoad?: (canvas: HTMLCanvasElement) => void;
  isSelected?: boolean;
};

export const GLBRenderer: React.FC<GLBRendererProps> = ({
  src,
  width,
  height,
  onLoad,
  isSelected = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = 0.8;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 4;

    camera.position.z = 2.5;

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load GLB
    const loader = new GLTFLoader();
    let model: THREE.Object3D | null = null;
    let loadedMixer: THREE.AnimationMixer | null = null;

    loader.load(
      src,
      (gltf) => {
        model = gltf.scene;

        // Center & scale
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.multiplyScalar(scale);

        model.position.set(
          -center.x * scale,
          -center.y * scale,
          -center.z * scale
        );

        scene.add(model);

        // Enable animations
        if (gltf.animations && gltf.animations.length > 0) {
          loadedMixer = new THREE.AnimationMixer(model);
          mixer = loadedMixer;
          gltf.animations.forEach((clip) => {
            loadedMixer!.clipAction(clip).play();
          });
        }

        onLoad?.(canvas);
      },
      undefined,
      (error) => {
        console.error("Error loading GLB:", error);
        setError("Failed to load 3D model");
      }
    );

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (mixer) mixer.update(delta);
      if (controls) controls.update();

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
      scene.clear();
      mixer = null;
    };
  }, [src, width, height, onLoad]);

  // Disable/enable auto-rotate based on selection
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !isSelected;
    }
  }, [isSelected]);

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f0f0f0",
          border: "2px dashed #ccc",
          borderRadius: "8px",
        }}
      >
        <span style={{ color: "#999", fontSize: "12px" }}>❌ {error}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width, height, position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor: isSelected ? "grab" : "default",
        }}
      />
      {isSelected && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            fontSize: "11px",
            color: "#666",
            background: "rgba(255,255,255,0.8)",
            padding: "4px 8px",
            borderRadius: "4px",
            pointerEvents: "none",
          }}
        >
          🖱️ Drag to rotate • Scroll to zoom
        </div>
      )}
    </div>
  );
};