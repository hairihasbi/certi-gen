"use client";

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Text, Image as KonvaImage, Transformer, Rect, Circle, Star, RegularPolygon, Arrow } from "react-konva";
import useImage from "use-image";
import { ArrowLeft, ArrowRight, Move, Type, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageElement, QRElement, Element } from "./CanvasElements";

interface EditProcessStepProps {
  template: string | null;
  elements: any[];
  setElements: (elements: any[]) => void;
  data: any[];
  onNext: () => void;
  onBack: () => void;
}

const EditProcessStep: React.FC<EditProcessStepProps> = ({ template, elements, setElements, data, onNext, onBack }) => {
  const [bgImage] = useImage(template || "");
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bgImage) {
      const ratio = bgImage.width / bgImage.height;
      const maxWidth = containerRef.current?.offsetWidth || 800;
      const width = Math.min(bgImage.width, maxWidth);
      const height = width / ratio;
      
      setTimeout(() => {
        setStageSize(prev => {
          if (prev.width === width && prev.height === height) return prev;
          return { width, height };
        });
      }, 0);
    }
  }, [bgImage]);

  useEffect(() => {
    if (selectedId && trRef.current) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  const handleDragEnd = (id: string, e: any) => {
    setElements(elements.map(el => el.id === id ? { ...el, x: e.target.x(), y: e.target.y() } : el));
  };

  const handleTransformEnd = (id: string, e: any) => {
    const node = e.target;
    setElements(elements.map(el => el.id === id ? {
      ...el,
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation()
    } : el));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Data
        </button>
        <button 
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-all"
        >
          Next: Generate
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Move className="w-4 h-4 text-stone-400" />
              Position Elements
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Drag and drop text elements to position them correctly on your template. Use the handles to resize or rotate.
            </p>
            
            <div className="space-y-2">
              {elements.filter(el => el.type === 'text').map(el => (
                <button
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    selectedId === el.id 
                      ? "bg-stone-900 text-white border-stone-900 shadow-lg" 
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  )}
                >
                  <Type className="w-4 h-4 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate">{el.placeholderKey || el.text}</span>
                    <span className="text-[10px] opacity-60">Click to select on canvas</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
            <MousePointer2 className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-[10px] text-blue-700 leading-relaxed">
              <strong>Tip:</strong> You can also click directly on the text elements in the preview to select and move them.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col items-center">
          <div ref={containerRef} className="w-full bg-stone-100 rounded-2xl border-2 border-dashed border-stone-200 p-8 flex items-center justify-center min-h-[600px]">
            {bgImage ? (
              <div className="shadow-2xl bg-white rounded-lg overflow-hidden">
                <Stage
                  width={stageSize.width}
                  height={stageSize.height}
                  ref={stageRef}
                  onMouseDown={(e) => {
                    if (e.target === e.target.getStage()) {
                      setSelectedId(null);
                    }
                  }}
                >
                  <Layer>
                    <KonvaImage 
                      image={bgImage} 
                      width={stageSize.width} 
                      height={stageSize.height}
                      listening={false}
                    />
                    {elements.map(el => {
                      const isSelected = selectedId === el.id;
                      const commonProps = {
                        id: el.id,
                        x: el.x,
                        y: el.y,
                        rotation: el.rotation,
                        scaleX: el.scaleX,
                        scaleY: el.scaleY,
                        opacity: el.opacity,
                        draggable: true,
                        onClick: () => setSelectedId(el.id),
                        onDragEnd: (e: any) => handleDragEnd(el.id, e),
                        onTransformEnd: (e: any) => handleTransformEnd(el.id, e),
                      };

                      if (el.type === 'text') {
                        return (
                          <Text
                            key={el.id}
                            {...commonProps}
                            text={data.length > 0 ? (data[0][el.placeholderKey || ""] || el.text) : el.text}
                            fontSize={el.fontSize}
                            fontFamily={el.fontFamily}
                            fill={el.fill}
                            fontWeight={el.fontWeight}
                            fontStyle={el.fontStyle}
                            align={el.align}
                          />
                        );
                      }
                      if (el.type === "rect") {
                        return (
                          <Rect
                            key={el.id}
                            {...commonProps}
                            width={el.width}
                            height={el.height}
                            fill={el.fill}
                            stroke={el.stroke}
                            strokeWidth={el.strokeWidth}
                            cornerRadius={el.cornerRadius}
                          />
                        );
                      }
                      if (el.type === "circle") {
                        return (
                          <Circle
                            key={el.id}
                            {...commonProps}
                            radius={el.radius || 50}
                            fill={el.fill}
                            stroke={el.stroke}
                            strokeWidth={el.strokeWidth}
                          />
                        );
                      }
                      if (el.type === "star") {
                        return (
                          <Star
                            key={el.id}
                            {...commonProps}
                            innerRadius={el.innerRadius || 20}
                            outerRadius={el.outerRadius || 40}
                            numPoints={el.numPoints || 5}
                            fill={el.fill}
                            stroke={el.stroke}
                            strokeWidth={el.strokeWidth}
                          />
                        );
                      }
                      if (el.type === "poly") {
                        return (
                          <RegularPolygon
                            key={el.id}
                            {...commonProps}
                            sides={el.numPoints || 6}
                            radius={el.radius || 50}
                            fill={el.fill}
                            stroke={el.stroke}
                            strokeWidth={el.strokeWidth}
                          />
                        );
                      }
                      if (el.type === "image") {
                        return <ImageElement key={el.id} el={el} commonProps={commonProps} />;
                      }
                      if (el.type === "arrow") {
                        return (
                          <Arrow
                            key={el.id}
                            {...commonProps}
                            points={[0, 0, el.width || 100, 0]}
                            fill={el.fill || el.stroke}
                            stroke={el.stroke}
                            strokeWidth={el.strokeWidth}
                          />
                        );
                      }
                      if (el.type === "qr") {
                        return <QRElement key={el.id} el={el} commonProps={commonProps} />;
                      }
                      return null;
                    })}
                    {selectedId && (
                      <Transformer
                        ref={trRef}
                        rotateEnabled={true}
                        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                      />
                    )}
                  </Layer>
                </Stage>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Move className="w-12 h-12 text-stone-200 mx-auto" />
                <p className="text-stone-400 font-medium">No template selected</p>
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-stone-400 italic">
            Previewing with the first record from your data list.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditProcessStep;
