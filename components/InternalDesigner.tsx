"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Konva from "konva";
import { Stage, Layer, Text, Image as KonvaImage, Transformer, Rect, Circle, Star, Arrow, Line, Group, RegularPolygon } from "react-konva";
import useImage from "use-image";
import QRCode from "qrcode";
import Papa from "papaparse";
import JSZip from "jszip";
import { 
  Move, Trash2, Plus, Save, Image as ImageIcon, QrCode, Type as FontIcon, 
  Undo, Redo, Square, Circle as CircleIcon, Star as StarIcon, ArrowRight, 
  Layers, Download, Minus, Maximize, Palette, Ghost, AlignLeft, AlignCenter, AlignRight,
  Grid, MousePointer2, FileJson, Upload, Hexagon, Group as GroupIcon, Ungroup,
  Database, FileSpreadsheet, UserPlus, Play, Loader2, X, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageElement, QRElement, Element } from "./CanvasElements";

const InternalDesigner = ({ onSave }: { onSave?: (name: string, template: string, elements: Element[]) => void }) => {
  const [templateName, setTemplateName] = useState("My Template");
  const [elements, setElements] = useState<Element[]>([]);
  const [history, setHistory] = useState<Element[][]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bgImageSrc, setBgImageSrc] = useState<string | null>(null);
  const [bgImage] = useImage(bgImageSrc || "", "anonymous");
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState("");
  const [certificateData, setCertificateData] = useState<any[]>([]);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const gridGap = 20;

  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const selectionBoxRef = useRef<any>(null);

  const saveToHistory = React.useCallback((newElements: Element[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push([...newElements]);
      return newHistory;
    });
    setHistoryStep(prev => prev + 1);
  }, [historyStep]);

  const undo = React.useCallback(() => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setElements(history[prevStep]);
      setHistoryStep(prevStep);
    }
  }, [history, historyStep]);

  const redo = React.useCallback(() => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setElements(history[nextStep]);
      setHistoryStep(nextStep);
    }
  }, [history, historyStep]);

  const updateElements = React.useCallback((newElements: Element[] | ((prev: Element[]) => Element[])) => {
    setElements(prev => {
      const next = typeof newElements === 'function' ? newElements(prev) : newElements;
      saveToHistory(next);
      return next;
    });
  }, [saveToHistory]);

  const handleDelete = React.useCallback(() => {
    if (selectedIds.length > 0) {
      updateElements(prev => prev.filter((el) => !selectedIds.includes(el.id)));
      setSelectedIds([]);
    }
  }, [selectedIds, updateElements]);

  const [assets, setAssets] = useState<{ id: string; src: string; name: string }[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAssets, setShowAssets] = useState(false);

  const templates = [
    { id: 'workshop', name: 'Workshop Certificate', category: 'Workshop', url: 'https://picsum.photos/seed/workshop/800/600' },
    { id: 'seminar', name: 'Seminar Certificate', category: 'Seminar', url: 'https://picsum.photos/seed/seminar/800/600' },
    { id: 'competition', name: 'Competition Certificate', category: 'Lomba', url: 'https://picsum.photos/seed/competition/800/600' },
    { id: 'achievement', name: 'Achievement Certificate', category: 'Achievement', url: 'https://picsum.photos/seed/achievement/800/600' },
  ];

  const handleBulkAssetUpload = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const id = `asset-${Math.random().toString(36).substr(2, 9)}`;
          setAssets(prev => [...prev, {
            id,
            src: reader.result as string,
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  }, []);

  const addAssetToCanvas = React.useCallback((src: string) => {
    const id = `img-${Math.random().toString(36).substr(2, 9)}`;
    const newElement: Element = {
      id,
      type: "image",
      x: 100,
      y: 100,
      src: src,
      rotation: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      opacity: 1
    };
    setElements(prev => [...prev, newElement]);
    saveToHistory([...elements, newElement]);
    setSelectedIds([id]);
  }, [elements, saveToHistory]);

  const handlePrintPDF = () => {
    if (!stageRef.current) return;
    
    // Deselect for clean print
    setSelectedIds([]);
    
    setTimeout(() => {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 3 });
      const windowContent = `
        <!DOCTYPE html>
        <html>
          <head><title>Print Certificate</title></head>
          <body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <img src="${dataUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              };
            </script>
          </body>
        </html>
      `;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(windowContent);
        printWindow.document.close();
      }
    }, 150);
  };

  const handleAddQR = React.useCallback(async () => {
    try {
      const dataUrl = await QRCode.toDataURL(qrValue);
      const id = `qr-${Math.random().toString(36).substr(2, 9)}`;
      const newElement: Element = {
        id,
        type: "qr",
        x: 50,
        y: 150,
        width: 100,
        height: 100,
        src: dataUrl,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1
      };
      updateElements(prev => [...prev, newElement]);
      setSelectedIds([id]);
    } catch (err) {
      console.error("Failed to generate QR code", err);
    }
  }, [qrValue, updateElements]);

  const handleMouseDown = (e: any) => {
    // Deselect if clicking on empty space
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedIds([]);
      setEditingTextId(null);
      
      // Start selection box
      const pos = e.target.getStage().getPointerPosition();
      setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    }
  };

  const handleMouseMove = (e: any) => {
    if (!selectionBox) return;
    const pos = e.target.getStage().getPointerPosition();
    setSelectionBox({ ...selectionBox, x2: pos.x, y2: pos.y });
  };

  const handleMouseUp = (e: any) => {
    if (!selectionBox) return;
    
    // Find elements within the selection box
    const { x1, y1, x2, y2 } = selectionBox;
    const box = {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x1 - x2),
      height: Math.abs(y1 - y2)
    };

    if (box.width < 5 && box.height < 5) {
      setSelectionBox(null);
      return;
    }

    const selected = elements.filter(el => {
      const node = stageRef.current.findOne("#" + el.id);
      if (!node) return false;
      const nodeBox = node.getClientRect();
      return (
        nodeBox.x >= box.x &&
        nodeBox.y >= box.y &&
        nodeBox.x + nodeBox.width <= box.x + box.width &&
        nodeBox.y + nodeBox.height <= box.y + box.height
      );
    }).map(el => el.id);

    setSelectedIds(selected);
    setSelectionBox(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDelete();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const newElements = elements.map(el => {
          if (!selectedIds.includes(el.id)) return el;
          if (e.key === 'ArrowLeft') return { ...el, x: el.x - step };
          if (e.key === 'ArrowRight') return { ...el, x: el.x + step };
          if (e.key === 'ArrowUp') return { ...el, y: el.y - step };
          if (e.key === 'ArrowDown') return { ...el, y: el.y + step };
          return el;
        });
        updateElements(newElements);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, historyStep, history, handleDelete, redo, undo, updateElements]);

  const handleAddArrow = React.useCallback(() => {
    const id = `arrow-${Math.random().toString(36).substr(2, 9)}`;
    const newElement: Element = {
      id,
      type: "arrow",
      x: 100,
      y: 100,
      width: 100,
      height: 0,
      stroke: "#000000",
      strokeWidth: 4,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1
    };
    updateElements(prev => [...prev, newElement]);
    setSelectedIds([id]);
  }, [updateElements]);
  const alignElements = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedIds.length < 2) return;
    
    updateElements(prev => {
      const selectedNodes = prev.filter(el => selectedIds.includes(el.id));
      let minX = Math.min(...selectedNodes.map(el => el.x));
      let maxX = Math.max(...selectedNodes.map(el => el.x + (el.width || 0)));
      let minY = Math.min(...selectedNodes.map(el => el.y));
      let maxY = Math.max(...selectedNodes.map(el => el.y + (el.height || 0)));
      
      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;

      return prev.map(el => {
        if (!selectedIds.includes(el.id)) return el;
        
        const w = el.width || 0;
        const h = el.height || 0;

        switch(type) {
          case 'left': return { ...el, x: minX };
          case 'right': return { ...el, x: maxX - w };
          case 'center': return { ...el, x: centerX - w / 2 };
          case 'top': return { ...el, y: minY };
          case 'bottom': return { ...el, y: maxY - h };
          case 'middle': return { ...el, y: centerY - h / 2 };
          default: return el;
        }
      });
    });
  };

  const getPlaceholders = () => {
    return elements
      .filter(el => el.type === 'text' && el.placeholderKey)
      .map(el => el.placeholderKey as string);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setCertificateData(results.data);
        }
      });
    }
  };

  const handleManualAdd = () => {
    const placeholders = getPlaceholders();
    const newRow: any = {};
    placeholders.forEach(p => newRow[p] = "");
    setCertificateData([...certificateData, newRow]);
  };

  const selectedElements = elements.filter(el => selectedIds.includes(el.id));

  const handleSaveDesign = () => {
    if (!stageRef.current) return;
    
    // Deselect all for clean export
    setSelectedIds([]);
    
    setTimeout(() => {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      if (onSave) {
        onSave(templateName, uri, elements);
      }
    }, 100);
  };

  // History management
  // Moved to top

  useEffect(() => {
    if (bgImage) {
      const ratio = bgImage.width / bgImage.height;
      const maxWidth = 800;
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

  const handleAddText = React.useCallback(() => {
    const id = `text-${Math.random().toString(36).substr(2, 9)}`;
    const newElement: Element = {
      id,
      type: "text",
      x: 50,
      y: 50,
      text: "Double click to edit",
      fontSize: 24,
      fontFamily: "Inter",
      fill: "#000000",
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fontWeight: "normal",
      fontStyle: "normal",
      align: "left",
      opacity: 1
    };
    updateElements(prev => [...prev, newElement]);
    setSelectedIds([id]);
  }, [updateElements]);

  const handleAddRect = React.useCallback(() => {
    const id = `rect-${Math.random().toString(36).substr(2, 9)}`;
    const newElement: Element = {
      id,
      type: "rect",
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      fill: "#3b82f6",
      stroke: "#1d4ed8",
      strokeWidth: 2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1
    };
    updateElements(prev => [...prev, newElement]);
    setSelectedIds([id]);
  }, [updateElements]);

  const handleAddCircle = React.useCallback(() => {
    const id = `circle-${Math.random().toString(36).substr(2, 9)}`;
    const newElement: Element = {
      id,
      type: "circle",
      x: 150,
      y: 150,
      radius: 50,
      fill: "#ef4444",
      stroke: "#b91c1c",
      strokeWidth: 2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1
    };
    updateElements(prev => [...prev, newElement]);
    setSelectedIds([id]);
  }, [updateElements]);

  const handleAddStar = React.useCallback(() => {
    const id = `star-${Math.random().toString(36).substr(2, 9)}`;
    const newElement: Element = {
      id,
      type: "star",
      x: 200,
      y: 200,
      innerRadius: 20,
      outerRadius: 40,
      numPoints: 5,
      fill: "#f59e0b",
      stroke: "#d97706",
      strokeWidth: 2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1
    };
    updateElements(prev => [...prev, newElement]);
    setSelectedIds([id]);
  }, [updateElements]);

  const handleAddPolygon = React.useCallback(() => {
    const id = `poly-${Math.random().toString(36).substr(2, 9)}`;
    const newElement: Element = {
      id,
      type: "poly",
      x: 250,
      y: 250,
      radius: 50,
      numPoints: 6,
      fill: "#8b5cf6",
      stroke: "#6d28d9",
      strokeWidth: 2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1
    };
    updateElements(prev => [...prev, newElement]);
    setSelectedIds([id]);
  }, [updateElements]);

  const handleImageUpload = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const id = `img-${Math.random().toString(36).substr(2, 9)}`;
        const newElement: Element = {
          id,
          type: "image",
          x: 100,
          y: 100,
          src: reader.result as string,
          rotation: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          opacity: 1
        };
        updateElements(prev => [...prev, newElement]);
        setSelectedIds([id]);
      };
      reader.readAsDataURL(file);
    }
  }, [updateElements]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBgImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Moved to top

  const moveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (selectedIds.length === 0) return;
    const newElements = [...elements];
    
    selectedIds.forEach(id => {
      const index = newElements.findIndex(el => el.id === id);
      if (index === -1) return;
      
      if (direction === 'up' && index < newElements.length - 1) {
        [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      } else if (direction === 'down' && index > 0) {
        [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
      } else if (direction === 'top') {
        const [el] = newElements.splice(index, 1);
        newElements.push(el);
      } else if (direction === 'bottom') {
        const [el] = newElements.splice(index, 1);
        newElements.unshift(el);
      }
    });
    
    updateElements(newElements);
  };

  const handleExport = () => {
    if (!stageRef.current) return;
    
    // Reset zoom for export
    const oldZoom = zoom;
    setZoom(1);
    
    // Deselect before export for clean image
    setSelectedIds([]);
    
    // Small timeout to ensure transformer is hidden and zoom is reset
    setTimeout(() => {
      const uri = stageRef.current.toDataURL({ pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `design-${Date.now()}.png`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setZoom(oldZoom);
    }, 150);
  };

  const handleClear = () => {
    updateElements([]);
    setSelectedIds([]);
  };

  const saveProject = () => {
    const data = JSON.stringify({ elements, bgImageSrc });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${Date.now()}.json`;
    link.click();
  };

  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (data.elements) {
            updateElements(data.elements);
            if (data.bgImageSrc) setBgImageSrc(data.bgImageSrc);
          }
        } catch (err) {
          console.error("Failed to load project file.", err);
        }
      };
      reader.readAsText(file);
    }
  };

  const checkDeselect = (e: any) => {
    // Handled by handleMouseDown
  };

  useEffect(() => {
    if (trRef.current && stageRef.current) {
      const nodes = selectedIds.map(id => stageRef.current.findOne("#" + id)).filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, elements]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (bgImage) {
          const ratio = bgImage.width / bgImage.height;
          const newWidth = entry.contentRect.width;
          const newHeight = newWidth / ratio;
          setStageSize({ width: newWidth, height: newHeight });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [bgImage]);

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-2xl shadow-sm border border-stone-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-stone-900">Internal Designer</h3>
          <div className="h-8 w-px bg-stone-200" />
          <input 
            type="text" 
            value={templateName} 
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template Name"
            className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1 text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/10 w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-white text-stone-600 border border-stone-200 rounded-lg font-bold text-sm hover:bg-stone-50 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Print PDF
          </button>
          <button 
            onClick={handleSaveDesign}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg font-bold text-sm hover:bg-stone-800 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save & Continue
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tools */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto max-h-[85vh] pr-2 custom-scrollbar">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Editor</h3>
            <div className="flex gap-1">
              <button 
                onClick={undo} 
                disabled={historyStep <= 0}
                className="p-2 hover:bg-stone-100 rounded-lg disabled:opacity-30 transition-colors"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button 
                onClick={redo} 
                disabled={historyStep >= history.length - 1}
                className="p-2 hover:bg-stone-100 rounded-lg disabled:opacity-30 transition-colors"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all group",
                      showTemplates ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                    )}
                  >
                    <Layers className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">Templates</span>
                  </button>
                  <button 
                    onClick={() => setShowAssets(!showAssets)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all group",
                      showAssets ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                    )}
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">Assets</span>
                  </button>
                </div>

                {showTemplates && (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Template Library</h4>
                      <button onClick={() => setShowTemplates(false)}><X className="w-3 h-3" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {templates.map(t => (
                        <button 
                          key={t.id}
                          onClick={() => {
                            setBgImageSrc(t.url);
                            setShowTemplates(false);
                          }}
                          className="group relative aspect-video rounded-lg overflow-hidden border border-stone-200 hover:border-stone-900 transition-all"
                        >
                          <Image 
                            src={t.url} 
                            alt={t.name} 
                            fill
                            className="object-cover group-hover:scale-110 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold uppercase">{t.category}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showAssets && (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Asset Library</h4>
                      <button onClick={() => setShowAssets(false)}><X className="w-3 h-3" /></button>
                    </div>
                    <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-stone-300 rounded-xl hover:bg-stone-100 cursor-pointer transition-all">
                      <Plus className="w-4 h-4 text-stone-400" />
                      <span className="text-[10px] font-bold text-stone-500 uppercase">Bulk Upload</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleBulkAssetUpload} />
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {assets.map(asset => (
                        <button 
                          key={asset.id}
                          onClick={() => addAssetToCanvas(asset.src)}
                          className="aspect-square rounded-lg border border-stone-200 bg-white p-1 hover:border-stone-900 transition-all group relative"
                        >
                          <Image 
                            src={asset.src} 
                            alt={asset.name} 
                            fill
                            unoptimized
                            className="object-contain p-1" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssets(assets.filter(a => a.id !== asset.id));
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center gap-3 p-3 bg-white hover:bg-stone-50 rounded-xl cursor-pointer transition-all border border-stone-200 shadow-sm group">
                    <div className="p-2 bg-stone-100 rounded-lg group-hover:bg-stone-200 transition-colors">
                      <ImageIcon className="w-4 h-4 text-stone-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Background</span>
                      <span className="text-[10px] text-stone-400">Upload canvas base</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleBgUpload} />
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white hover:bg-stone-50 rounded-xl cursor-pointer transition-all border border-stone-200 shadow-sm group">
                    <div className="p-2 bg-stone-100 rounded-lg group-hover:bg-stone-200 transition-colors">
                      <Plus className="w-4 h-4 text-stone-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Add Image</span>
                      <span className="text-[10px] text-stone-400">Insert custom asset</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <label className="text-[10px] font-bold text-stone-400 uppercase">QR Code Value</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={qrValue} 
                      onChange={(e) => setQrValue(e.target.value)}
                      placeholder="Enter URL or text"
                      className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                    <button onClick={handleAddQR} className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-all shadow-sm">
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button onClick={handleAddText} className="flex flex-col items-center gap-1 p-2 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 shadow-sm transition-all" title="Text">
                    <FontIcon className="w-4 h-4 text-stone-600" />
                    <span className="text-[8px] font-bold uppercase">Text</span>
                  </button>
                  <button onClick={handleAddRect} className="flex flex-col items-center gap-1 p-2 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 shadow-sm transition-all" title="Rectangle">
                    <Square className="w-4 h-4 text-stone-600" />
                    <span className="text-[8px] font-bold uppercase">Rect</span>
                  </button>
                  <button onClick={handleAddCircle} className="flex flex-col items-center gap-1 p-2 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 shadow-sm transition-all" title="Circle">
                    <CircleIcon className="w-4 h-4 text-stone-600" />
                    <span className="text-[8px] font-bold uppercase">Circle</span>
                  </button>
                  <button onClick={handleAddStar} className="flex flex-col items-center gap-1 p-2 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 shadow-sm transition-all" title="Star">
                    <StarIcon className="w-4 h-4 text-stone-600" />
                    <span className="text-[8px] font-bold uppercase">Star</span>
                  </button>
                  <button onClick={handleAddPolygon} className="flex flex-col items-center gap-1 p-2 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 shadow-sm transition-all" title="Polygon">
                    <Hexagon className="w-4 h-4 text-stone-600" />
                    <span className="text-[8px] font-bold uppercase">Poly</span>
                  </button>
                  <button onClick={handleAddArrow} className="flex flex-col items-center gap-1 p-2 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 shadow-sm transition-all" title="Arrow">
                    <ArrowRight className="w-4 h-4 text-stone-600" />
                    <span className="text-[8px] font-bold uppercase">Arrow</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-lg">
                  <button 
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 p-2 rounded-md text-[10px] font-bold uppercase transition-all",
                      snapToGrid ? "bg-white shadow-sm text-stone-900" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    <Grid className="w-3 h-3" />
                    Snap Grid
                  </button>
                  <div className="flex items-center gap-1 bg-white rounded-md p-1 shadow-sm">
                    <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="p-1 hover:bg-stone-100 rounded"><Minus className="w-3 h-3" /></button>
                    <span className="text-[9px] font-bold w-8 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="p-1 hover:bg-stone-100 rounded"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>

        {selectedIds.length > 0 && selectedElements.length > 0 && (
          <div className="mt-2 p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">Properties ({selectedIds.length})</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => moveLayer('top')} title="Bring to Front" className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors">
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Shadow Properties */}
              <div className="pt-2 border-t border-stone-200">
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter mb-2 block">Shadow</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] text-stone-400 uppercase">Blur</label>
                    <input 
                      type="number" className="w-full p-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      value={selectedElements[0].shadowBlur || 0}
                      onChange={(e) => updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, shadowBlur: parseInt(e.target.value)} : el))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-stone-400 uppercase">Color</label>
                    <input 
                      type="color" className="w-full h-8 p-1 bg-white border border-stone-200 rounded-lg cursor-pointer"
                      value={selectedElements[0].shadowColor || "#000000"}
                      onChange={(e) => updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, shadowColor: e.target.value} : el))}
                    />
                  </div>
                </div>
              </div>

              {/* Alignment Quick Tools */}
              {selectedIds.length > 1 && (
                <div className="grid grid-cols-6 gap-1 p-1 bg-stone-100 rounded-lg">
                  <button onClick={() => alignElements('left')} className="p-1.5 hover:bg-white rounded transition-all" title="Align Left"><AlignLeft className="w-3 h-3" /></button>
                  <button onClick={() => alignElements('center')} className="p-1.5 hover:bg-white rounded transition-all" title="Align Center"><AlignCenter className="w-3 h-3" /></button>
                  <button onClick={() => alignElements('right')} className="p-1.5 hover:bg-white rounded transition-all" title="Align Right"><AlignRight className="w-3 h-3" /></button>
                  <button onClick={() => alignElements('top')} className="p-1.5 hover:bg-white rounded transition-all rotate-90" title="Align Top"><AlignLeft className="w-3 h-3" /></button>
                  <button onClick={() => alignElements('middle')} className="p-1.5 hover:bg-white rounded transition-all rotate-90" title="Align Middle"><AlignCenter className="w-3 h-3" /></button>
                  <button onClick={() => alignElements('bottom')} className="p-1.5 hover:bg-white rounded transition-all rotate-90" title="Align Bottom"><AlignRight className="w-3 h-3" /></button>
                </div>
              )}

              {/* Common Properties */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[9px] font-bold text-stone-400 uppercase"><Ghost className="w-3 h-3" /> Opacity</label>
                  <input 
                    type="range" min="0" max="1" step="0.1"
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                    value={selectedElements[0].opacity || 1}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, opacity: val} : el));
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[9px] font-bold text-stone-400 uppercase"><Palette className="w-3 h-3" /> Color</label>
                  <input 
                    type="color" 
                    className="w-full h-8 p-1 bg-white border border-stone-200 rounded-lg cursor-pointer"
                    value={selectedElements[0].fill || "#000000"}
                    onChange={(e) => {
                      updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, fill: e.target.value} : el));
                    }}
                  />
                </div>
              </div>

              {selectedElements[0].type === 'text' && (
                <div className="space-y-3 pt-2 border-t border-stone-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Size</label>
                      <input 
                        type="number" 
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        value={selectedElements[0].fontSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, fontSize: val} : el));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Style</label>
                      <select 
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        value={selectedElements[0].fontWeight}
                        onChange={(e) => {
                          updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, fontWeight: e.target.value} : el));
                        }}
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="900">Black</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Font Family</label>
                    <select 
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                      value={selectedElements[0].fontFamily}
                      onChange={(e) => {
                        updateElements(elements.map(el => selectedIds.includes(el.id) ? {...el, fontFamily: e.target.value} : el));
                      }}
                    >
                      <option value="Inter">Inter (Sans)</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia (Serif)</option>
                      <option value="Courier New">Courier (Mono)</option>
                      <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Alignment</label>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, align: 'left'} : el))}
                        className={cn("flex-1 p-2 rounded-lg border transition-all", selectedElements[0].align === 'left' ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-200 text-stone-600")}
                      >
                        <AlignLeft className="w-3 h-3 mx-auto" />
                      </button>
                      <button 
                        onClick={() => updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, align: 'center'} : el))}
                        className={cn("flex-1 p-2 rounded-lg border transition-all", selectedElements[0].align === 'center' ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-200 text-stone-600")}
                      >
                        <AlignCenter className="w-3 h-3 mx-auto" />
                      </button>
                      <button 
                        onClick={() => updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, align: 'right'} : el))}
                        className={cn("flex-1 p-2 rounded-lg border transition-all", selectedElements[0].align === 'right' ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-200 text-stone-600")}
                      >
                        <AlignRight className="w-3 h-3 mx-auto" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Placeholder Key</label>
                    <input 
                      type="text" 
                      placeholder="e.g. name, date"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                      value={selectedElements[0].placeholderKey || ""}
                      onChange={(e) => {
                        updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, placeholderKey: e.target.value} : el));
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Insert Variable</label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {["{NAME}", "{DATE}", "{EVENT_NAME}", "{GRADE}", "{Certificate Number}"].map(v => (
                        <button 
                          key={v}
                          onClick={() => {
                            const newText = (selectedElements[0].text || "") + v;
                            updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, text: newText} : el));
                          }}
                          className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 rounded text-[9px] font-mono text-stone-600 transition-colors"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {certificateData.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-stone-400 uppercase">CSV Columns</label>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(certificateData[0]).map(v => (
                            <button 
                              key={v}
                              onClick={() => {
                                const newText = (selectedElements[0].text || "") + `{${v}}`;
                                updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, text: newText} : el));
                              }}
                              className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 rounded text-[9px] font-mono text-emerald-600 border border-emerald-100 transition-colors"
                            >
                              {`{${v}}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Content</label>
                    <textarea 
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs min-h-[60px]"
                      value={selectedElements[0].text}
                      onChange={(e) => {
                        updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, text: e.target.value} : el));
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedElements[0].type === 'image' && (
                <div className="space-y-3 pt-2 border-t border-stone-200">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Brightness</label>
                    <input 
                      type="range" min="-1" max="1" step="0.1"
                      className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                      value={selectedElements[0].brightness || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, brightness: val} : el));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Contrast</label>
                    <input 
                      type="range" min="-100" max="100" step="1"
                      className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                      value={selectedElements[0].contrast || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, contrast: val} : el));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Blur</label>
                    <input 
                      type="range" min="0" max="20" step="1"
                      className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                      value={selectedElements[0].blur || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, blur: val} : el));
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button 
                      onClick={() => updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, grayscale: el.grayscale ? 0 : 1} : el))}
                      className={cn("p-2 rounded-lg text-[8px] font-bold uppercase border", selectedElements[0].grayscale ? "bg-stone-900 text-white" : "bg-white text-stone-600")}
                    >
                      Gray
                    </button>
                    <button 
                      onClick={() => updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, sepia: el.sepia ? 0 : 1} : el))}
                      className={cn("p-2 rounded-lg text-[8px] font-bold uppercase border", selectedElements[0].sepia ? "bg-stone-900 text-white" : "bg-white text-stone-600")}
                    >
                      Sepia
                    </button>
                    <button 
                      onClick={() => updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, invert: el.invert ? 0 : 1} : el))}
                      className={cn("p-2 rounded-lg text-[8px] font-bold uppercase border", selectedElements[0].invert ? "bg-stone-900 text-white" : "bg-white text-stone-600")}
                    >
                      Invert
                    </button>
                  </div>
                </div>
              )}

              {(['rect', 'circle', 'star', 'arrow', 'poly'].includes(selectedElements[0].type)) && (
                <div className="space-y-3 pt-2 border-t border-stone-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Stroke Width</label>
                      <input 
                        type="number" 
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        value={selectedElements[0].strokeWidth || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, strokeWidth: val} : el));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Stroke Color</label>
                      <input 
                        type="color" 
                        className="w-full h-8 p-1 bg-white border border-stone-200 rounded-lg cursor-pointer"
                        value={selectedElements[0].stroke || "#000000"}
                        onChange={(e) => {
                          updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, stroke: e.target.value} : el));
                        }}
                      />
                    </div>
                  </div>
                  {selectedElements[0].type === 'rect' && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Corner Radius</label>
                      <input 
                        type="number" 
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        value={selectedElements[0].cornerRadius || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, cornerRadius: val} : el));
                        }}
                      />
                    </div>
                  )}
                  {(selectedElements[0].type === 'star' || selectedElements[0].type === 'poly') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Sides/Points</label>
                        <input 
                          type="number" 
                          className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                          value={selectedElements[0].numPoints || 5}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, numPoints: val} : el));
                          }}
                        />
                      </div>
                      {selectedElements[0].type === 'star' && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">Inner Radius</label>
                          <input 
                            type="number" 
                            className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                            value={selectedElements[0].innerRadius || 20}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              updateElements(prev => prev.map(el => selectedIds.includes(el.id) ? {...el, innerRadius: val} : el));
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

        <div className="mt-auto space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={saveProject}
              className="flex items-center justify-center gap-2 p-2 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all border border-stone-200"
            >
              <FileJson className="w-4 h-4" />
              <span className="text-xs font-semibold">Save JSON</span>
            </button>
            <label className="flex items-center justify-center gap-2 p-2 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all border border-stone-200 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span className="text-xs font-semibold">Load JSON</span>
              <input type="file" className="hidden" accept=".json" onChange={loadProject} />
            </label>
          </div>

          <button 
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-semibold">Clear Canvas</span>
          </button>

          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">Download Preview</span>
          </button>
          
          <button 
            onClick={handleSaveDesign}
            className="w-full flex items-center justify-center gap-2 p-4 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-200"
          >
            <Save className="w-5 h-5" />
            <span className="font-semibold">Save Template</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 bg-stone-100 rounded-xl overflow-hidden flex items-center justify-center min-h-[600px] border-2 border-dashed border-stone-300 relative">
        <div className="shadow-2xl bg-white">
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            ref={stageRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            scaleX={zoom}
            scaleY={zoom}
            className="bg-white shadow-lg rounded-lg overflow-hidden"
          >
            <Layer>
              {bgImage ? (
                <KonvaImage
                  image={bgImage}
                  width={stageSize.width}
                  height={stageSize.height}
                  listening={false}
                />
              ) : (
                <Rect 
                  width={stageSize.width}
                  height={stageSize.height}
                  fill="white"
                  listening={false}
                />
              )}
                {elements.map((el) => {
                  const isEditing = editingTextId === el.id;
                  const commonProps = {
                    id: el.id,
                    x: el.x,
                    y: el.y,
                    rotation: el.rotation,
                    scaleX: el.scaleX,
                    scaleY: el.scaleY,
                    opacity: el.opacity,
                    shadowColor: el.shadowColor,
                    shadowBlur: el.shadowBlur,
                    shadowOffsetX: el.shadowOffsetX || 5,
                    shadowOffsetY: el.shadowOffsetY || 5,
                    shadowOpacity: el.shadowOpacity || 0.5,
                    draggable: !isEditing,
                    onClick: (e: any) => {
                      if (e.evt.shiftKey) {
                        setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]);
                      } else {
                        setSelectedIds([el.id]);
                      }
                    },
                    onDblClick: () => {
                      if (el.type === 'text') {
                        setEditingTextId(el.id);
                      }
                    },
                    onDragEnd: (e: any) => {
                      let newX = e.target.x();
                      let newY = e.target.y();
                      
                      if (snapToGrid) {
                        newX = Math.round(newX / gridGap) * gridGap;
                        newY = Math.round(newY / gridGap) * gridGap;
                        e.target.position({ x: newX, y: newY });
                      }

                      updateElements(elements.map(item => item.id === el.id ? {
                        ...item, 
                        x: newX, 
                        y: newY
                      } : item));
                    },
                    onTransformEnd: (e: any) => {
                      const node = e.target;
                      let newX = node.x();
                      let newY = node.y();

                      if (snapToGrid) {
                        newX = Math.round(newX / gridGap) * gridGap;
                        newY = Math.round(newY / gridGap) * gridGap;
                        node.position({ x: newX, y: newY });
                      }

                      updateElements(elements.map(item => item.id === el.id ? {
                        ...item,
                        x: newX,
                        y: newY,
                        rotation: node.rotation(),
                        scaleX: node.scaleX(),
                        scaleY: node.scaleY(),
                      } : item));
                    }
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
                {selectedIds.length > 0 && (
                  <Transformer
                    ref={trRef}
                    rotateEnabled={true}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                )}
                {selectionBox && (
                  <Rect
                    x={Math.min(selectionBox.x1, selectionBox.x2)}
                    y={Math.min(selectionBox.y1, selectionBox.y2)}
                    width={Math.abs(selectionBox.x1 - selectionBox.x2)}
                    height={Math.abs(selectionBox.y1 - selectionBox.y2)}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3b82f6"
                    strokeWidth={1}
                  />
                )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
);
};

export default InternalDesigner;
