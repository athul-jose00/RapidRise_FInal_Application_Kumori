
import {
  Folder,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Info,
  LayoutGrid,
  List,
  ChevronLeft,
  Users,
  Presentation,
  Archive,
  RotateCcw,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

export default function FileList({
  filteredFiles,
  activeTab,
  setActiveTab,
  activeMenuId,
  setActiveMenuId,
  handleDownload,
  openShareModal,
  handleDelete,
  handleRestore,
  formatTimeAgo,
  formatBytes,
  fileInputRef,
  handleUploadFiles,
  isDragActive,
  setIsDragActive,
  handleDrag,
  handleDrop,
  onFileClick,
  selectedFileIds = [],
  setSelectedFileIds,
  handleBulkRestore,
  handleBulkDownload,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const dropdownRef = useRef(null);
  const itemsPerPage = 10;

  // Close type dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // File type icon resolver to match reference image colors
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
      mime.includes("gzip") ||
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

  const getSafeFileName = (file) =>
    file?.originalFileName || file?.fileName || "Untitled";

  // Map files to standard items list
  const fileItems = filteredFiles.map((file) => ({
    id: file.id,
    name: getSafeFileName(file),
    modified: formatTimeAgo(file.createdAt),
    size: formatBytes(Number(file.fileSize)),
    sharedCount: file.shares && file.shares.length > 0 ? file.shares.length : 0,
    isRealFile: true,
    rawFile: file,
  }));

  // Filter by selectedTypes (multi-select)
  const filteredByType = fileItems.filter((item) => {
    if (selectedTypes.length === 0) return true;
    const mime = (item.rawFile.mimeType || "").toLowerCase();
    const name = item.name.toLowerCase();
    
    return selectedTypes.some((type) => {
      if (type === "PDF") {
        return mime.includes("pdf") || name.endsWith(".pdf");
      }
      if (type === "Word") {
        return mime.includes("word") || name.endsWith(".doc") || name.endsWith(".docx");
      }
      if (type === "Excel") {
        return mime.includes("excel") || name.endsWith(".xls") || name.endsWith(".xlsx");
      }
      if (type === "PowerPoint") {
        return mime.includes("powerpoint") || name.endsWith(".ppt") || name.endsWith(".pptx");
      }
      if (type === "Image") {
        return mime.includes("image/") || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif") || name.endsWith(".webp");
      }
      if (type === "Archive") {
        return mime.includes("zip") || mime.includes("tar") || mime.includes("rar") || name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z");
      }
      return false;
    });
  });

  // Sort by filter
  const sortedItems = [...filteredByType].sort((a, b) => {
    if (sortBy === "Name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "Newest") {
      return new Date(b.rawFile.createdAt) - new Date(a.rawFile.createdAt);
    }
    if (sortBy === "Oldest") {
      return new Date(a.rawFile.createdAt) - new Date(b.rawFile.createdAt);
    }
    if (sortBy === "Size") {
      return Number(b.rawFile.fileSize) - Number(a.rawFile.fileSize);
    }
    return 0;
  });

  const allItems = sortedItems;

  // Pagination calculation
  const totalItems = allItems.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = allItems.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowSelectToggle = (id) => {
    if (selectedFileIds.includes(id)) {
      setSelectedFileIds(selectedFileIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedFileIds([...selectedFileIds, id]);
    }
  };

  const handleSelectAllToggle = () => {
    const currentPageIds = currentItems.map(item => item.id);
    const allSelectedOnPage = currentPageIds.every(id => selectedFileIds.includes(id));
    if (allSelectedOnPage) {
      setSelectedFileIds(selectedFileIds.filter(id => !currentPageIds.includes(id)));
    } else {
      const newSelected = [...selectedFileIds];
      currentPageIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedFileIds(newSelected);
    }
  };

  const handleBulkDownloadClick = () => {
    const selectedFiles = filteredFiles.filter(f => selectedFileIds.includes(f.id));
    handleBulkDownload(selectedFiles);
  };

  const handleBulkShareClick = () => {
    const selectedFiles = filteredFiles.filter(f => selectedFileIds.includes(f.id));
    openShareModal(selectedFiles);
  };

  const handleBulkDeleteClick = () => {
    handleDelete(selectedFileIds);
  };

  const handleBulkRestoreClick = () => {
    handleBulkRestore(selectedFileIds);
  };

  return (
    <div className="bg-white border border-slate-100/80 rounded-3xl shadow-xs overflow-hidden flex flex-col">
      {/* Bulk Action Bar */}
      {selectedFileIds.length > 0 && (
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={currentItems.length > 0 && currentItems.every((item) => selectedFileIds.includes(item.id))}
              onChange={handleSelectAllToggle}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-[#c62828] focus:ring-[#c62828]/25 cursor-pointer outline-none"
            />
            <span className="text-xs sm:text-sm font-bold tracking-wide">
              {selectedFileIds.length} {selectedFileIds.length === 1 ? "item" : "items"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeTab !== "Trash" ? (
              <>
                <button
                  type="button"
                  onClick={handleBulkDownloadClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer outline-none shadow-xs"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkShareClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer outline-none shadow-xs"
                >
                  <Share2 size={13} />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeleteClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-900/60 text-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none shadow-xs"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBulkRestoreClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer outline-none shadow-xs"
                >
                  <RotateCcw size={13} />
                  <span className="hidden sm:inline">Restore</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeleteClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-900/60 text-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none shadow-xs"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Delete Permanently</span>
                </button>
              </>
            )}
            <div className="w-[1px] h-5 bg-slate-800 shrink-0 mx-1" />
            <button
              type="button"
              onClick={() => setSelectedFileIds([])}
              className="text-xs font-bold text-slate-400 hover:text-white bg-transparent border-none cursor-pointer outline-none"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      {/* File Controls Header */}
      <div className="flex items-center justify-end p-4 px-6 border-b border-slate-100 bg-white flex-wrap gap-4">
        {/* Dropdown Filters at the right end */}
        <div className="flex items-center gap-2.5">
          {/* Custom Multi-Select Dropdown for Type */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
              className="px-3.5 py-2 rounded-xl border border-slate-200/70 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-150 cursor-pointer flex items-center gap-1.5 outline-none"
            >
              <span>
                {selectedTypes.length === 0
                  ? "Type: All"
                  : selectedTypes.length === 1
                    ? `Type: ${selectedTypes[0]}s`
                    : `Type (${selectedTypes.length})`}
              </span>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </button>

            {typeDropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white border border-slate-100/90 rounded-2xl shadow-xl z-50 min-w-[180px] p-2 flex flex-col gap-1">
                {[
                  { label: "PDFs", value: "PDF" },
                  { label: "Word Documents", value: "Word" },
                  { label: "Excel Spreadsheets", value: "Excel" },
                  { label: "Presentations", value: "PowerPoint" },
                  { label: "Images", value: "Image" },
                  { label: "Archives (ZIP)", value: "Archive" },
                ].map((option) => {
                  const isChecked = selectedTypes.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs text-slate-700 font-semibold cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedTypes(selectedTypes.filter((t) => t !== option.value));
                          } else {
                            setSelectedTypes([...selectedTypes, option.value]);
                          }
                          setCurrentPage(1);
                        }}
                        className="w-3.5 h-3.5 rounded-sm border-slate-300 text-[#c62828] focus:ring-[#c62828]/25 cursor-pointer"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}

                {selectedTypes.length > 0 && (
                  <div className="border-t border-slate-100 mt-1 pt-1.5 px-1.5 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedTypes([]);
                        setCurrentPage(1);
                      }}
                      className="text-[10px] font-bold text-[#c62828] hover:text-[#b71c1c] bg-transparent border-none cursor-pointer p-0"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200/70 bg-white text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 transition-all duration-150 cursor-pointer"
          >
            <option value="Newest">Sort: Newest</option>
            <option value="Oldest">Sort: Oldest</option>
            <option value="Name">Sort: Name</option>
            <option value="Size">Sort: Size</option>
          </select>
        </div>
      </div>

      {/* Files Table */}
      <div className="overflow-x-auto w-full">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-5 text-slate-400">
            <Folder className="w-14 h-14 mb-4 text-slate-200" />
            <p className="text-sm font-semibold text-slate-500">
              {activeTab === "Trash"
                ? "Trash is empty. Deleted files will appear here for 15 days."
                : "No files found."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/40">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={currentItems.length > 0 && currentItems.every((item) => selectedFileIds.includes(item.id))}
                    onChange={handleSelectAllToggle}
                    className="w-4 h-4 rounded border-slate-300 text-[#c62828] focus:ring-[#c62828]/25 cursor-pointer outline-none"
                  />
                </th>
                <th className="py-3 px-6 font-bold text-[#c62828] hover:bg-slate-50">
                  Name
                </th>
                <th className="py-3 px-4 font-bold">Modified</th>
                <th className="py-3 px-4 font-bold">Size</th>
                <th className="py-3 px-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((item) => (
                <tr 
                  key={item.id}
                  className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${selectedFileIds.includes(item.id) ? 'bg-red-50/20 hover:bg-red-50/30' : ''}`}
                  onClick={() => {
                    if (item.isRealFile && onFileClick) {
                      onFileClick(item.rawFile);
                    }
                  }}
                >
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedFileIds.includes(item.id)}
                      onChange={() => handleRowSelectToggle(item.id)}
                      className="w-4 h-4 rounded border-slate-300 text-[#c62828] focus:ring-[#c62828]/25 cursor-pointer outline-none"
                    />
                  </td>
                  {/* Name Column */}
                  <td className="py-3.5 px-6 font-medium text-slate-800">
                    <div className="flex items-center gap-3">
                      {getFileIcon(item.rawFile.mimeType, item.name)}
                      <div className="flex items-center gap-3 max-w-[280px] sm:max-w-[400px] truncate">
                        <span className="truncate text-[13.5px] font-semibold text-slate-800" title={item.name}>
                          {item.name}
                        </span>
                        {/* Shared Collaborators Count */}
                        {item.sharedCount > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] text-slate-400 font-medium shrink-0">
                            <Users size={10} />
                            {item.sharedCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Modified Column */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                    {item.modified}
                  </td>

                  {/* Size Column */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                    {item.size}
                  </td>

                  {/* Actions Column - Inline Quick Actions */}
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      {activeTab === "Trash" ? (
                        <>
                          <button
                            onClick={(e) => handleRestore(item.id, e)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer border-none bg-transparent outline-none flex items-center justify-center"
                            title="Restore File"
                          >
                            <RotateCcw size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent outline-none flex items-center justify-center"
                            title="Delete Permanently"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => handleDownload(item.rawFile, e)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer border-none bg-transparent outline-none flex items-center justify-center"
                            title="Download"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            onClick={(e) => openShareModal(item.rawFile, e)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer border-none bg-transparent outline-none flex items-center justify-center"
                            title="Share"
                          >
                            <Share2 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent outline-none flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 bg-white flex-wrap gap-4">
          <span className="text-[12px] text-slate-400 font-semibold">
            Showing {startIndex + 1}-{endIndex} of {totalItems} items
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer border
                  ${
                    currentPage === page
                      ? "border-[#c62828] bg-white text-[#c62828]"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }
                `}
              >
                {page}
              </button>
            ))}

            {/* Visual ellipsis and last page details like screenshot if data is large */}
            {totalPages > 4 && (
              <>
                <span className="text-slate-400 text-xs px-1">...</span>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border
                    ${
                      currentPage === totalPages
                        ? "border-[#c62828] bg-white text-[#c62828]"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }
                  `}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for "+ New" button upload trigger */}
      <input
        type="file"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => handleUploadFiles(e.target.files)}
      />
    </div>
  );
}
