"use client";

import { useState, useCallback, useRef } from "react";
import {
  ImagePlus,
  FileDown,
  Trash2,
  GripVertical,
  ArrowLeft,
  RotateCw,
  X,
  FileImage,
} from "lucide-react";
import { jsPDF } from "jspdf";
import Link from "next/link";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  rotation: number;
}

type PageSize = "a4" | "letter" | "legal" | "fit";
type Orientation = "portrait" | "landscape" | "auto";
type ImageFit = "contain" | "cover" | "stretch";

const PAGE_SIZES: Record<string, { label: string; w: number; h: number }> = {
  a4: { label: "A4", w: 210, h: 297 },
  letter: { label: "Letter", w: 215.9, h: 279.4 },
  legal: { label: "Legal", w: 215.9, h: 355.6 },
  fit: { label: "Fit to Image", w: 0, h: 0 },
};

export default function ImageToPdfPage(): React.ReactElement {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [imageFit, setImageFit] = useState<ImageFit>("contain");
  const [margin, setMargin] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItemRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImages = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages: ImageItem[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        rotation: 0,
      }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const rotateImage = useCallback((id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  }, [images]);

  const handleDragStart = (id: string) => {
    dragItemRef.current = id;
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = dragItemRef.current;
    if (!sourceId || sourceId === targetId) return;
    setImages((prev) => {
      const newArr = [...prev];
      const sourceIdx = newArr.findIndex((i) => i.id === sourceId);
      const targetIdx = newArr.findIndex((i) => i.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      const [moved] = newArr.splice(sourceIdx, 1);
      newArr.splice(targetIdx, 0, moved);
      return newArr;
    });
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    dragItemRef.current = null;
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const generatePdf = async () => {
    if (images.length === 0) return;
    setGenerating(true);

    try {
      let pdf: jsPDF | null = null;

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const img = await loadImage(item.preview);

        const isRotated = item.rotation === 90 || item.rotation === 270;
        const imgW = isRotated ? img.naturalHeight : img.naturalWidth;
        const imgH = isRotated ? img.naturalWidth : img.naturalHeight;

        // Draw rotated image to canvas
        const canvas = document.createElement("canvas");
        canvas.width = imgW;
        canvas.height = imgH;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((item.rotation * Math.PI) / 180);
        if (isRotated) {
          ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        } else {
          ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        }
        ctx.restore();

        const imgDataUrl = canvas.toDataURL("image/jpeg", 0.92);

        let pageW: number;
        let pageH: number;

        if (pageSize === "fit") {
          // Page fits the image (convert px to mm at 96 DPI)
          const pxToMm = 25.4 / 96;
          pageW = imgW * pxToMm + margin * 2;
          pageH = imgH * pxToMm + margin * 2;
        } else {
          const size = PAGE_SIZES[pageSize];
          if (orientation === "auto") {
            // Auto-detect: use landscape if image is wider than tall
            if (imgW > imgH) {
              pageW = size.h;
              pageH = size.w;
            } else {
              pageW = size.w;
              pageH = size.h;
            }
          } else if (orientation === "landscape") {
            pageW = size.h;
            pageH = size.w;
          } else {
            pageW = size.w;
            pageH = size.h;
          }
        }

        if (i === 0) {
          pdf = new jsPDF({
            orientation: pageW > pageH ? "landscape" : "portrait",
            unit: "mm",
            format: [pageW, pageH],
          });
        } else {
          pdf!.addPage([pageW, pageH], pageW > pageH ? "landscape" : "portrait");
        }

        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;
        const imgAspect = imgW / imgH;
        const areaAspect = availW / availH;

        let drawW: number;
        let drawH: number;

        if (imageFit === "stretch") {
          drawW = availW;
          drawH = availH;
        } else if (imageFit === "cover") {
          if (imgAspect > areaAspect) {
            drawH = availH;
            drawW = availH * imgAspect;
          } else {
            drawW = availW;
            drawH = availW / imgAspect;
          }
        } else {
          // contain
          if (imgAspect > areaAspect) {
            drawW = availW;
            drawH = availW / imgAspect;
          } else {
            drawH = availH;
            drawW = availH * imgAspect;
          }
        }

        const x = margin + (availW - drawW) / 2;
        const y = margin + (availH - drawH) / 2;

        pdf!.addImage(imgDataUrl, "JPEG", x, y, drawW, drawH);
      }

      pdf!.save("images.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addImages(e.dataTransfer.files);
  };

  return (
    <main className="relative min-h-screen bg-brand-bg px-4 py-8 sm:px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-1/3 top-10 h-64 w-64 rounded-full bg-brand-or blur-[140px]" />
        <div className="absolute bottom-20 right-1/4 h-48 w-48 rounded-full bg-brand-purple blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-xl border border-brand-border bg-brand-card p-2 text-brand-sub transition hover:text-brand-text"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              Image to PDF
            </h1>
            <p className="mt-1 text-sm text-brand-sub">
              Upload images, reorder them, and download as a single PDF
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Left: Upload & Preview */}
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-border bg-brand-card/50 p-10 transition hover:border-brand-or hover:bg-brand-card"
            >
              <div className="rounded-full bg-brand-or/10 p-4">
                <ImagePlus className="h-8 w-8 text-brand-or" />
              </div>
              <p className="text-sm text-brand-sub">
                <span className="font-semibold text-brand-text">
                  Click to upload
                </span>{" "}
                or drag &amp; drop images here
              </p>
              <p className="text-xs text-brand-muted">
                JPG, PNG, GIF, WebP, BMP, SVG supported
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addImages(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Image grid */}
            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-brand-sub">
                    {images.length} image{images.length !== 1 ? "s" : ""} added
                    &mdash; drag to reorder
                  </p>
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-error transition hover:bg-brand-error/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear all
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      draggable
                      onDragStart={() => handleDragStart(img.id)}
                      onDragOver={(e) => handleDragOver(e, img.id)}
                      onDrop={(e) => handleDrop(e, img.id)}
                      onDragEnd={handleDragEnd}
                      className={`group relative overflow-hidden rounded-xl border bg-brand-card transition ${
                        dragOverId === img.id
                          ? "border-brand-or shadow-lg shadow-brand-or/20"
                          : "border-brand-border"
                      }`}
                    >
                      <div className="aspect-square overflow-hidden bg-brand-bg/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.preview}
                          alt={`Image ${idx + 1}`}
                          className="h-full w-full object-contain transition"
                          style={{
                            transform: `rotate(${img.rotation}deg)`,
                          }}
                        />
                      </div>
                      {/* Overlay controls */}
                      <div className="absolute inset-0 flex items-start justify-between bg-gradient-to-b from-black/50 via-transparent to-black/30 p-2 opacity-0 transition group-hover:opacity-100">
                        <div className="flex items-center gap-1">
                          <span className="rounded bg-brand-or/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <GripVertical className="h-4 w-4 cursor-grab text-white/80" />
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => rotateImage(img.id)}
                            className="rounded-lg bg-white/20 p-1.5 backdrop-blur-sm transition hover:bg-white/30"
                          >
                            <RotateCw className="h-3.5 w-3.5 text-white" />
                          </button>
                          <button
                            onClick={() => removeImage(img.id)}
                            className="rounded-lg bg-red-500/70 p-1.5 backdrop-blur-sm transition hover:bg-red-500/90"
                          >
                            <X className="h-3.5 w-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-brand-border px-2 py-1.5">
                        <p className="truncate text-[11px] text-brand-muted">
                          {img.file.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {images.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-border bg-brand-card/30 py-16">
                <FileImage className="h-12 w-12 text-brand-muted" />
                <p className="text-sm text-brand-muted">
                  No images yet. Upload some to get started.
                </p>
              </div>
            )}
          </div>

          {/* Right: Settings panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-sub">
                PDF Settings
              </h2>

              {/* Page Size */}
              <label className="mb-1.5 block text-xs text-brand-muted">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSize)}
                className="mb-4 w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm text-brand-text outline-none transition focus:border-brand-or"
              >
                {Object.entries(PAGE_SIZES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>

              {/* Orientation */}
              <label className="mb-1.5 block text-xs text-brand-muted">
                Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as Orientation)}
                disabled={pageSize === "fit"}
                className="mb-4 w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm text-brand-text outline-none transition focus:border-brand-or disabled:opacity-50"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
                <option value="auto">Auto (per image)</option>
              </select>

              {/* Image Fit */}
              <label className="mb-1.5 block text-xs text-brand-muted">
                Image Fit
              </label>
              <select
                value={imageFit}
                onChange={(e) => setImageFit(e.target.value as ImageFit)}
                className="mb-4 w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm text-brand-text outline-none transition focus:border-brand-or"
              >
                <option value="contain">Contain (no crop)</option>
                <option value="cover">Cover (may crop)</option>
                <option value="stretch">Stretch to fill</option>
              </select>

              {/* Margin */}
              <label className="mb-1.5 block text-xs text-brand-muted">
                Margin: {margin}mm
              </label>
              <input
                type="range"
                min={0}
                max={30}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="mb-6 w-full accent-brand-or"
              />

              {/* Generate Button */}
              <button
                onClick={generatePdf}
                disabled={images.length === 0 || generating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="h-5 w-5" />
                    Download PDF
                  </>
                )}
              </button>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-brand-border bg-brand-surf p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-sub">
                Tips
              </h3>
              <ul className="space-y-1.5 text-xs text-brand-muted">
                <li>&#x2022; Drag images to reorder pages</li>
                <li>&#x2022; Hover on images to rotate or remove</li>
                <li>
                  &#x2022; Use &ldquo;Fit to Image&rdquo; for original
                  dimensions
                </li>
                <li>
                  &#x2022; &ldquo;Auto&rdquo; orientation matches each image
                </li>
                <li>&#x2022; Everything runs in your browser &mdash; private &amp; fast</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
