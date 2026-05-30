import {
  ArrowLeft,
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
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDFJS Worker using local Vite resolution
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
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

  const [activePage, setActivePage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const { accessToken } = useSelector((state) => state.user);
  const [containerWidth, setContainerWidth] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const observerRef = useRef(null);

  const containerRef = (node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
          const width = entries[0].contentRect.width;
          setContainerWidth(Math.max(200, width - 32));
        }
      });
      observer.observe(node);
      observerRef.current = observer;
    }
  };

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    setIsPdfLoading(true);
    setActivePage(1);
    setNumPages(null);
  }, [file?.id]);

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
  const totalPages = mimeGroup === "PDF" && numPages ? numPages : (file?.fileContent?.pageCount || pages.length || 1);
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
    <div className="flex flex-col grow bg-white min-h-0 overflow-y-auto">
      {/* Top Preview Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border-b border-slate-100 gap-4 shrink-0 w-full">
        <div className="flex items-center justify-between sm:justify-start gap-3.5 w-full sm:w-auto min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors outline-none shrink-0"
          >
            <ArrowLeft size={14} /> 
            <span className="hidden xs:inline">Back to files</span>
            <span className="inline xs:hidden">Back</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-slate-400 shrink-0">
              {mimeGroup === "PDF" && (
                <FileText size={18} color="#DC2626" />
              )}
              {mimeGroup === "Text" && (
                <FileText size={18} color="#2563EB" />
              )}
              {mimeGroup === "Word" && (
                <FileText size={18} color="#2563EB" />
              )}
              {mimeGroup === "Excel" && (
                <FileSpreadsheet size={18} className="text-emerald-500" />
              )}
              {mimeGroup === "Image" && (
                <ImageIcon size={18} className="text-cyan-500" />
              )}
              {mimeGroup === "Document" && (
                <File size={18} className="text-slate-500" />
              )}
            </span>
            <h2
              className="text-sm font-bold text-slate-800 truncate max-w-[120px] sm:max-w-xs"
              title={getSafeFileName()}
            >
              {getSafeFileName()}
            </h2>
          </div>
        </div>

        {/* Page / Zoom / Options Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          <div className="flex items-center gap-2 border border-slate-200/80 rounded-xl px-2.5 py-1.5 bg-white text-xs text-slate-650">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="hover:bg-slate-50 border-none bg-transparent cursor-pointer outline-none flex items-center p-0.5"
            >
              <ZoomOut size={14} />
            </button>
            <span className="font-semibold min-w-10 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="hover:bg-slate-50 border-none bg-transparent cursor-pointer outline-none flex items-center p-0.5"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 hidden sm:block" />

          {/* Tools */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => openShareModal(file, e)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer border border-slate-200 hover:border-blue-100 outline-none flex items-center justify-center"
              title="Share"
            >
              <Share2 size={15} />
            </button>
            <button
              onClick={(e) => handleDownload(file, e)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#c62828] hover:text-white transition-all cursor-pointer border border-slate-200 outline-none flex items-center justify-center"
              title="Download"
            >
              <Download size={15} />
            </button>
            <button
              onClick={(e) => {
                handleDelete(file.id, e);
                onBack();
              }}
              className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-all cursor-pointer border border-slate-200 bg-transparent outline-none flex items-center justify-center"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[minmax(0,1.25fr)_360px] gap-5 p-4 sm:p-6 min-h-0 overflow-y-auto items-stretch">
        {/* Left: Interactive Canvas Box */}
        <div className="bg-transparent rounded-3xl p-2 sm:p-3 min-h-[60vh] lg:min-h-[calc(100vh-140px)] flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto self-stretch relative w-full">
          <div
            className="transition-transform duration-200 origin-top max-w-full flex justify-center w-full"
            style={{ transform: mimeGroup === "PDF" ? 'none' : `scale(${zoom / 100})` }}
          >
            {mimeGroup === "Image" ? (
              <img
                src={imageUrl}
                alt={getSafeFileName()}
                className="rounded-2xl object-contain max-h-[60vh] max-w-full shadow-lg border border-slate-800/15"
              />
            ) : mimeGroup === "PDF" ? (
              <div className="bg-slate-100/60 p-2 rounded-2xl shadow-inner overflow-hidden flex flex-row max-w-full w-full min-h-[calc(100vh-180px)] relative">
                {isPdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center p-8 bg-slate-100/60 z-10 rounded-2xl">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-[#c62828] animate-spin" />
                      <span className="text-slate-550 font-semibold">Loading PDF...</span>
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
                    <div className="hidden md:flex flex-col gap-4 border-r border-slate-200 bg-slate-50/50 p-4 w-[112px] shrink-0 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-210px)] items-center">
                      {Array.from(new Array(numPages), (el, index) => (
                        <button
                          key={index}
                          onClick={() => setActivePage(index + 1)}
                          className={`flex flex-col items-center p-1 rounded-xl transition-all border-2 w-18 cursor-pointer focus:outline-none bg-white ${
                            activePage === index + 1
                              ? "border-[#c62828] shadow-xs"
                              : "border-transparent hover:border-slate-300"
                          }`}
                        >
                          <div className="w-full overflow-hidden rounded bg-white flex justify-center pointer-events-none">
                            <Page
                              pageNumber={index + 1}
                              scale={0.08}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                              loading={<div className="h-14 w-10 bg-slate-100 animate-pulse" />}
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
                  <div 
                    ref={containerRef}
                    className="flex-1 overflow-auto p-4 flex items-start justify-center max-h-[calc(100vh-210px)] w-full min-w-0"
                  >
                    <Page
                      pageNumber={activePage}
                      width={containerWidth ? containerWidth * (zoom / 100) : undefined}
                      scale={containerWidth ? undefined : (zoom / 100)}
                      className="shadow-md rounded border border-slate-200 bg-white max-w-full"
                      renderAnnotationLayer={false}
                      renderTextLayer={true}
                    />
                  </div>
                </Document>
              </div>
            ) : (
              /* Word, Txt reader page sheet */
              <div
                className="bg-white shadow-xl border border-slate-200/40 rounded-3xl w-full max-w-[650px] p-5 sm:p-12 flex flex-col justify-between min-h-[500px] sm:min-h-[850px]"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider mb-8">
                    <span className="w-5 h-5 rounded-xs bg-blue-600 flex items-center justify-center text-white text-[9px] font-extrabold">
                      AC
                    </span>
                    Acme Corp
                  </div>

                  <div className="font-sans text-slate-800 text-left leading-relaxed whitespace-pre-line">
                    {file?.fileContent?.content ? (
                      <div className="text-xs md:text-sm">
                        {currentPageContent}
                      </div>
                    ) : (
                      <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                          {getSafeFileName()}
                        </h1>
                        <h3 className="text-sm font-semibold text-blue-600 mb-6">
                          Extracted Document Preview
                        </h3>
                        <p className="text-xs text-slate-550 leading-relaxed">
                          This file does not contain extractable plain text. You
                          can download the file to view its full contents.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-4 text-center font-medium mt-8">
                  Page {activePage} of {totalPages} • Acme Corp Confidential
                </div>
              </div>
            )}
          </div>

          {/* Floating Controls Overlay */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs border border-slate-200 p-2 sm:p-2.5 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-lg z-10 max-w-[90%] justify-center">
            {mimeGroup !== "Image" && (
              <div className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-4 border-r border-slate-200 text-xs sm:text-sm text-slate-650 font-semibold select-none shrink-0">
                <button
                  onClick={() => setActivePage(Math.max(1, activePage - 1))}
                  disabled={activePage === 1}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent border-none bg-transparent cursor-pointer flex items-center"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="shrink-0">
                  {activePage} / {totalPages}
                </span>
                <button
                  onClick={() => setActivePage(Math.min(totalPages, activePage + 1))}
                  disabled={activePage === totalPages}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent border-none bg-transparent cursor-pointer flex items-center"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 border-none bg-transparent cursor-pointer flex items-center"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 border-none bg-transparent cursor-pointer flex items-center"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 border-none bg-transparent cursor-pointer flex items-center"
              title="Fit Screen"
            >
              <Maximize size={16} />
            </button>
          </div>
        </div>

        {/* Right: Sidebar Details Panel */}
        <div className="w-full lg:w-[360px] bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 shadow-xs shrink-0 self-stretch lg:overflow-y-auto flex flex-col">
          {/* File Card info top */}
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl mb-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                mimeGroup === "PDF" 
                  ? "bg-red-50 text-red-600 border-red-100"
                  : mimeGroup === "Excel"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : mimeGroup === "Word" || mimeGroup === "Text"
                  ? "bg-blue-50 text-blue-600 border-blue-100"
                  : "bg-cyan-50 text-cyan-600 border-cyan-100"
              }`}
            >
              {mimeGroup === "PDF" && (
                <FileText size={20} color="#DC2626" />
              )}
              {mimeGroup === "Text" && (
                <FileText size={20} color="#2563EB" />
              )}
              {mimeGroup === "Word" && (
                <FileText size={20} color="#2563EB" />
              )}
              {mimeGroup === "Excel" && (
                <FileSpreadsheet size={20} className="text-emerald-500" />
              )}
              {mimeGroup === "Image" && (
                <File size={20} className="text-slate-500" />
              )}
            </div>
            <div className="flex flex-col truncate">
              <span
                className="text-sm font-bold text-slate-800 truncate"
                title={getSafeFileName()}
              >
                {getSafeFileName()}
              </span>
              <span className="text-xs text-slate-400 font-bold mt-0.5">
                {formatBytes(Number(file?.fileSize))}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 mb-5 text-sm font-bold text-slate-400">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 pb-3 text-center cursor-pointer border-none bg-transparent outline-none
                ${activeTab === "details" ? "text-[#c62828] border-b-2 border-[#c62828]" : "hover:text-slate-700"}
              `}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex-1 pb-3 text-center cursor-pointer border-none bg-transparent outline-none
                ${activeTab === "activity" ? "text-[#c62828] border-b-2 border-[#c62828]" : "hover:text-slate-700"}
              `}
            >
              Activity
            </button>
          </div>

          {activeTab === "details" ? (
            <div className="flex flex-col gap-5 grow">
              {/* Properties */}
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-400">Type</span>
                  <span className="text-slate-700">{mimeGroup} Document</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-400">Size</span>
                  <span className="text-slate-700">
                    {formatBytes(Number(file?.fileSize))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-400">Uploaded</span>
                  <span className="text-slate-700">
                    {formatDateTime(file?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-400">Location</span>
                  <span className="text-slate-700">My Files</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-400">Owner</span>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <div className="w-5.5 h-5.5 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <User size={13} />
                    </div>
                    <span>
                      {file?.owner
                        ? `${file.owner.firstName} ${file.owner.lastName}`
                        : currentUser
                          ? `${currentUser.firstName} ${currentUser.lastName}`
                          : "Alex Johnson"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sharing */}
              <div className="flex flex-col gap-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-800">
                    Sharing
                  </span>
                </div>

                <div className="text-[13px] font-semibold text-slate-400">
                  Shared with {file?.shares ? file.shares.length : 0} people
                </div>

                <div className="flex flex-col gap-4 max-h-56 overflow-y-auto">
                  {file?.shares && file.shares.length > 0 ? (
                    file.shares.map((p, i) => {
                      const isExpired = new Date(p.expiresAt) < new Date();
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 text-sm font-semibold border-b border-slate-50 pb-3 last:border-none last:pb-0"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-7.5 h-7.5 rounded-full border border-slate-200/60 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                              <User size={15} />
                            </div>
                            <div className="flex flex-col truncate">
                              <span className="text-slate-800 text-[13.5px] font-semibold truncate" title={p.recipientEmail}>
                                {p.recipientEmail}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                                {isExpired 
                                  ? `Expired ${formatDateTime(p.expiresAt)}` 
                                  : `Expires ${formatDateTime(p.expiresAt)}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 select-none">
                            {/* Active/Expired badge */}
                            <span
                              className={
                                isExpired
                                  ? "text-slate-500 bg-slate-100 px-2 py-0.5 text-[10px] font-bold rounded-md"
                                  : "text-emerald-700 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold rounded-md"
                              }
                            >
                              {isExpired ? "Expired" : "Active"}
                            </span>
                            {/* Viewed/Pending badge */}
                            {!isExpired && (
                              <span
                                className={
                                  p.openedAt
                                    ? "text-blue-600 bg-blue-50 px-2 py-0.5 text-[10px] font-bold rounded-md"
                                    : "text-amber-600 bg-amber-50/50 px-2 py-0.5 text-[10px] font-bold rounded-md"
                                }
                              >
                                {p.openedAt ? "Viewed" : "Pending"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Not shared with anyone yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Activity timeline list */
            <div className="flex flex-col gap-4 grow">
              <span className="text-sm font-bold text-slate-800">
                Activity Timeline
              </span>
              <div className="flex flex-col gap-5 relative border-l border-slate-100 pl-4 ml-1">
                {activityList.map((act, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 relative text-xs font-semibold"
                  >
                    <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full border-2 border-white bg-blue-500 shadow-xs" />
                    <span className="text-slate-700">{act.desc}</span>
                    <span className="text-slate-400 text-xs">
                      {act.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
