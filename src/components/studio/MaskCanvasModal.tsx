"use client";

import React, { useEffect, useRef, useState } from "react";
import { Brush, Check, Eraser, X } from "lucide-react";
import { StudioLocale } from "@/domain/studio-types";

interface MaskCanvasModalProps {
  open: boolean;
  imageUrl?: string;
  onClose: () => void;
  onSaveMask: (dataUrl: string | undefined) => void;
  locale: StudioLocale;
}

export function MaskCanvasModal({
  open,
  imageUrl,
  onClose,
  onSaveMask,
  locale,
}: MaskCanvasModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushSize, setBrushSize] = useState<number>(28);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, [open]);

  if (!open) return null;

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const paintStroke = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const coords = getCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    if (!coords || !ctx) return;
    ctx.fillStyle = "rgba(139, 92, 246, 0.55)";
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSaveMask(canvas.toDataURL("image/png"));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="neramit-glass flex w-full max-w-lg flex-col gap-4 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brush className="size-4 text-violet-400" />
            <h2 className="text-base font-extrabold">
              {locale === "th"
                ? "ระบาย Mask จุดที่ต้องการแก้ไข (HTML5 Inpaint Canvas)"
                : "Interactive HTML5 Inpainting Mask Painter"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-raised grid size-8 place-items-center rounded-xl"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="neu-pressed relative mx-auto h-72 w-72 overflow-hidden rounded-2xl bg-black/50 sm:h-80 sm:w-80">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Mask reference"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-85"
            />
          )}
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            onMouseDown={(e) => {
              setIsDrawing(true);
              paintStroke(e);
            }}
            onMouseMove={paintStroke}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
            className="relative z-10 h-full w-full cursor-crosshair"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span>{locale === "th" ? "ขนาดแปรง:" : "Brush:"}</span>
            <input
              type="range"
              min={10}
              max={64}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-28 accent-violet-500"
            />
            <span className="tabular-nums">{brushSize}px</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleClear();
                onSaveMask(undefined);
              }}
              className="neu-flat flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold"
            >
              <Eraser className="size-3.5" />
              <span>{locale === "th" ? "ล้างค่า" : "Clear"}</span>
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="neu-tint-primary flex items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-extrabold"
            >
              <Check className="size-3.5" />
              <span>{locale === "th" ? "บันทึก Mask" : "Apply Mask"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
