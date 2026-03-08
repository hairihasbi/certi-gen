"use client";

import React, { useRef, useEffect } from "react";
import Konva from "konva";
import { Image as KonvaImage, Group, Rect, Text } from "react-konva";
import useImage from "use-image";

export interface Element {
  id: string;
  type: "text" | "qr" | "image" | "rect" | "circle" | "star" | "arrow" | "poly";
  x: number;
  y: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  radius?: number;
  innerRadius?: number;
  outerRadius?: number;
  numPoints?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  fontWeight?: string;
  fontStyle?: string;
  align?: string;
  opacity?: number;
  brightness?: number;
  contrast?: number;
  blur?: number;
  grayscale?: number;
  sepia?: number;
  invert?: number;
  src?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  cornerRadius?: number;
  placeholderKey?: string;
}

export const ImageElement = ({ el, commonProps }: { el: Element; commonProps: any }) => {
  const [img] = useImage(el.src || "");
  const imageRef = useRef<any>(null);

  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.cache();
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [img, el.brightness, el.contrast, el.blur, el.grayscale, el.sepia, el.invert]);

  const filters = [];
  if (el.brightness !== undefined && el.brightness !== 0) filters.push(Konva.Filters.Brighten);
  if (el.contrast !== undefined && el.contrast !== 0) filters.push(Konva.Filters.Contrast);
  if (el.blur !== undefined && el.blur !== 0) filters.push(Konva.Filters.Blur);
  if (el.grayscale) filters.push(Konva.Filters.Grayscale);
  if (el.sepia) filters.push(Konva.Filters.Sepia);
  if (el.invert) filters.push(Konva.Filters.Invert);

  return (
    <KonvaImage
      {...commonProps}
      ref={imageRef}
      image={img}
      width={el.width || (img ? img.width : 100)}
      height={el.height || (img ? img.height : 100)}
      filters={filters}
      brightness={el.brightness || 0}
      contrast={el.contrast || 0}
      blurRadius={el.blur || 0}
    />
  );
};

export const QRElement = ({ el, commonProps }: { el: Element; commonProps: any }) => {
  const [img] = useImage(el.src || "");
  return (
    <Group {...commonProps}>
      {img ? (
        <KonvaImage
          image={img}
          width={el.width}
          height={el.height}
        />
      ) : (
        <>
          <Rect
            width={el.width}
            height={el.height}
            fill="#ffffff"
            stroke="#000000"
            strokeWidth={1}
          />
          <Rect width={el.width! * 0.2} height={el.height! * 0.2} x={el.width! * 0.1} y={el.height! * 0.1} fill="#000000" />
          <Rect width={el.width! * 0.2} height={el.height! * 0.2} x={el.width! * 0.7} y={el.height! * 0.1} fill="#000000" />
          <Rect width={el.width! * 0.2} height={el.height! * 0.2} x={el.width! * 0.1} y={el.height! * 0.7} fill="#000000" />
          <Text text="QR" fontSize={el.width! * 0.3} x={el.width! * 0.3} y={el.width! * 0.35} fill="#000000" fontFamily="monospace" fontStyle="bold" />
        </>
      )}
    </Group>
  );
};
