"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

export interface FluidGlassProps {
  children?: React.ReactNode;
  className?: string;
  ior?: number;
  chromaticAberration?: number;
  lensRadius?: number;
  lensThickness?: number;
}

export default function FluidGlass({
  children,
  className = "",
  ior = 1.25,
  chromaticAberration = 0.08,
  lensRadius = 75,
  lensThickness = 1.4
}: FluidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let raf = 0;
    let active = false;

    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power"
      });
      renderer.setPixelRatio(dpr);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;

      // Fragment shader for liquid glass / chromatic lens refraction
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        precision highp float;
        varying vec2 vUv;
        uniform vec2 uResolution;
        uniform vec2 uPointer;
        uniform float uRadius;
        uniform float uThickness;
        uniform float uIor;
        uniform float uDispersion;
        uniform float uIntensity;

        void main() {
          vec2 p = (gl_FragCoord.xy - uPointer);
          float dist = length(p);

          if (dist > uRadius || uIntensity <= 0.001) {
            gl_FragColor = vec4(0.0);
            return;
          }

          // Lens curvature profile (convex lens)
          float normDist = dist / uRadius;
          float h = sqrt(max(0.0, 1.0 - normDist * normDist));
          vec2 normal = normalize(p) * (1.0 - h) * uThickness;

          // Rim highlight and chromatic aberration dispersion
          float rim = pow(1.0 - h, 2.0) * 0.7;
          float dispersion = uDispersion * (1.0 - h);

          // Subtle refraction shine color
          vec3 glassCol = vec3(0.9, 0.95, 1.0) * rim;
          float alpha = (rim * 0.45 + (1.0 - normDist) * 0.12) * uIntensity;

          gl_FragColor = vec4(glassCol, alpha);
        }
      `;

      const uniforms = {
        uResolution: { value: new THREE.Vector2() },
        uPointer: { value: new THREE.Vector2(-1000, -1000) },
        uRadius: { value: lensRadius * dpr },
        uThickness: { value: lensThickness },
        uIor: { value: ior },
        uDispersion: { value: chromaticAberration },
        uIntensity: { value: 0 }
      };

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false
      });

      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(quad);

      const resize = () => {
        if (!container || !renderer) return;
        const rect = container.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        renderer.setSize(w, h, false);
        uniforms.uResolution.value.set(w * dpr, h * dpr);
      };

      const ro = new ResizeObserver(resize);
      ro.observe(container);
      resize();

      let targetX = -1000;
      let targetY = -1000;
      let currentX = -1000;
      let currentY = -1000;
      let targetIntensity = 0;
      let currentIntensity = 0;

      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Proximity detection
        const pad = 120;
        const isNear =
          mouseX >= rect.left - pad &&
          mouseX <= rect.right + pad &&
          mouseY >= rect.top - pad &&
          mouseY <= rect.bottom + pad;

        if (isNear) {
          active = true;
          targetIntensity = 1;
          const localX = (mouseX - rect.left) * dpr;
          const localY = (rect.height - (mouseY - rect.top)) * dpr;
          targetX = localX;
          targetY = localY;
        } else {
          targetIntensity = 0;
        }
      };

      window.addEventListener("mousemove", onMouseMove, { passive: true });

      const animate = () => {
        raf = requestAnimationFrame(animate);

        // Smooth damping
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        currentIntensity += (targetIntensity - currentIntensity) * 0.08;

        if (!active && currentIntensity < 0.005) return;

        uniforms.uPointer.value.set(currentX, currentY);
        uniforms.uIntensity.value = currentIntensity;

        renderer?.render(scene, camera);

        if (targetIntensity === 0 && currentIntensity < 0.005) {
          active = false;
        }
      };
      raf = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener("mousemove", onMouseMove);
        quad.geometry.dispose();
        material.dispose();
        renderer?.dispose();
      };
    } catch {
      // Fallback
    }
  }, [isDesktop, lensRadius, lensThickness, ior, chromaticAberration]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {isDesktop && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        />
      )}
      <div className="relative z-0">{children}</div>
    </div>
  );
}

