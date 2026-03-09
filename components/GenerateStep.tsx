"use client";

import React, { useState, useRef } from "react";
import { Stage, Layer, Text, Image as KonvaImage, Rect, Circle, Star, RegularPolygon, Arrow, Group } from "react-konva";
import useImage from "use-image";
import { ArrowLeft, Download, Play, Loader2, Settings2, Hash, FileCheck, CheckCircle2, Printer, Eye } from "lucide-react";
import JSZip from "jszip";
import { cn } from "@/lib/utils";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { ImageElement, QRElement, Element } from "./CanvasElements";

interface GenerateStepProps {
  template: string | null;
  elements: any[];
  data: any[];
  onBack: () => void;
}

import { useAuth } from "@/lib/auth";
import { generateCertificateHash, formatCertificateDataForHashing } from "@/lib/security";

const GenerateStep: React.FC<GenerateStepProps> = ({ template, elements, data, onBack }) => {
  const { user, addLog } = useAuth();
  const { saveCertificate } = useRealtimeData();
  const [bgImage] = useImage(template || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  // Numbering settings
  const [numberingType, setNumberingType] = useState<"auto" | "manual">("auto");
  const [prefix, setPrefix] = useState("CERT/");
  const [suffix, setSuffix] = useState("/2024");
  const [startNumber, setStartNumber] = useState(1);
  const [padding, setPadding] = useState(3);

  const stageRef = useRef<any>(null);
  const [currentElements, setCurrentElements] = useState(elements);

  const formatNumber = (num: number) => {
    const padded = num.toString().padStart(padding, '0');
    return `${prefix}${padded}${suffix}`;
  };

  const handleGenerate = async () => {
    if (data.length === 0) return;
    setIsGenerating(true);
    setGenerationProgress(0);
    setIsComplete(false);
    setGeneratedImages([]);
    
    const zip = new JSZip();
    const images: string[] = [];
    const originalElements = [...elements];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const certNumber = numberingType === "auto" ? formatNumber(startNumber + i) : (row["Certificate Number"] || formatNumber(startNumber + i));
      
      const updatedElements = originalElements.map(el => {
        if (el.type === 'text') {
          let newText = el.text || "";
          
          // Replace {Certificate Number} if it exists in text
          newText = newText.replace(/{Certificate Number}/g, certNumber);
          
          // Replace all {COLUMN_NAME} with data from CSV
          Object.keys(row).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            newText = newText.replace(regex, row[key]);
          });

          // Legacy support for placeholderKey
          if (el.placeholderKey === "Certificate Number") {
            newText = certNumber;
          } else if (el.placeholderKey && row[el.placeholderKey]) {
            newText = row[el.placeholderKey];
          }

          return { ...el, text: newText };
        }
        return el;
      });
      
      setCurrentElements(updatedElements);
      
      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 150));
      
        if (stageRef.current) {
          const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
          images.push(uri);
          const base64Data = uri.replace(/^data:image\/(png|jpg);base64,/, "");
          zip.file(`certificate-${certNumber.replace(/[/\\?%*:|"<>]/g, '-')}.png`, base64Data, { base64: true });
          
          // Generate Digital Hash
          const hashInput = formatCertificateDataForHashing(row, certNumber);
          const digitalHash = await generateCertificateHash(hashInput);

          // Save to Supabase (Real-time)
          await saveCertificate("default-template", row, certNumber, uri, digitalHash);
        }
      
      setGenerationProgress(Math.round(((i + 1) / data.length) * 100));
    }
    
    setGeneratedImages(images);
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `certificates-${Date.now()}.zip`;
    link.click();
    
    addLog("Generate Certificates", `Generated ${data.length} certificates for template ${template || 'unknown'}.`);
    
    setIsGenerating(false);
    setIsComplete(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Print Certificates</title>');
    printWindow.document.write('<style>body { margin: 0; padding: 0; } img { width: 100%; height: auto; page-break-after: always; }</style>');
    printWindow.document.write('</head><body>');
    generatedImages.forEach(img => {
      printWindow.document.write(`<img src="${img}" />`);
    });
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-stone-400" />
              Numbering Rules
            </h3>
            
            <div className="space-y-6">
              <div className="flex p-1 bg-stone-100 rounded-xl">
                <button 
                  onClick={() => setNumberingType("auto")}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    numberingType === "auto" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                  )}
                >
                  Automatic
                </button>
                <button 
                  onClick={() => setNumberingType("manual")}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    numberingType === "manual" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                  )}
                >
                  Manual (from CSV)
                </button>
              </div>

              {numberingType === "auto" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase">Prefix</label>
                      <input 
                        type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)}
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase">Suffix</label>
                      <input 
                        type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)}
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase">Start From</label>
                      <input 
                        type="number" value={startNumber} onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase">Padding (000)</label>
                      <input 
                        type="number" value={padding} onChange={(e) => setPadding(parseInt(e.target.value) || 1)}
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block mb-1">Preview Format</label>
                    <p className="text-sm font-mono font-bold text-stone-600">{formatNumber(startNumber)}</p>
                  </div>
                </div>
              )}

              {numberingType === "manual" && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 leading-relaxed">
                  Make sure your CSV has a column named <strong>&quot;Certificate Number&quot;</strong>. If not found, it will fallback to the automatic format above.
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-stone-900 rounded-2xl text-white shadow-xl shadow-stone-200">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
              <Play className="w-4 h-4 text-stone-400" />
              Final Step
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  <span>Progress</span>
                  <span>{generationProgress}%</span>
                </div>
                <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300" 
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || data.length === 0}
                className={cn(
                  "w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:bg-emerald-600 shadow-lg shadow-emerald-900/20",
                  (isGenerating || data.length === 0) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    <span>Generate & Download</span>
                  </>
                )}
              </button>
              
              {isComplete && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    All certificates generated!
                  </div>
                  <button 
                    onClick={handlePrint}
                    className="w-full py-3 bg-white text-stone-900 border-2 border-stone-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all"
                  >
                    <Printer className="w-5 h-5" />
                    Windows Print
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t border-stone-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Total Records:</span>
                  <span className="font-bold">{data.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Format:</span>
                  <span className="font-bold">PNG (ZIP)</span>
                </div>
              </div>
            </div>
          </div>

          {isComplete && generatedImages.length > 0 && (
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-200 animate-in fade-in slide-in-from-top-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-stone-400" />
                Generated Preview ({generatedImages.length})
              </h3>
              <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2">
                {generatedImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-lg border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-stone-400" />
              Final Preview
            </h3>
            <div className="bg-stone-100 rounded-xl p-4 flex items-center justify-center min-h-[400px]">
              {bgImage ? (
                <div className="shadow-lg bg-white scale-75 origin-center">
                  <Stage
                    width={800}
                    height={600}
                    ref={stageRef}
                  >
                    <Layer>
                      <KonvaImage 
                        image={bgImage} 
                        width={800} 
                        height={600}
                      />
                      {currentElements.map(el => {
                        const commonProps = {
                          id: el.id,
                          x: el.x,
                          y: el.y,
                          rotation: el.rotation,
                          scaleX: el.scaleX,
                          scaleY: el.scaleY,
                          opacity: el.opacity,
                          draggable: false,
                        };

                        if (el.type === "text") {
                          return (
                            <Text
                              key={el.id}
                              {...commonProps}
                              text={el.text}
                              fontSize={el.fontSize}
                              fontFamily={el.fontFamily}
                              fill={el.fill}
                              fontWeight={el.fontWeight}
                              fontStyle={el.fontStyle}
                              align={el.align}
                            />
                          );
                        }
                        if (el.type === "rect") return <Rect key={el.id} {...commonProps} width={el.width} height={el.height} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} cornerRadius={el.cornerRadius} />;
                        if (el.type === "circle") return <Circle key={el.id} {...commonProps} radius={el.radius || 50} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} />;
                        if (el.type === "star") return <Star key={el.id} {...commonProps} innerRadius={el.innerRadius || 20} outerRadius={el.outerRadius || 40} numPoints={el.numPoints || 5} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} />;
                        if (el.type === "poly") return <RegularPolygon key={el.id} {...commonProps} sides={el.numPoints || 6} radius={el.radius || 50} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} />;
                        if (el.type === "arrow") return <Arrow key={el.id} {...commonProps} points={[0, 0, el.width || 100, 0]} fill={el.fill || el.stroke} stroke={el.stroke} strokeWidth={el.strokeWidth} />;
                        if (el.type === "image") return <ImageElement key={el.id} el={el} commonProps={commonProps} />;
                        if (el.type === "qr") return <QRElement key={el.id} el={el} commonProps={commonProps} />;
                        return null;
                      })}
                    </Layer>
                  </Stage>
                </div>
              ) : (
                <p className="text-stone-400 text-xs">No template loaded</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateStep;
