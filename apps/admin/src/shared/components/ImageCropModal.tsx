"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { X, RotateCw, ZoomIn, ZoomOut, Check } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCrop: (blob: Blob) => void;
}

export function ImageCropModal({ open, imageSrc, onClose, onCrop }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);

  const SIZE = 280;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
    img.src = imageSrc;
  }, [open, imageSrc]);

  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = SIZE * 2;
    canvas.height = SIZE * 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    const img = imgRef.current;
    const scale = Math.min((SIZE * 2) / img.width, (SIZE * 2) / img.height) * zoom;
    ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
    ctx.restore();
  }, [loaded, zoom, rotation, offset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  function handleCrop() {
    if (!canvasRef.current || !imgRef.current) return;
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = 400;
    cropCanvas.height = 400;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;
    const srcCanvas = canvasRef.current;
    const sx = (srcCanvas.width - SIZE) / 2;
    const sy = (srcCanvas.height - SIZE) / 2;
    ctx.drawImage(srcCanvas, sx, sy, SIZE, SIZE, 0, 0, 400, 400);
    cropCanvas.toBlob((blob) => {
      if (blob) onCrop(blob);
    }, "image/jpeg", 0.9);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Crop Profile Photo</h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="flex justify-center mb-4">
          <div
            className="relative rounded-full overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-600 cursor-move"
            style={{ width: SIZE, height: SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ZoomOut className="h-4 w-4 text-gray-400 dark:text-slate-500 shrink-0" />
            <input
              type="range"
              min={MIN_ZOOM * 100}
              max={MAX_ZOOM * 100}
              value={zoom * 100}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-brand-500"
            />
            <ZoomIn className="h-4 w-4 text-gray-400 dark:text-slate-500 shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRotation((r) => (r + 90) % 360)} className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              <RotateCw className="h-3.5 w-3.5" /> Rotate
            </button>
            <button onClick={() => { setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 }); }} className="rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              Reset
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={handleCrop} className="flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors">
            <Check className="h-3.5 w-3.5" /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
