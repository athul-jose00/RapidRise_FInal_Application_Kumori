import { useState, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Sparkles,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Presentation,
  Archive,
} from "lucide-react";
import api, { API_ROOT } from "../../api/axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function SearchResults({
  query,
  onFileClick,
  formatBytes,
  formatTimeAgo,
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const { accessToken } = useSelector((state) => state.user);

  useEffect(() => {
    if (!query || !query.trim()) {
      setResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.files || []);
      } catch (err) {
        console.error("Search failed:", err);
        toast.error("Failed to perform search");
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      void fetchSearchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // File type icon resolver
  const getFileIcon = (mimeType, fileName = "") => {
    const mime = (mimeType || "").toLowerCase();
    const name = fileName.toLowerCase();

    if (mime.includes("pdf") || name.endsWith(".pdf")) {
      return (
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-600">
          <FileText size={18} />
        </div>
      );
    }
    if (
      mime.includes("word") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    ) {
      return (
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
          <FileText size={18} />
        </div>
      );
    }
    if (
      mime.includes("excel") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx")
    ) {
      return (
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
          <FileSpreadsheet size={18} />
        </div>
      );
    }
    if (
      mime.includes("powerpoint") ||
      name.endsWith(".ppt") ||
      name.endsWith(".pptx")
    ) {
      return (
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-orange-50 text-orange-600">
          <Presentation size={18} />
        </div>
      );
    }
    if (
      mime.includes("image/") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".gif") ||
      name.endsWith(".webp")
    ) {
      return (
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-cyan-50 text-cyan-600">
          <ImageIcon size={18} />
        </div>
      );
    }
    if (
      mime.includes("zip") ||
      mime.includes("tar") ||
      mime.includes("rar") ||
      name.endsWith(".zip") ||
      name.endsWith(".rar") ||
      name.endsWith(".7z")
    ) {
      return (
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-600">
          <Archive size={18} />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 text-slate-500">
        <File size={18} />
      </div>
    );
  };

  const highlightText = (text, highlight) => {
    if (!text || !highlight) return text || "";
    const cleanHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special chars
    const parts = text.split(new RegExp(`(${cleanHighlight})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark
          key={index}
          className="bg-yellow-200/90 text-slate-900 font-bold px-1 rounded-sm"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  // Classify results
  const isImageFile = (file) => {
    const mime = (file.mimeType || "").toLowerCase();
    const name = (file.originalFileName || "").toLowerCase();
    return (
      mime.includes("image/") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".gif") ||
      name.endsWith(".webp")
    );
  };

  const images = results.filter(isImageFile);
  const docFiles = results.filter((f) => !isImageFile(f));
  const contentMatches = results.filter((f) =>
    f.matches?.some((m) => m.type === "content"),
  );

  const filteredResults = () => {
    if (activeFilter === "files") return docFiles;
    if (activeFilter === "images") return images;
    if (activeFilter === "content") return contentMatches;
    return results;
  };

  const currentDisplayResults = filteredResults();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#c62828] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Searching your workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col grow p-1 bg-white min-h-0">
      {/* Title Header */}
      <div className="mb-6 text-left">
        <h1 className="text-2xl font-bold text-slate-800">
          Search results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {results.length} results found across your files (including content inside files)
        </p>
      </div>

      {/* Filter Tabs & Options */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none
              ${
                activeFilter === "all"
                  ? "bg-red-50 text-[#c62828]"
                  : "bg-slate-50 text-slate-650 hover:bg-slate-100"
              }
            `}
          >
            All Results ({results.length})
          </button>
          <button
            onClick={() => setActiveFilter("files")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none
              ${
                activeFilter === "files"
                  ? "bg-red-50 text-[#c62828]"
                  : "bg-slate-50 text-slate-650 hover:bg-slate-100"
              }
            `}
          >
            Files ({docFiles.length})
          </button>
          <button
            onClick={() => setActiveFilter("images")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none
              ${
                activeFilter === "images"
                  ? "bg-red-50 text-[#c62828]"
                  : "bg-slate-50 text-slate-650 hover:bg-slate-100"
              }
            `}
          >
            Images ({images.length})
          </button>
          <button
            onClick={() => setActiveFilter("content")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none
              ${
                activeFilter === "content"
                  ? "bg-red-50 text-[#c62828]"
                  : "bg-slate-50 text-slate-650 hover:bg-slate-100"
              }
            `}
          >
            Content Matches ({contentMatches.length})
          </button>
        </div>

        <button className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5 outline-none">
          <Filter size={13} />
          <span>Filters</span>
          <ChevronDown size={12} className="text-slate-400" />
        </button>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-450 border border-slate-100 rounded-3xl">
          <div className="w-14 h-14 bg-slate-50 text-slate-350 rounded-full flex items-center justify-center mb-4">
            <File size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No results found</h3>
          <p className="text-xs text-slate-400 max-w-sm text-center">
            We couldn&rsquo;t find anything matching &ldquo;{query}&rdquo;. Make sure everything is spelled correctly or try using other keywords.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Images Section */}
          {(activeFilter === "all" || activeFilter === "images") && images.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Images ({images.length})
                </h3>
                {activeFilter === "all" && (
                  <button
                    onClick={() => setActiveFilter("images")}
                    className="text-xs font-bold text-[#c62828] hover:text-[#b71c1c] bg-transparent border-none cursor-pointer p-0"
                  >
                    View all images
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4">
                {images.slice(0, activeFilter === "all" ? 4 : undefined).map((img) => {
                  const url = img?.cloudinaryUrl?.startsWith("http") 
                    ? img.cloudinaryUrl 
                    : `${API_ROOT}/api/files/${img.id}/download?token=${accessToken}`;
                  return (
                    <div
                      key={img.id}
                      onClick={() => onFileClick(img)}
                      className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 cursor-pointer hover:shadow-md transition-shadow group flex flex-col"
                    >
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 relative mb-3">
                        <img
                          src={url}
                          alt={img.originalFileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/40 backdrop-blur-xs flex items-center justify-center text-white">
                          <ImageIcon size={14} />
                        </div>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 truncate" title={img.originalFileName}>
                          {img.originalFileName}
                        </span>
                        <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold mt-1">
                          <span>
                            {formatBytes(img.fileSize)} &bull; {img.mimeType?.split("/")[1]?.toUpperCase() || "IMG"}
                          </span>
                          <span>{formatTimeAgo(img.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files Section */}
          {(activeFilter === "all" || activeFilter === "files") && docFiles.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Files ({docFiles.length})
                </h3>
                {activeFilter === "all" && (
                  <button
                    onClick={() => setActiveFilter("files")}
                    className="text-xs font-bold text-[#c62828] hover:text-[#b71c1c] bg-transparent border-none cursor-pointer p-0"
                  >
                    View all files
                  </button>
                )}
              </div>
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-450 uppercase tracking-wider">
                      <th className="py-3 px-5">Name</th>
                      <th className="py-3 px-4">Matched in</th>
                      <th className="py-3 px-4 w-[50%]">Snippet</th>
                      <th className="py-3 px-4">Modified</th>
                      <th className="py-3 px-4 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                    {docFiles
                      .slice(0, activeFilter === "all" ? 5 : undefined)
                      .map((item) => {
                        const firstMatch = item.matches?.[0];
                        const matchInLabel =
                          firstMatch?.type === "fileName"
                            ? "Filename"
                            : firstMatch?.type === "content"
                              ? `Page ${firstMatch.pageNumber || 1}`
                              : firstMatch?.type === "caption"
                                ? "Caption"
                                : firstMatch?.type === "label"
                                  ? "Tag"
                                  : "Content";

                        const snippet =
                          firstMatch?.type === "content"
                            ? firstMatch.context
                            : firstMatch?.type === "caption"
                              ? firstMatch.context
                              : item.originalFileName;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => onFileClick(item)}
                            className="hover:bg-slate-50/40 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3 font-semibold text-slate-800">
                                {getFileIcon(item.mimeType, item.originalFileName)}
                                <span className="truncate max-w-[200px] text-[13px] font-semibold">
                                  {item.originalFileName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-450">
                              {matchInLabel}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate font-medium">
                              &ldquo;{highlightText(snippet, query)}&rdquo;
                            </td>
                            <td className="py-3.5 px-4 text-slate-450">
                              {formatTimeAgo(item.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 border-none bg-transparent cursor-pointer">
                                <MoreHorizontal size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {activeFilter === "all" && docFiles.length > 5 && (
                  <div className="p-3 text-center border-t border-slate-100">
                    <button
                      onClick={() => setActiveFilter("files")}
                      className="text-xs font-bold text-[#c62828] hover:text-[#b71c1c] bg-transparent border-none cursor-pointer"
                    >
                      + {docFiles.length - 5} more files
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Matches Section */}
          {(activeFilter === "all" || activeFilter === "content") && contentMatches.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Content matches (from inside files) ({contentMatches.length})
                </h3>
                {activeFilter === "all" && (
                  <button
                    onClick={() => setActiveFilter("content")}
                    className="text-xs font-bold text-[#c62828] hover:text-[#b71c1c] bg-transparent border-none cursor-pointer p-0"
                  >
                    View all content matches
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {contentMatches
                  .slice(0, activeFilter === "all" ? 3 : undefined)
                  .map((item) => {
                    const cMatch = item.matches?.find((m) => m.type === "content");
                    return (
                      <div
                        key={item.id}
                        onClick={() => onFileClick(item)}
                        className="flex flex-col p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:shadow-xs cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getFileIcon(item.mimeType, item.originalFileName)}
                          <span className="text-xs font-bold text-slate-850 truncate max-w-sm">
                            {item.originalFileName}
                          </span>
                          <span className="text-[10px] bg-slate-200/60 text-slate-550 px-1.5 py-0.5 rounded-sm font-bold ml-1">
                            Page {cMatch?.pageNumber || 1} &bull; Section: {cMatch?.sectionName || "Body"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed italic ml-11 font-medium">
                          &ldquo;{highlightText(cMatch?.context || "", query)}&rdquo;
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold ml-11 mt-1">
                          Modified {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Semantic & Context Search Explanation Card */}
          <div className="bg-red-50/10 border border-red-100 rounded-3xl p-6 flex items-start gap-4 text-left mt-2">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#c62828] shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-slate-800">Semantic & context search</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Kumori understands the meaning behind your search and finds relevant content, even if exact words don&rsquo;t match.{" "}
                <a
                  href="#semantic-help"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Kumori uses OpenAI vector embeddings for semantic intelligence.");
                  }}
                  className="text-[#c62828] font-bold hover:underline"
                >
                  Learn more
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
