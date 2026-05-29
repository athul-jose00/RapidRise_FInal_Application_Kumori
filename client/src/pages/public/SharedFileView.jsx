import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  File,
  Download,
  Maximize,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { API_ROOT } from "../../api/axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDFJS Worker using local Vite resolution
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function SharedFileView({ token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [share, setShare] = useState(null);

  // PDF & Document Viewer States
  const [activePage, setActivePage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [timeLeft, setTimeLeft] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [isFullscreenPdfLoading, setIsFullscreenPdfLoading] = useState(true);

  useEffect(() => {
    setIsPdfLoading(true);
    setIsFullscreenPdfLoading(true);
    setActivePage(1);
    setNumPages(null);
  }, [file?.id]);

  useEffect(() => {
    if (isFullscreen) {
      setIsFullscreenPdfLoading(true);
    }
  }, [isFullscreen]);

  // Fetch shared file details on load
  useEffect(() => {
    if (!token) {
      setError("No token provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get(`${API_ROOT}/public/share/${token}`)
      .then((res) => {
        setFile(res.data.file);
        setShare(res.data.share);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch share failed:", err);
        setError(err.response?.data?.message || "Invalid or expired link");
        setLoading(false);
      });
  }, [token]);

  // Countdown timer for link expiration
  useEffect(() => {
    if (!share?.expiresAt) return;

    const interval = setInterval(() => {
      const diff = +new Date(share.expiresAt) - +new Date();
      if (diff <= 0) {
        setError("Link expired");
        clearInterval(interval);
      } else {
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        let text = "";
        if (days > 0) text += `${days}d `;
        if (hours > 0) text += `${hours}h `;
        if (minutes > 0) text += `${minutes}m `;
        text += `${seconds}s`;

        setTimeLeft(text);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [share?.expiresAt]);

  const getSafeFileName = () =>
    file?.originalFileName || file?.fileName || "Untitled";

  const getFileMimeGroup = () => {
    const mime = (file?.mimeType || "").toLowerCase();
    const name = getSafeFileName().toLowerCase();

    if (mime.includes("pdf") || name.endsWith(".pdf")) return "PDF";
    if (mime.includes("text") || name.endsWith(".txt")) return "Text";
    if (
      mime.includes("word") ||
      mime.includes("officedocument.wordprocessingml") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    )
      return "Word";
    if (
      mime.includes("excel") ||
      mime.includes("officedocument.spreadsheetml") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx")
    )
      return "Excel";
    if (
      mime.includes("image/") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".gif") ||
      name.endsWith(".webp")
    )
      return "Image";
    return "Document";
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return (
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      ", " +
      d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const handleDownload = () => {
    if (!token) return;
    toast.info("Preparing download...");
    axios
      .get(`${API_ROOT}/public/share/${token}/download`, {
        responseType: "blob",
      })
      .then((res) => {
        const disposition = res.headers?.["content-disposition"] || "";
        const match = disposition.match(/filename="?([^";]+)"?/i);
        const filename = match?.[1] || getSafeFileName();
        const blob = new Blob([res.data], {
          type: res.data.type || file?.mimeType || "application/octet-stream",
        });

        if (window.showSaveFilePicker) {
          window
            .showSaveFilePicker({
              suggestedName: filename,
            })
            .then((handle) => handle.createWritable())
            .then(async (writable) => {
              await writable.write(blob);
              await writable.close();
              toast.success("Download started!");
            })
            .catch((pickerError) => {
              if (pickerError?.name !== "AbortError") {
                console.error("Save picker failed:", pickerError);
                toast.error("Download failed. Please try again.");
              }
            });
          return;
        }

        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        toast.success("Download started!");
      })
      .catch((err) => {
        console.error("Download failed:", err);
        toast.error("Download failed. Please try again.");
      });
  };

  // Render file group type icon helper
  const renderFileIcon = (group, size = 20) => {
    switch (group) {
      case "PDF":
        return <FileText size={size} className="text-[#DC2626]" />;
      case "Text":
      case "Word":
        return <FileText size={size} className="text-[#2563EB]" />;
      case "Excel":
        return <FileSpreadsheet size={size} className="text-emerald-500" />;
      case "Image":
        return <ImageIcon size={size} className="text-cyan-500" />;
      default:
        return <File size={size} className="text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#c62828] animate-spin" />
          <h2 className="text-slate-650 font-bold text-base">Retrieving secure shared file...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    const isRevoked = error.toLowerCase().includes("revoked");
    const isExpired = error.toLowerCase().includes("expired");

    let title = "Invalid Link";
    let description = "This share link is invalid. Please verify you copied the link correctly.";

    if (isRevoked) {
      title = "Link Revoked";
      description = "This secure share link has been revoked by the owner. Please request a new link if you still need access.";
    } else if (isExpired) {
      title = "Link Expired";
      description = "This secure share link has expired. Please contact the file owner to request a new link.";
    }

    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-155 rounded-3xl p-8 shadow-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-650 mx-auto mb-6">
            <Clock size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            {description}
          </p>
          <a
            href="/"
            className="inline-block mt-8 px-6 py-3 bg-[#c62828] hover:bg-[#b71c1c] text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
          >
            Go to Kumori Home
          </a>
        </div>
      </div>
    );
  }

  const mimeGroup = getFileMimeGroup();
  const pdfUrl = `${API_ROOT}/public/share/${token}/download?inline=true`;
  const imageUrl = `${API_ROOT}/public/share/${token}/download?inline=true`;

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* 1. Header Area */}
      <header className="h-[70px] bg-white/70 backdrop-blur-md border-b border-slate-200/40 flex items-center justify-between px-6 shrink-0 shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img
            src="/mascot.png"
            alt="Kumori Mascot"
            className="w-10 h-10 object-contain shrink-0"
          />
          <span className="text-2xl font-extrabold text-[#c62828] tracking-tight">
            Kumori
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/50 bg-white/40 backdrop-blur-xs text-[11px] font-bold text-slate-650 select-none">
          <ShieldCheck size={14} className="text-emerald-500" />
          Secure file sharing
        </div>
      </header>

      {/* 2. Main Container */}
      <main className="flex-1 w-full max-w-[1340px] mx-auto px-6 py-6 flex flex-col gap-6">
        
        {/* Top Expiring Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-xs gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50/80 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                A file has been shared with you
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                You can view and download the file below. This link will expire in{" "}
                {timeLeft || "soon"}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-slate-200/40 rounded-2xl px-4 py-2.5 bg-slate-100/30 backdrop-blur-xs">
            <Clock size={16} className="text-slate-400" />
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                Expires in
              </span>
              <span className="text-sm font-extrabold text-emerald-600">
                {timeLeft || "0s"}
              </span>
            </div>
          </div>
        </div>

        {/* Inner layout split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          
          {/* Left panel: File viewer */}
          <div className="bg-white/60 backdrop-blur-md border border-slate-200/40 rounded-3xl shadow-xs overflow-hidden flex flex-col self-stretch min-h-[600px] lg:min-h-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-150/65 bg-white select-none shrink-0 gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border font-extrabold text-[10px] shrink-0 ${
                    mimeGroup === "PDF"
                      ? "bg-red-50 text-[#DC2626] border-red-100"
                      : mimeGroup === "Excel"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-blue-50 text-blue-600 border-blue-100"
                  }`}
                >
                  {mimeGroup === "PDF"
                    ? "PDF"
                    : mimeGroup === "Excel"
                      ? "XLS"
                      : mimeGroup === "Image"
                        ? "IMG"
                        : "DOC"}
                </div>
                <span
                  className="text-xs font-bold text-slate-800 truncate max-w-[160px] sm:max-w-xs md:max-w-md"
                  title={getSafeFileName()}
                >
                  {getSafeFileName()}
                </span>
              </div>

              {/* Page navigate controls for PDF */}
              {mimeGroup === "PDF" && numPages && (
                <div className="flex items-center gap-3 text-xs text-slate-650 font-bold">
                  <button
                    onClick={() => setActivePage(Math.max(1, activePage - 1))}
                    disabled={activePage === 1}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 border border-slate-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer flex items-center transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span>
                    {activePage} / {numPages}
                  </span>
                  <button
                    onClick={() => setActivePage(Math.min(numPages, activePage + 1))}
                    disabled={activePage === numPages}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 border border-slate-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer flex items-center transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* Zoom & Download */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-[11px] text-slate-600 font-bold">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="hover:bg-slate-50 border-none bg-transparent cursor-pointer outline-none flex items-center p-0.5"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="font-semibold min-w-8 text-center">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    className="hover:bg-slate-50 border-none bg-transparent cursor-pointer outline-none flex items-center p-0.5"
                  >
                    <ZoomIn size={13} />
                  </button>
                </div>

                <button
                  onClick={handleDownload}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#c62828] hover:text-white transition-all cursor-pointer border border-slate-200 outline-none flex items-center justify-center"
                  title="Download File"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>

            {/* Viewer area containing thumbnails list & canvas */}
            <div className="flex-1 flex min-h-0 bg-slate-50/20 relative">
              {mimeGroup === "PDF" && isPdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center p-8 bg-slate-50/50 z-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-[#c62828] animate-spin" />
                    <span className="text-slate-550 font-semibold">Loading PDF preview...</span>
                  </div>
                </div>
              )}
              {mimeGroup === "PDF" ? (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={({ numPages }) => {
                    setNumPages(numPages);
                    setIsPdfLoading(false);
                  }}
                  onLoadError={() => setIsPdfLoading(false)}
                  loading={null}
                  error={
                    <div className="flex-1 flex items-center justify-center p-8 text-red-500 font-medium z-10">
                      Failed to load PDF.
                    </div>
                  }
                  className="flex-1 flex min-h-0 w-full"
                >
                  {/* PDF Thumbnails panel inside Document wrapper */}
                  {numPages > 0 && (
                    <div className="hidden md:flex flex-col gap-4 border-r border-slate-150/70 bg-slate-50/65 p-4 w-[130px] shrink-0 overflow-y-auto max-h-[82vh] items-center">
                      {Array.from(new Array(numPages), (el, index) => (
                        <button
                          key={index}
                          onClick={() => setActivePage(index + 1)}
                          className={`flex flex-col items-center p-1 rounded-xl transition-all border-2 w-20 cursor-pointer focus:outline-none bg-white ${
                            activePage === index + 1
                              ? "border-[#c62828] shadow-xs"
                              : "border-transparent hover:border-slate-300"
                          }`}
                        >
                          <div className="w-full overflow-hidden rounded bg-white flex justify-center pointer-events-none">
                            <Page
                              pageNumber={index + 1}
                              scale={0.1}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                              loading={<div className="h-16 w-12 bg-slate-100 animate-pulse" />}
                            />
                          </div>
                          <span
                            className={`text-[9px] mt-1 font-bold ${
                              activePage === index + 1 ? "text-[#c62828]" : "text-slate-500"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main PDF Page Display Canvas */}
                  <div className="flex-1 overflow-auto p-8 flex items-start justify-center max-h-[82vh]">
                    <div className="bg-slate-100/60 p-4 rounded-2xl shadow-inner overflow-hidden flex flex-col items-center max-w-full">
                      <Page
                        pageNumber={activePage}
                        scale={zoom / 100}
                        className="shadow-md rounded border border-slate-200"
                        renderAnnotationLayer={false}
                        renderTextLayer={true}
                      />
                    </div>
                  </div>
                </Document>
              ) : (
                /* Other mime types (Image, word, excel, text, etc.) */
                <div className="flex-1 overflow-auto p-8 flex items-start justify-center max-h-[82vh]">
                  <div
                    className="transition-transform duration-200 origin-top max-w-full flex justify-center"
                    style={{ transform: `scale(${zoom / 100})` }}
                  >
                    {mimeGroup === "Image" ? (
                      <img
                        src={imageUrl}
                        alt={getSafeFileName()}
                        className="rounded-2xl object-contain max-h-[65vh] max-w-full shadow-md border border-slate-800/10"
                      />
                    ) : (
                      /* General document default text sheet */
                      <div
                        className="bg-white shadow-lg border border-slate-200/50 rounded-2xl p-12 flex flex-col justify-between"
                        style={{ width: "650px", minHeight: "800px" }}
                      >
                        <div className="font-sans text-slate-800 text-left leading-relaxed whitespace-pre-line text-sm">
                          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                            {getSafeFileName()}
                          </h1>
                          <h3 className="text-sm font-semibold text-blue-600 mb-6">
                            Secure Shared File
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            This file cannot be previewed in the browser. You can
                            download the file directly using the actions on the
                            right.
                          </p>
                        </div>
                        <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-4 text-center font-medium">
                          Kumori Shared File Link
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Details and Actions */}
          <div className="flex flex-col gap-6 w-full lg:w-[360px] shrink-0">
            {/* Card 1: File details */}
            <div className="bg-white/60 backdrop-blur-md border border-slate-200/40 rounded-3xl p-6 shadow-xs flex flex-col gap-5">
              <h4 className="text-sm font-extrabold text-slate-800">
                File details
              </h4>

              {/* File type icon & Name header */}
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-100/30 border border-slate-200/30 rounded-2xl">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                    mimeGroup === "PDF"
                      ? "bg-red-50 border-red-100"
                      : mimeGroup === "Excel"
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-blue-50 border-blue-100"
                  }`}
                >
                  {renderFileIcon(mimeGroup, 20)}
                </div>
                <div className="flex flex-col truncate">
                  <span
                    className="text-xs font-bold text-slate-800 truncate"
                    title={getSafeFileName()}
                  >
                    {getSafeFileName()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {formatBytes(Number(file?.fileSize))}
                  </span>
                </div>
              </div>

              {/* Metadata rows */}
              <div className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Name</span>
                  <span
                    className="text-slate-700 truncate max-w-[200px]"
                    title={getSafeFileName()}
                  >
                    {getSafeFileName()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="text-slate-700">{mimeGroup} Document</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Size</span>
                  <span className="text-slate-700">
                    {formatBytes(Number(file?.fileSize))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Shared by</span>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <div className="w-5 h-5 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <User size={12} />
                    </div>
                    <span>{share?.owner?.email || "alexjohnson@kumori.ai"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Shared on</span>
                  <span className="text-slate-700">
                    {formatDateTime(share?.createdAt || new Date())}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Actions */}
            <div className="bg-white/60 backdrop-blur-md border border-slate-200/40 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
              <h4 className="text-sm font-extrabold text-slate-800">
                Actions
              </h4>

              <button
                onClick={handleDownload}
                className="w-full bg-[#c62828] hover:bg-[#b71c1c] text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors border-none"
              >
                <Download size={14} />
                Download file
              </button>

              <button
                onClick={() => setIsFullscreen(true)}
                className="w-full bg-white/40 hover:bg-slate-50/75 text-slate-700 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors border border-slate-200/50 backdrop-blur-xs"
              >
                <Maximize size={14} />
                View full screen
              </button>
            </div>

            {/* Card 3: Security Badge */}
            <div className="bg-[#eff6ff]/40 backdrop-blur-md border border-blue-200/30 rounded-3xl p-5 flex items-start gap-3.5 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#dbeafe]/70 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="flex flex-col">
                <h5 className="text-[11px] font-extrabold text-slate-800">
                  This link is secure
                </h5>
                <p className="text-[10px] text-slate-455 mt-1 leading-relaxed">
                  Only the person with this link can view this file.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="py-6 bg-[#f8fafc] text-center shrink-0 border-t border-slate-150/40 mt-12">
        <span className="text-[10px] font-medium text-slate-400">
          © 2026 Kumori. All rights reserved.
        </span>
      </footer>

      {/* 4. Fullscreen Overlay component */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/96 flex flex-col p-4">
          {/* Header toolbar */}
          <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-4 text-white">
            <span className="font-bold text-xs truncate max-w-xs sm:max-w-md">
              {getSafeFileName()}
            </span>
            <div className="flex items-center gap-4">
              {mimeGroup === "PDF" && numPages && (
                <div className="flex items-center gap-3 text-xs font-bold">
                  <button
                    onClick={() => setActivePage(Math.max(1, activePage - 1))}
                    disabled={activePage === 1}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white border border-white/20 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer flex items-center"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span>
                    {activePage} / {numPages}
                  </span>
                  <button
                    onClick={() => setActivePage(Math.min(numPages, activePage + 1))}
                    disabled={activePage === numPages}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white border border-white/20 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer flex items-center"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 border border-white/20 rounded-xl px-2 py-1 bg-white/5 text-[11px]">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="hover:bg-white/10 border-none bg-transparent cursor-pointer outline-none flex items-center p-0.5 text-white"
                >
                  <ZoomOut size={12} />
                </button>
                <span className="font-semibold min-w-8 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="hover:bg-white/10 border-none bg-transparent cursor-pointer outline-none flex items-center p-0.5 text-white"
                >
                  <ZoomIn size={12} />
                </button>
              </div>
              <button
                onClick={handleDownload}
                className="p-2 rounded-xl bg-white/10 text-white hover:bg-[#c62828] transition-all cursor-pointer border border-white/25 outline-none flex items-center justify-center"
              >
                <Download size={14} />
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 rounded-xl bg-red-650 hover:bg-red-750 text-white font-bold text-xs transition-colors cursor-pointer border-none"
              >
                Close
              </button>
            </div>
          </div>

          {/* Fullscreen Document container */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-4">
            {mimeGroup === "Image" ? (
              <div
                className="transition-transform duration-200 origin-top max-w-full flex justify-center"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                <img
                  src={imageUrl}
                  alt={getSafeFileName()}
                  className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-lg border border-slate-800/15"
                />
              </div>
            ) : (
              <div
                className="transition-transform duration-200 origin-top max-w-full flex justify-center bg-white rounded-2xl shadow-xl overflow-hidden p-6"
                style={{ transform: mimeGroup === "PDF" ? "none" : `scale(${zoom / 100})` }}
              >
                {mimeGroup === "PDF" ? (
                  <div className="bg-slate-100 p-2 rounded-xl relative min-w-[280px] min-h-[360px] flex items-center justify-center">
                    {isFullscreenPdfLoading && (
                      <div className="absolute inset-0 flex items-center justify-center p-8 bg-slate-100/90 z-10 rounded-xl">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="w-8 h-8 rounded-full border-3 border-slate-300 border-t-[#c62828] animate-spin" />
                          <span className="text-slate-600 font-semibold text-xs">Loading PDF...</span>
                        </div>
                      </div>
                    )}
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={({ numPages }) => {
                        setNumPages(numPages);
                        setIsFullscreenPdfLoading(false);
                      }}
                      onLoadError={() => setIsFullscreenPdfLoading(false)}
                      loading={null}
                    >
                      <Page
                        pageNumber={activePage}
                        scale={(zoom / 100) * 1.3}
                        className="shadow-md rounded border border-slate-200"
                        renderAnnotationLayer={false}
                        renderTextLayer={true}
                      />
                    </Document>
                  </div>
                ) : (
                  /* General Document placeholder */
                  <div
                    className="bg-white p-12 text-slate-800 font-sans text-xs leading-relaxed whitespace-pre-line text-left"
                    style={{ width: "650px", minHeight: "800px" }}
                  >
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                      {getSafeFileName()}
                    </h1>
                    <h3 className="text-sm font-semibold text-blue-600 mb-6">
                      Secure Shared File
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      This file cannot be previewed in fullscreen. You can download
                      the file to view its full contents.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
