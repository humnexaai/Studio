"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  FileUp,
  Download,
  ArrowLeft,
  FileImage,
  Loader2,
  ImageIcon,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

type ImageFormat = "png" | "jpeg" | "webp";
type ScaleOption = "1" | "2" | "3" | "4";

interface PageImage {
  pageNum: number;
  dataUrl: string;
  width: number;
  height: number;
}

export default function PdfToImagePage(): React.ReactElement {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<PageImage[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [scale, setScale] = useState<ScaleOption>("2");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfjsLibRef = useRef<typeof import("pdfjs-dist") | null>(null);

  useEffect(() => {
    async function loadPdfJs() {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      pdfjsLibRef.current = pdfjs;
    }
    loadPdfJs();
  }, []);

  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (!file || file.type !== "application/pdf") return;
      setPdfFile(file);
      setPageImages([]);
      setSelectedPages(new Set());
      setProcessing(true);
      setProgress(0);

      try {
        const pdfjs = pdfjsLibRef.current;
        if (!pdfjs) return;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        setTotalPages(numPages);

        const scaleNum = Number(scale);
        const images: PageImage[] = [];

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: scaleNum });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({ canvas, canvasContext: ctx, viewport }).promise;

          const mimeType =
            format === "png"
              ? "image/png"
              : format === "jpeg"
                ? "image/jpeg"
                : "image/webp";
          const quality = format === "png" ? undefined : 0.92;
          const dataUrl = canvas.toDataURL(mimeType, quality);

          images.push({
            pageNum: i,
            dataUrl,
            width: viewport.width,
            height: viewport.height,
          });

          setProgress(Math.round((i / numPages) * 100));
        }

        setPageImages(images);
        setSelectedPages(new Set(images.map((img) => img.pageNum)));
      } catch (err) {
        console.error("PDF processing failed:", err);
      } finally {
        setProcessing(false);
      }
    },
    [format, scale]
  );

  const togglePage = useCallback((pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPages(new Set(pageImages.map((img) => img.pageNum)));
  }, [pageImages]);

  const deselectAll = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const downloadImage = useCallback(
    (img: PageImage) => {
      const link = document.createElement("a");
      link.href = img.dataUrl;
      const ext = format;
      const baseName = pdfFile
        ? pdfFile.name.replace(/\.pdf$/i, "")
        : "page";
      link.download = `${baseName}_page_${img.pageNum}.${ext}`;
      link.click();
    },
    [format, pdfFile]
  );

  const downloadSelected = useCallback(() => {
    const selected = pageImages.filter((img) =>
      selectedPages.has(img.pageNum)
    );
    selected.forEach((img, idx) => {
      setTimeout(() => downloadImage(img), idx * 200);
    });
  }, [pageImages, selectedPages, downloadImage]);

  const clearPdf = useCallback(() => {
    setPdfFile(null);
    setPageImages([]);
    setTotalPages(0);
    setSelectedPages(new Set());
    setProgress(0);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <main className="relative min-h-screen bg-brand-bg px-4 py-8 sm:px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-16 h-64 w-64 rounded-full bg-brand-purple blur-[140px]" />
        <div className="absolute bottom-20 right-1/3 h-48 w-48 rounded-full bg-brand-gr blur-[120px]" />
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
              PDF to Image
            </h1>
            <p className="mt-1 text-sm text-brand-sub">
              Convert PDF pages into high-quality images
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Left: Upload & Preview */}
          <div className="space-y-4">
            {/* Upload zone — shown when no PDF loaded */}
            {!pdfFile && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-border bg-brand-card/50 p-10 transition hover:border-brand-purple hover:bg-brand-card"
              >
                <div className="rounded-full bg-brand-purple/10 p-4">
                  <FileUp className="h-8 w-8 text-brand-purple" />
                </div>
                <p className="text-sm text-brand-sub">
                  <span className="font-semibold text-brand-text">
                    Click to upload
                  </span>{" "}
                  or drag &amp; drop a PDF file here
                </p>
                <p className="text-xs text-brand-muted">
                  PDF files up to 100MB supported
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = "";
                  }}
                />
              </div>
            )}

            {/* File loaded header */}
            {pdfFile && (
              <div className="flex items-center justify-between rounded-2xl border border-brand-border bg-brand-card p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-purple/10 p-2">
                    <FileImage className="h-5 w-5 text-brand-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">
                      {pdfFile.name}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {totalPages} page{totalPages !== 1 ? "s" : ""} &middot;{" "}
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-error transition hover:bg-brand-error/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            )}

            {/* Processing indicator */}
            {processing && (
              <div className="rounded-2xl border border-brand-border bg-brand-card p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
                  <p className="text-sm text-brand-sub">
                    Converting pages... {progress}%
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-bg">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-info transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Page images grid */}
            {pageImages.length > 0 && !processing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-brand-sub">
                    {selectedPages.size} of {pageImages.length} page
                    {pageImages.length !== 1 ? "s" : ""} selected
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-sub transition hover:text-brand-text"
                    >
                      Select all
                    </button>
                    <button
                      onClick={deselectAll}
                      className="rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-sub transition hover:text-brand-text"
                    >
                      Deselect all
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {pageImages.map((img) => (
                    <div
                      key={img.pageNum}
                      className={`group relative cursor-pointer overflow-hidden rounded-xl border transition ${
                        selectedPages.has(img.pageNum)
                          ? "border-brand-purple shadow-lg shadow-brand-purple/10"
                          : "border-brand-border opacity-60"
                      }`}
                      onClick={() => togglePage(img.pageNum)}
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.dataUrl}
                          alt={`Page ${img.pageNum}`}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      {/* Selection indicator */}
                      {selectedPages.has(img.pageNum) && (
                        <div className="absolute right-2 top-2">
                          <CheckCircle2 className="h-5 w-5 text-brand-purple drop-shadow" />
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-brand-border bg-brand-card px-2 py-1.5">
                        <p className="text-[11px] text-brand-muted">
                          Page {img.pageNum}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(img);
                          }}
                          className="rounded p-1 text-brand-muted opacity-0 transition hover:text-brand-text group-hover:opacity-100"
                          title="Download this page"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when no PDF */}
            {!pdfFile && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-border bg-brand-card/30 py-16">
                <ImageIcon className="h-12 w-12 text-brand-muted" />
                <p className="text-sm text-brand-muted">
                  Upload a PDF to convert its pages to images
                </p>
              </div>
            )}
          </div>

          {/* Right: Settings panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-sub">
                Export Settings
              </h2>

              {/* Image Format */}
              <label className="mb-1.5 block text-xs text-brand-muted">
                Image Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ImageFormat)}
                className="mb-4 w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm text-brand-text outline-none transition focus:border-brand-purple"
              >
                <option value="png">PNG (lossless)</option>
                <option value="jpeg">JPEG (smaller file)</option>
                <option value="webp">WebP (modern)</option>
              </select>

              {/* Scale / Quality */}
              <label className="mb-1.5 block text-xs text-brand-muted">
                Resolution Scale
              </label>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value as ScaleOption)}
                className="mb-4 w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm text-brand-text outline-none transition focus:border-brand-purple"
              >
                <option value="1">1x (72 DPI — fast)</option>
                <option value="2">2x (144 DPI — recommended)</option>
                <option value="3">3x (216 DPI — high quality)</option>
                <option value="4">4x (288 DPI — print quality)</option>
              </select>

              {/* Re-render button */}
              {pdfFile && pageImages.length > 0 && !processing && (
                <button
                  onClick={() => handleFileSelect(pdfFile)}
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-sub transition hover:bg-brand-card2 hover:text-brand-text"
                >
                  <Loader2 className="h-4 w-4" />
                  Re-render with new settings
                </button>
              )}

              {/* Download selected */}
              <button
                onClick={downloadSelected}
                disabled={selectedPages.size === 0 || processing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-info px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                Download {selectedPages.size > 0 ? `${selectedPages.size} ` : ""}
                Image{selectedPages.size !== 1 ? "s" : ""}
              </button>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-brand-border bg-brand-surf p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-sub">
                Tips
              </h3>
              <ul className="space-y-1.5 text-xs text-brand-muted">
                <li>&#x2022; Click pages to select/deselect for download</li>
                <li>&#x2022; Hover on a page to download it individually</li>
                <li>&#x2022; Higher scale = better quality but larger files</li>
                <li>
                  &#x2022; PNG is lossless, JPEG/WebP are smaller but lossy
                </li>
                <li>
                  &#x2022; Everything runs in your browser &mdash; private &amp;
                  fast
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
