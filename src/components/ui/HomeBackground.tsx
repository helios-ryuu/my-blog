'use client';

import { useTheme } from 'next-themes';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import WebThreads from './WebThreads';
import { useEffect, useState, useRef } from 'react';

interface HomeBackgroundProps {
  className?: string;
}

export default function HomeBackground({ className = '' }: HomeBackgroundProps) {
  const { accentColor } = useSiteSettings();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: -1000, y: -1000, visible: false });
  const currPos = useRef({ x: -1000, y: -1000 });
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY, visible: true };
    };

    const handleMouseLeave = () => {
      targetRef.current.visible = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      if (!targetRef.current.visible) {
        if (spotlightRef.current && spotlightRef.current.style.opacity !== '0') {
          spotlightRef.current.style.opacity = '0';
        }
      } else {
        currPos.current.x = currPos.current.x < 0 ? targetRef.current.x : lerp(currPos.current.x, targetRef.current.x, 0.14);
        currPos.current.y = currPos.current.y < 0 ? targetRef.current.y : lerp(currPos.current.y, targetRef.current.y, 0.14);
        if (spotlightRef.current) {
          if (spotlightRef.current.style.opacity !== '1') {
            spotlightRef.current.style.opacity = '1';
          }
          spotlightRef.current.style.background = `radial-gradient(300px circle at ${currPos.current.x}px ${currPos.current.y}px, color-mix(in srgb, ${accentColor || '#1f51ff'} ${resolvedTheme === 'light' ? '6%' : '10%'}, transparent), transparent 70%)`;
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isMobile, accentColor, resolvedTheme]);

  const isLight = mounted && resolvedTheme === 'light';
  const effectiveAccent = accentColor || '#1f51ff';

  if (!mounted || isMobile) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
        style={{
          background: isLight
            ? `radial-gradient(ellipse at 50% 15%, color-mix(in srgb, ${effectiveAccent} 8%, transparent), transparent 70%), #fbfbfb`
            : `radial-gradient(ellipse at 50% 15%, color-mix(in srgb, ${effectiveAccent} 12%, transparent), transparent 70%), #0a0a0a`,
        }}
      />
    );
  }

  return (
    <div className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}>
      {/* WebGL Threads background with interactive cursor lighting */}
      <WebThreads
        color1={effectiveAccent}
        color2={effectiveAccent}
        color3="#ffffff"
        speed={0.17}
        threadCount={6}
        frequency={4.5}
        spread={0.16}
        taper={1.0}
        position={0.5}
        fanMode="center"
        glow={0.021}
        falloff={0.65}
        thickness={0.85}
        brightness={isLight ? 0.4 : 0.54}
        opacity={isLight ? 0.7 : 0.85}
        mirror={true}
        shimmer={false}
        grain={true}
        grainIntensity={0.04}
        mouseInteraction={true}
        mouseStrength={0.15}
        lightMode={isLight}
        backgroundColor={isLight ? '#fbfbfb' : '#0a0a0a'}
      />

      {/* Interactive Cursor Light Spotlight (Subtle & Compact) */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

