'use client';

import React, { useState } from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: 'left' | 'right';
  delay?: number;
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 2.5,
  className = '',
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
  pauseOnHover = false,
  direction = 'left',
  delay = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Ensure visible contrast between base text color and shine highlight
  let baseColor = color;
  const isColorLightOrIdentical =
    !color ||
    color.toLowerCase() === shineColor.toLowerCase() ||
    color.toLowerCase() === '#ffffff' ||
    color.toLowerCase() === '#fff';

  if (isColorLightOrIdentical) {
    baseColor = 'rgba(255, 255, 255, 0.65)';
  }

  const animationDuration = `${speed}s`;
  const animationDelay = `${delay}s`;

  return (
    <>
      <style>{`
        @keyframes shiny-text-sweep-left {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @keyframes shiny-text-sweep-right {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      <span
        className={`inline-block font-medium ${className}`}
        style={{
          backgroundImage: `linear-gradient(${spread}deg, ${baseColor} 0%, ${baseColor} 30%, ${shineColor} 50%, ${baseColor} 70%, ${baseColor} 100%)`,
          backgroundSize: '250% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animationName: disabled
            ? 'none'
            : direction === 'right'
            ? 'shiny-text-sweep-right'
            : 'shiny-text-sweep-left',
          animationDuration,
          animationDelay,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationPlayState: pauseOnHover && isHovered ? 'paused' : 'running',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {text}
      </span>
    </>
  );
};

export default ShinyText;

