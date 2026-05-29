import {
  ArrowLeft,
  Star,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Maximize,
  Trash2,
  User,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { API_ROOT } from "../../api/axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDFJS Worker using local Vite resolution
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function FilePreview({
  file,
  onBack,
  handleDownload,
  openShareModal,
  handleDelete,
  formatBytes,
  formatTimeAgo,
  currentUser,
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [zoom, setZoom] = useState(100);
  const [starred, setStarred] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const { accessToken } = useSelector((state) => state.user);
  const [containerWidth, setContainerWidth] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsPdfLoading(true);
    setActivePage(1);
    setNumPages(null);
  }, [file?.id]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        // contentRect width does not include padding or scrollbars
        const width = entries[0].contentRect.width;
        // Subtract horizontal padding and vertical scrollbar allowance
        setContainerWidth(Math.max(200, width - 48));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const getSafeFileName = () =>
    file?.originalFileName || file?.fileName || "Untitled";

  const getFileExtensionLabel = () => {
    const fileName = getSafeFileName();
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
  };

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

  const mimeGroup = getFileMimeGroup();
  const imageUrl = file?.cloudinaryUrl?.startsWith("http")
    ? file.cloudinaryUrl
    : `${API_ROOT}/api/files/${file?.id}/download?token=${accessToken}`;

  // Dynamically partition document text to enable page turning
  const getPagesArray = () => {
    const content = file?.fileContent?.content || "";
    if (!content) return [""];
    let pages = content.split(/\f|\[Page Break\]/gi);
    if (pages.length <= 1) {
      // Chunk by 1200 characters per page if there are no explicit page breaks
      const pageSize = 1200;
      pages = [];
      for (let i = 0; i < content.length; i += pageSize) {
        pages.push(content.substring(i, i + pageSize));
      }
    }
    return pages;
  };

  const pages = getPagesArray();
  const totalPages =
    mimeGroup === "PDF" && numPages
      ? numPages
      : file?.fileContent?.pageCount || pages.length || 1;
  const currentPageContent = pages[activePage - 1] || pages[0] || "";

  const activityList = [
    {
      desc: "You uploaded the file",
      date: formatDateTime(file?.createdAt),
    },
  ];
  if (file?.shares) {
    file.shares.forEach((share) => {
      activityList.push({
        desc: `Shared with ${share.recipientEmail}`,
        date: formatDateTime(share.createdAt),
      });
      if (share.openedAt) {
        activityList.push({
          desc: `${share.recipientEmail} viewed the file`,
          date: formatDateTime(share.openedAt),
        });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0b0f19] text-slate-200 overflow-hidden font-sans">
      {/* Top Preview Action Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0f1422]/90 backdrop-blur-md border-b border-[#1e293b]/50 shrink-0 w-full z-15">
        <div className="flex items-center gap-2.5">
          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider select-none">
            {getFileExtensionLabel()}
          </span>
          <h2 className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-md" title={getSafeFileName()}>
            {getSafeFileName()}
          </h2>
        </div>

        {/* Page / Zoom / Options Controls */}
        <div className="flex items-center gap-2.5">
          {/* Zoom Controls Pill */}
          <div className="flex items-center gap-2 bg-[#1e293b]/60 border border-[#334155]/60 rounded-xl px-3 py-1.5 text-xs text-white">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="hover:text-slate-350 border-none bg-transparent cursor-pointer outline-none flex items-center p-0.5"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="font-semibold min-w-10 text-center select-none">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="hover:text-slate-350 border-none bg-transparent cursor-pointer outline-none flex items-center p-0.5"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Download Button */}
          <button
            onClick={(e) => handleDownload(file, e)}
            className="p-2 bg-[#1e293b]/60 border border-[#334155]/60 rounded-xl text-white hover:bg-[#2b394f] transition-all cursor-pointer outline-none flex items-center justify-center"
            title="Download file"
          >
            <Download size={14} />
          </button>

          {/* Close Button */}
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#1e293b]/60 border border-[#334155]/60 rounded-xl text-white hover:bg-[#2b394f] hover:border-slate-500/50 text-xs font-semibold cursor-pointer transition-all outline-none"
          >
            Close
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_320px] min-h-0 items-stretch relative">
        
        {/* Ambient backdrop for image previews */}
        {mimeGroup === "Image" && (
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.12] filter blur-[60px] scale-[1.2] transition-all duration-300 z-0"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}

        {/* Left: Interactive Canvas Box */}
        <div className="relative flex-1 flex flex-col items-center justify-center p-6 min-h-0 overflow-auto z-10">
          <div
            className="transition-transform duration-200 origin-center max-w-full flex justify-center items-center"
            style={{
              transform: mimeGroup === "PDF" ? "none" : `scale(${zoom / 100})`,
            }}
          >
            {mimeGroup === "Image" ? (
              <img
                src={imageUrl}
                alt={getSafeFileName()}
                className="rounded-2xl object-contain max-h-[70vh] max-w-full shadow-2xl border border-slate-900/60"
              />
            ) : mimeGroup === "PDF" ? (
              <div className="bg-[#0f1422] p-2 rounded-2xl shadow-2xl overflow-hidden flex flex-row max-w-full w-full min-h-[calc(100vh-160px)] relative border border-[#1e293b]/30">
                {isPdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center p-8 bg-[#0f1422]/95 z-10 rounded-2xl">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-8 h-8 rounded-full border-3 border-[#1e293b] border-t-[#c62828] animate-spin" />
                      <span className="text-slate-400 font-semibold">
                        Loading PDF...
                      </span>
                    </div>
                  </div>
                )}
                <Document
                  file={`${API_ROOT}/api/files/${file?.id}/download?token=${accessToken}`}
                  onLoadSuccess={({ numPages }) => {
                    setNumPages(numPages);
                    setIsPdfLoading(false);
                  }}
                  onLoadError={() => setIsPdfLoading(false)}
                  loading={null}
                  error={
                    <div className="flex-1 w-full min-h-[calc(100vh-300px)] flex items-center justify-center p-8 text-red-500 font-medium text-center z-10">
                      Failed to load PDF file.
                    </div>
                  }
                  className="flex-1 flex min-h-0 w-full"
                >
                  {/* PDF Thumbnails panel inside Document wrapper */}
                  {numPages > 0 && (
                    <div className="hidden md:flex flex-col gap-4 border-r border-[#1e293b]/40 bg-[#070b13]/55 p-4 w-[112px] shrink-0 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-180px)] items-center">
                      {Array.from(new Array(numPages), (el, index) => (
                        <button
                          key={index}
                          onClick={() => setActivePage(index + 1)}
                          className={`flex flex-col items-center p-1 rounded-xl transition-all border-2 w-18 cursor-pointer focus:outline-none bg-[#111625] ${
                            activePage === index + 1
                              ? "border-[#c62828] shadow-xs"
                              : "border-transparent hover:border-[#1e293b]"
                          }`}
                        >
                          <div className="w-full overflow-hidden rounded bg-white flex justify-center pointer-events-none">
                            <Page
                              pageNumber={index + 1}
                              scale={0.08}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                              loading={
                                <div className="h-14 w-10 bg-slate-800 animate-pulse" />
                              }
                            />
                          </div>
                          <span
                            className={`text-[9px] mt-1 font-bold ${
                              activePage === index + 1
                                ? "text-[#c62828]"
                                : "text-slate-400"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main PDF Page Display Canvas */}
                  <div
                    ref={containerRef}
                    className="flex-1 overflow-auto p-4 flex items-start justify-center max-h-[calc(100vh-180px)] w-full"
                  >
                    <Page
                      pageNumber={activePage}
                      width={
                        containerWidth
                          ? containerWidth * (zoom / 100)
                          : undefined
                      }
                      scale={containerWidth ? undefined : zoom / 100}
                      className="shadow-md rounded border border-[#1e293b]/55 bg-white max-w-full"
                      renderAnnotationLayer={false}
                      renderTextLayer={true}
                    />
                  </div>
                </Document>
              </div>
            ) : (
              /* Word, Txt reader page sheet */
              <div className="bg-[#171e30] border border-[#27334f]/50 rounded-3xl w-full max-w-[700px] p-6 sm:p-12 flex flex-col justify-between min-h-[500px] sm:min-h-[850px] shadow-2xl text-slate-200">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8">
                    <span className="w-5 h-5 rounded-xs bg-blue-500 flex items-center justify-center text-white text-[9px] font-extrabold">
                      AC
                    </span>
                    Acme Corp
                  </div>

                  <div className="font-sans text-slate-250 text-left leading-relaxed whitespace-pre-line">
                    {file?.fileContent?.content ? (
                      <div className="text-xs md:text-sm">
                        {currentPageContent}
                      </div>
                    ) : (
                      <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                          {getSafeFileName()}
                        </h1>
                        <h3 className="text-sm font-semibold text-blue-400 mb-6">
                          Extracted Document Preview
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          This file does not contain extractable plain text. You
                          can download the file to view its full contents.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 border-t border-[#1e293b]/50 pt-4 text-center font-medium mt-8">
                  Page {activePage} of {totalPages} • Acme Corp Confidential
                </div>
              </div>
            )}
          </div>

          {/* Floating Controls Overlay */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#0f1422]/90 backdrop-blur-md border border-[#1e293b]/50 p-2 rounded-2xl flex items-center gap-3 shadow-xl z-20 max-w-[90%] justify-center text-white">
            {mimeGroup !== "Image" && (
              <div className="flex items-center gap-2 pr-3 border-r border-[#1e293b] text-xs text-slate-350 font-semibold select-none shrink-0">
                <button
                  onClick={() => setActivePage(Math.max(1, activePage - 1))}
                  disabled={activePage === 1}
                  className="p-1 hover:bg-[#1e293b] rounded-lg text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent border-none bg-transparent cursor-pointer flex items-center"
                  title="Previous Page"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="shrink-0 font-bold">
                  {activePage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setActivePage(Math.min(totalPages, activePage + 1))
                  }
                  disabled={activePage === totalPages}
                  className="p-1 hover:bg-[#1e293b] rounded-lg text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent border-none bg-transparent cursor-pointer flex items-center"
                  title="Next Page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}

            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1.5 hover:bg-[#1e293b] rounded-lg text-slate-300 border-none bg-transparent cursor-pointer flex items-center"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1.5 hover:bg-[#1e293b] rounded-lg text-slate-300 border-none bg-transparent cursor-pointer flex items-center"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1.5 hover:bg-[#1e293b] rounded-lg text-slate-300 border-none bg-transparent cursor-pointer flex items-center"
              title="Fit Screen"
            >
              <Maximize size={15} />
            </button>
          </div>
        </div>

        {/* Right: Sidebar Details Panel */}
        <div className="w-full lg:w-[320px] bg-[#0c101d] border-l border-[#1e293b]/50 p-6 shrink-0 self-stretch lg:overflow-y-auto flex flex-col gap-6 text-slate-300 z-10 shadow-xl">
          <div>
            <h3 className="text-[13px] font-bold text-slate-400 tracking-wider uppercase mb-3">
              File details
            </h3>

            {/* File Card Info Top */}
            <div className="flex items-center gap-3.5 p-3.5 bg-[#171e30] border border-[#27334f]/50 rounded-2xl mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1e293b] text-blue-400 shrink-0">
                {mimeGroup === "PDF" && <FileText size={18} />}
                {mimeGroup === "Text" && <FileText size={18} />}
                {mimeGroup === "Word" && <FileText size={18} />}
                {mimeGroup === "Excel" && <FileSpreadsheet size={18} />}
                {mimeGroup === "Image" && <ImageIcon size={18} />}
                {mimeGroup === "Document" && <File size={18} />}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[13.5px] font-bold text-white truncate" title={getSafeFileName()}>
                  {getSafeFileName()}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  {formatBytes(Number(file?.fileSize))}
                </span>
              </div>
            </div>

            {/* Metadata Table */}
            <div className="flex flex-col gap-4 border-b border-[#1e293b]/55 pb-5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Name</span>
                <span className="text-slate-200 truncate max-w-[160px] text-right" title={getSafeFileName()}>
                  {getSafeFileName()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Type</span>
                <span className="text-slate-200 text-right">{mimeGroup} Document</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Size</span>
                <span className="text-slate-200 text-right">{formatBytes(Number(file?.fileSize))}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Shared by</span>
                <span className="text-slate-200 text-right truncate max-w-[160px]" title={file?.owner?.email || currentUser?.email || "john@mail.com"}>
                  {file?.owner?.email || currentUser?.email || "john@mail.com"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Shared on</span>
                <span className="text-slate-200 text-right">{formatDateTime(file?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="flex flex-col gap-3 mt-auto">
            <h3 className="text-[13px] font-bold text-slate-400 tracking-wider uppercase mb-1">
              Actions
            </h3>
            
            <button
              onClick={(e) => handleDownload(file, e)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1e293b] hover:bg-[#2b394f] text-white border border-[#334155]/60 hover:border-slate-400/80 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer outline-none"
            >
              <Download size={14} />
              <span>Download file</span>
            </button>
            
            <button
              onClick={() => setZoom(100)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-transparent hover:bg-[#171e30] text-slate-350 border border-transparent rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer outline-none"
            >
              <Maximize size={14} />
              <span>View full screen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
