"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";

const MAX_OVERFLOW = 50;

export interface ElasticSliderProps {
  defaultValue?: number;
  value?: number;
  startingValue?: number;
  maxValue?: number;
  className?: string;
  isStepped?: boolean;
  stepSize?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange?: (val: number) => void;
  unit?: string;
}

const ElasticSlider: React.FC<ElasticSliderProps> = ({
  defaultValue = 50,
  value,
  startingValue = 0,
  maxValue = 100,
  className = "",
  isStepped = false,
  stepSize = 1,
  leftIcon = <>-</>,
  rightIcon = <>+</>,
  onChange,
  unit = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 w-full ${className}`}>
      <Slider
        defaultValue={defaultValue}
        value={value}
        startingValue={startingValue}
        maxValue={maxValue}
        isStepped={isStepped}
        stepSize={stepSize}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        onChange={onChange}
        unit={unit}
      />
    </div>
  );
};

interface SliderProps {
  defaultValue: number;
  value?: number;
  startingValue: number;
  maxValue: number;
  isStepped: boolean;
  stepSize: number;
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  onChange?: (val: number) => void;
  unit: string;
}

const Slider: React.FC<SliderProps> = ({
  defaultValue,
  value: controlledValue,
  startingValue,
  maxValue,
  isStepped,
  stepSize,
  leftIcon,
  rightIcon,
  onChange,
  unit
}) => {
  const [internalValue, setInternalValue] = useState<number>(controlledValue ?? defaultValue);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [region, setRegion] = useState<"left" | "middle" | "right">("middle");
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    } else {
      setInternalValue(defaultValue);
    }
  }, [controlledValue, defaultValue]);

  useMotionValueEvent(clientX, "change", (latest: number) => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect();
      let newValue: number;
      if (latest < left) {
        setRegion("left");
        newValue = left - latest;
      } else if (latest > right) {
        setRegion("right");
        newValue = latest - right;
      } else {
        setRegion("middle");
        newValue = 0;
      }
      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect();
      let newValue = startingValue + ((e.clientX - left) / width) * (maxValue - startingValue);
      if (isStepped) {
        newValue = Math.round(newValue / stepSize) * stepSize;
      }
      newValue = Math.min(Math.max(newValue, startingValue), maxValue);
      setInternalValue(newValue);
      onChange?.(newValue);
      clientX.jump(e.clientX);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerMove(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    animate(overflow, 0, { type: "spring", bounce: 0.5 });
  };

  const getRangePercentage = (): number => {
    const totalRange = maxValue - startingValue;
    if (totalRange === 0) return 0;
    return ((currentValue - startingValue) / totalRange) * 100;
  };

  return (
    <div className="relative flex w-full flex-col items-center">
      <motion.div
        onHoverStart={() => animate(scale, 1.08)}
        onHoverEnd={() => animate(scale, 1)}
        onTouchStart={() => animate(scale, 1.08)}
        onTouchEnd={() => animate(scale, 1)}
        style={{
          scale,
          opacity: useTransform(scale, [1, 1.08], [0.85, 1])
        }}
        className="flex w-full touch-none select-none items-center justify-center gap-2.5"
      >
        <motion.div
          animate={{
            scale: region === "left" ? [1, 1.3, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === "left" ? -overflow.get() / scale.get() : 0))
          }}
          className="text-foreground/60 text-xs shrink-0 cursor-pointer select-none"
          onClick={() => {
            const next = Math.max(startingValue, currentValue - (isStepped ? stepSize : 1));
            setInternalValue(next);
            onChange?.(next);
          }}
        >
          {leftIcon}
        </motion.div>

        <div
          ref={sliderRef}
          className="relative flex w-full flex-grow cursor-grab active:cursor-grabbing touch-none select-none items-center py-2.5"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onLostPointerCapture={handlePointerUp}
        >
          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (sliderRef.current) {
                  const { width } = sliderRef.current.getBoundingClientRect();
                  return 1 + overflow.get() / width;
                }
                return 1;
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
              transformOrigin: useTransform(() => {
                if (sliderRef.current) {
                  const { left, width } = sliderRef.current.getBoundingClientRect();
                  return clientX.get() < left + width / 2 ? "right" : "left";
                }
                return "center";
              }),
              height: useTransform(scale, [1, 1.08], [5, 8]),
              marginTop: useTransform(scale, [1, 1.08], [0, -1.5]),
              marginBottom: useTransform(scale, [1, 1.08], [0, -1.5])
            }}
            className="flex flex-grow"
          >
            <div className="relative h-full flex-grow overflow-hidden rounded-full bg-foreground/15">
              <div
                className="absolute h-full bg-accent rounded-full transition-[width] duration-75"
                style={{ width: `${getRangePercentage()}%` }}
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          animate={{
            scale: region === "right" ? [1, 1.3, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === "right" ? overflow.get() / scale.get() : 0))
          }}
          className="text-foreground/60 text-xs shrink-0 cursor-pointer select-none"
          onClick={() => {
            const next = Math.min(maxValue, currentValue + (isStepped ? stepSize : 1));
            setInternalValue(next);
            onChange?.(next);
          }}
        >
          {rightIcon}
        </motion.div>
      </motion.div>

      <span className="text-[11px] font-mono font-medium text-foreground/75 tracking-wider">
        {Math.round(currentValue)}{unit}
      </span>
    </div>
  );
};

function decay(value: number, max: number): number {
  if (max === 0) return 0;
  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}

export default ElasticSlider;

