'use client';

import { useTheme } from 'next-themes';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import PixelBlast from './PixelBlast';
import { useEffect, useState } from 'react';

interface PostBackgroundProps {
  className?: string;
}

export default function PostBackground({ className = '' }: PostBackgroundProps) {
  const { accentColor } = useSiteSettings();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isLight = mounted && resolvedTheme === 'light';
  const effectiveColor = accentColor || '#B497CF';

  if (!mounted) {
    return (
      <div
        className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
        style={{
          background: isLight
            ? `radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${effectiveColor} 6%, transparent), transparent 70%)`
            : `radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${effectiveColor} 9%, transparent), transparent 70%)`,
        }}
      />
    );
  }

  return (
    <div className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}>
      {/* Subtle ambient glow on mobile */}
      {isMobile && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: isLight
              ? `radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${effectiveColor} 5%, transparent), transparent 70%)`
              : `radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${effectiveColor} 7%, transparent), transparent 70%)`,
          }}
        />
      )}
      <PixelBlast
        variant="circle"
        pixelSize={isMobile ? 8 : 6}
        color={effectiveColor}
        patternScale={isMobile ? 2.5 : 3}
        patternDensity={isMobile ? 1.0 : 1.2}
        pixelSizeJitter={0.5}
        enableRipples={true}
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        liquid={true}
        liquidStrength={isMobile ? 0.08 : 0.12}
        liquidRadius={1.2}
        liquidWobbleSpeed={isMobile ? 3 : 5}
        speed={0.6}
        edgeFade={0.25}
        transparent={true}
        className={`w-full h-full transition-opacity duration-700 ${isLight ? (isMobile ? 'opacity-20' : 'opacity-25') : (isMobile ? 'opacity-25' : 'opacity-35')}`}
      />
    </div>
  );
}

