import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RotateCw } from "lucide-react";

type GLBRendererProps = {
  src: string;
  width: number;
  height: number;
  onLoad?: (canvas: HTMLCanvasElement) => void;
  isSelected?: boolean;
  interactionMode?: "konva" | "threejs";
  onModeToggle?: () => void;
};

export const GLBRenderer: React.FC<GLBRendererProps> = ({
  src,
  width,
  height,
  onLoad,
  isSelected = false,
  interactionMode = "konva",
  onModeToggle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationFrameRef = useRef<number | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = 0.8;
    controls.autoRotate = false;
    controls.enabled = false; // Start disabled (Konva mode)
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Load GLB
    const loader = new GLTFLoader();
    
    loader.load(
      src,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        // Center and scale the model
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

        // Setup animations if available
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
          });
          console.log(`Loaded model with ${gltf.animations.length} animations`);
        } else {
          console.log("Model loaded without animations");
        }

        setIsLoaded(true);
        
        // Render once to show the model
        renderer.render(scene, camera);
        
        // Notify parent that canvas is ready
        if (onLoad) {
          setTimeout(() => onLoad(canvas), 100);
        }
      },
      (progress) => {
        const percentComplete = (progress.loaded / progress.total) * 100;
        console.log(`Loading: ${percentComplete.toFixed(0)}%`);
      },
      (error) => {
        console.error("Error loading GLB:", error);
        setError("Failed to load 3D model");
        setIsLoaded(true);
      }
    );

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      controls.dispose();
      renderer.dispose();
      scene.clear();
      mixerRef.current = null;
      modelRef.current = null;
    };
  }, [src]);

  // Update size when width/height change
  useEffect(() => {
    if (rendererRef.current && cameraRef.current && isLoaded) {
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      if (sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, [width, height, isLoaded]);

  // Animation loop - runs continuously after model loads
  useEffect(() => {
    if (!isLoaded || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
      return;
    }

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const clock = clockRef.current;

    let needsRender = true;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Update animations if they exist
      if (mixerRef.current) {
        mixerRef.current.update(delta);
        needsRender = true;
      }

      // Update controls if enabled
      if (controls && controls.enabled) {
        const controlsUpdated = controls.update();
        if (controlsUpdated) needsRender = true;
      }

      // Always render (for both animated and static models)
      if (needsRender || mixerRef.current) {
        renderer.render(scene, camera);
        needsRender = false;
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isLoaded]);

  // Update controls based on interaction mode
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = interactionMode === "threejs";
    }
  }, [interactionMode]);

  const handleModeToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onModeToggle?.();
  }, [onModeToggle]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.05)",
          border: "2px dashed #ccc",
          borderRadius: "8px",
        }}
      >
        <span style={{ color: "#999", fontSize: "12px" }}>❌ {error}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ 
        width, 
        height, 
        position: "relative",
        pointerEvents: interactionMode === "threejs" ? "auto" : "none", // Always allow hover
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor: interactionMode === "threejs" ? "grab" : "default",
          pointerEvents: interactionMode === "threejs" ? "auto" : "none",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
      
      {/* Loading indicator */}
      {!isLoaded && !error && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(0, 102, 255, 0.2)",
              borderTop: "4px solid #0066ff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}
      
      {/* 360° Toggle Button - Always visible on hover or when active */}
      {isLoaded && (isHovered && interactionMode === "threejs" || interactionMode === "konva") && (
        <button
          onClick={handleModeToggle}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: interactionMode === "threejs" ? "#0066ff" : "rgba(0, 0, 0, 0.7)",
            border: "2px solid white",
            color: "white",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            pointerEvents: "auto",
          }}
          title={interactionMode === "threejs" ? "Lock rotation" : "Enable 360° rotation"}
        >
          360°
        </button>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};