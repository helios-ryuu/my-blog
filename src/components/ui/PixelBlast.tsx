"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type PixelBlastVariant = "square" | "circle" | "triangle" | "diamond";

type PixelBlastProps = {
    variant?: PixelBlastVariant;
    pixelSize?: number;
    color?: string;
    className?: string;
    style?: React.CSSProperties;
    antialias?: boolean;
    patternScale?: number;
    patternDensity?: number;
    pixelSizeJitter?: number;
    enableRipples?: boolean;
    rippleIntensityScale?: number;
    rippleThickness?: number;
    rippleSpeed?: number;
    autoPauseOffscreen?: boolean;
    speed?: number;
    transparent?: boolean;
    edgeFade?: number;
};

const SHAPE_MAP: Record<PixelBlastVariant, number> = {
    square: 0,
    circle: 1,
    triangle: 2,
    diamond: 3,
};

const MAX_CLICKS = 10;

const VERTEX_SRC = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SRC = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;
uniform int   uShapeType;

const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;
const int MAX_CLICKS = 10;

uniform vec2  uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

#define Bayer4(a) (Bayer2(0.5 * (a)) * 0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(0.5 * (a)) * 0.25 + Bayer2(a))

float hash11(float n) {
  return fract(sin(n) * 43758.5453);
}

float vnoise(vec3 p) {
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0, 0.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n100 = hash11(dot(ip + vec3(1.0, 0.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n010 = hash11(dot(ip + vec3(0.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n110 = hash11(dot(ip + vec3(1.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n001 = hash11(dot(ip + vec3(0.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0)));
  float n101 = hash11(dot(ip + vec3(1.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0)));
  float n011 = hash11(dot(ip + vec3(0.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0)));
  float n111 = hash11(dot(ip + vec3(1.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0)));
  vec3 w = fp * fp * fp * (fp * (fp * 6.0 - 15.0) + 10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0 = mix(x00, x10, w.y);
  float y1 = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t) {
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < 5; ++i) {
    sum += amp * vnoise(p * freq);
    freq *= 1.25;
    amp *= 1.0;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov) {
  float r = sqrt(cov) * 0.25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov) {
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d = p.y - r * (1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d / aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov) {
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main() {
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * 0.5;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);
  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;

  float feed = base + (uDensity - 0.5) * 0.3;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i) {
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      vec2 cuv = (((pos - uResolution * 0.5 - cellPixelSize * 0.5) / uResolution)) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float ring = exp(-pow((r - uRippleSpeed * t) / uRippleThickness, 2.0));
      float atten = exp(-1.0 * t) * exp(-10.0 * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);
  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float coverage = bw * (1.0 + (h - 0.5) * uPixelJitter);

  float mask;
  if (uShapeType == SHAPE_CIRCLE) {
    mask = maskCircle(pixelUV, coverage);
  } else if (uShapeType == SHAPE_TRIANGLE) {
    mask = maskTriangle(pixelUV, pixelId, coverage);
  } else if (uShapeType == SHAPE_DIAMOND) {
    mask = maskDiamond(pixelUV, coverage);
  } else {
    mask = coverage;
  }

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    mask *= smoothstep(0.0, uEdgeFade, edge);
  }

  vec3 srgbColor = mix(
    uColor * 12.92,
    1.055 * pow(uColor, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, uColor)
  );

  fragColor = vec4(srgbColor, mask);
}
`;

function randomOffset() {
    if (window.crypto?.getRandomValues) {
        const u32 = new Uint32Array(1);
        window.crypto.getRandomValues(u32);
        return u32[0] / 0xffffffff;
    }

    return Math.random();
}

export default function PixelBlast({
    variant = "square",
    pixelSize = 4,
    color = "#f56325",
    className = "",
    style,
    antialias = true,
    patternScale = 2,
    patternDensity = 1,
    pixelSizeJitter = 0,
    enableRipples = true,
    rippleIntensityScale = 1.4,
    rippleThickness = 0.12,
    rippleSpeed = 0.4,
    autoPauseOffscreen = true,
    speed = 0.5,
    transparent = true,
    edgeFade = 0.28,
}: PixelBlastProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const visibleRef = useRef(true);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const renderer = new THREE.WebGLRenderer({
            antialias,
            alpha: transparent,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        renderer.domElement.style.pointerEvents = "none";
        if (transparent) renderer.setClearAlpha(0);
        else renderer.setClearColor(0x000000, 1);
        container.appendChild(renderer.domElement);

        const uniforms = {
            uResolution: { value: new THREE.Vector2(1, 1) },
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(color) },
            uClickPos: {
                value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1)),
            },
            uClickTimes: { value: new Float32Array(MAX_CLICKS) },
            uShapeType: { value: SHAPE_MAP[variant] ?? 0 },
            uPixelSize: { value: pixelSize },
            uScale: { value: patternScale },
            uDensity: { value: patternDensity },
            uPixelJitter: { value: pixelSizeJitter },
            uEnableRipples: { value: enableRipples ? 1 : 0 },
            uRippleSpeed: { value: rippleSpeed },
            uRippleThickness: { value: rippleThickness },
            uRippleIntensity: { value: rippleIntensityScale },
            uEdgeFade: { value: edgeFade },
        };

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const material = new THREE.ShaderMaterial({
            vertexShader: VERTEX_SRC,
            fragmentShader: FRAGMENT_SRC,
            uniforms,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            glslVersion: THREE.GLSL3,
        });
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(quad);

        const bufferSize = new THREE.Vector2();
        const resize = () => {
            const width = Math.max(1, container.clientWidth);
            const height = Math.max(1, container.clientHeight);
            renderer.setSize(width, height, false);
            renderer.getDrawingBufferSize(bufferSize);
            uniforms.uResolution.value.copy(bufferSize);
            uniforms.uPixelSize.value = pixelSize * renderer.getPixelRatio();
        };
        resize();

        const observer = new ResizeObserver(resize);
        observer.observe(container);

        const intersectionObserver = new IntersectionObserver(([entry]) => {
            visibleRef.current = entry?.isIntersecting ?? true;
        });
        if (autoPauseOffscreen) intersectionObserver.observe(container);

        let clickIndex = 0;
        const addRipple = (clientX: number, clientY: number) => {
            const rect = renderer.domElement.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const scaleX = renderer.domElement.width / rect.width;
            const scaleY = renderer.domElement.height / rect.height;
            const x = (clientX - rect.left) * scaleX;
            const y = (rect.height - (clientY - rect.top)) * scaleY;
            uniforms.uClickPos.value[clickIndex].set(x, y);
            uniforms.uClickTimes.value[clickIndex] = uniforms.uTime.value;
            clickIndex = (clickIndex + 1) % MAX_CLICKS;
        };

        const handlePointerDown = (event: PointerEvent) => addRipple(event.clientX, event.clientY);
        const handleTouchStart = (event: TouchEvent) => {
            const touch = event.touches[0];
            if (touch) addRipple(touch.clientX, touch.clientY);
        };

        window.addEventListener("pointerdown", handlePointerDown, { passive: true });
        window.addEventListener("touchstart", handleTouchStart, { passive: true });

        const timer = new THREE.Timer();
        timer.connect(document);
        timer.setTimescale(speed);
        const timeOffset = randomOffset() * 1000;
        let raf = 0;
        const animate = (timestamp: number) => {
            timer.update(timestamp);
            if (!autoPauseOffscreen || visibleRef.current) {
                uniforms.uTime.value = timeOffset + timer.getElapsed();
                renderer.render(scene, camera);
            }
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("touchstart", handleTouchStart);
            observer.disconnect();
            intersectionObserver.disconnect();
            timer.dispose();
            quad.geometry.dispose();
            material.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [
        antialias,
        autoPauseOffscreen,
        color,
        edgeFade,
        enableRipples,
        patternDensity,
        patternScale,
        pixelSize,
        pixelSizeJitter,
        rippleIntensityScale,
        rippleSpeed,
        rippleThickness,
        speed,
        transparent,
        variant,
    ]);

    return (
        <div
            ref={containerRef}
            className={`relative h-full w-full overflow-hidden ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
}
