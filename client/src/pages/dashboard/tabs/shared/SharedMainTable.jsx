import React from "react";
import {
  FileText,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function SharedMainTable({
  groupedShares,
  selectedFileId,
  onSelectFile,
  formatBytes,
  formatDateTime,
  formatTimeRemaining,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
}) {
  const getFileIcon = (mimeType, name) => {
    const mime = (mimeType || "").toLowerCase();
    const fileName = (name || "").toLowerCase();
    if (mime.includes("pdf") || fileName.endsWith(".pdf")) {
      return <FileText size={20} className="text-[#DC2626]" />;
    }
    if (mime.includes("text") || fileName.endsWith(".txt") || mime.includes("word") || fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      return <FileText size={20} className="text-[#2563EB]" />;
    }
    if (mime.includes("excel") || mime.includes("spreadsheet") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      return <FileSpreadsheet size={20} className="text-emerald-500" />;
    }
    if (mime.includes("image/") || fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".webp")) {
      return <ImageIcon size={20} className="text-cyan-500" />;
    }
    return <File size={20} className="text-slate-500" />;
  };

  const getInitials = (email) => {
    if (!email) return "??";
    const parts = email.split("@")[0].split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const startIndex = (currentPage - 1) * 8 + 1;
  const endIndex = Math.min(currentPage * 8, totalItems);

  return (
    <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase bg-slate-50/50">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Recipients</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4">Expires</th>
              <th className="px-6 py-4">Views</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {groupedShares.map((group) => {
              const totalRecipients = group.shares.length;
              const viewsCount = group.shares.filter((s) => s.openedAt).length;
              const isSelected = selectedFileId === group.fileId;

              // Compute remaining time
              const isRevoked = group.shares.every((s) => s.revokedAt);
              const isExpired = new Date(group.expiresAt) < new Date();
              const timeRemainingText = isRevoked
                ? "Revoked"
                : isExpired
                ? "Expired"
                : formatTimeRemaining(group.expiresAt);

              return (
                <tr
                  key={group.fileId}
                  onClick={() => onSelectFile(group.fileId)}
                  className={`hover:bg-slate-50/70 transition-colors cursor-pointer text-sm font-semibold text-slate-700 ${
                    isSelected ? "bg-red-50/30 hover:bg-red-50/40" : ""
                  }`}
                >
                  {/* Name column */}
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        {getFileIcon(group.mimeType, group.fileName)}
                      </div>
                      <div className="flex flex-col truncate max-w-[200px] sm:max-w-xs">
                        <span className="text-slate-800 font-bold truncate" title={group.fileName}>
                          {group.fileName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-bold mt-0.5">
                          {formatBytes(group.fileSize)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Recipients column */}
                  <td className="px-6 py-4.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center -space-x-1.5">
                        {group.shares.slice(0, 2).map((share, idx) => (
                          <div
                            key={share.id}
                            className={`w-6.5 h-6.5 rounded-full border border-white flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 ${
                              idx === 0
                                ? "bg-indigo-500"
                                : "bg-purple-500"
                            }`}
                            title={share.recipientEmail}
                          >
                            {getInitials(share.recipientEmail)}
                          </div>
                        ))}
                        {totalRecipients > 2 && (
                          <div className="w-6.5 h-6.5 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[9px] font-extrabold text-slate-650 shrink-0">
                            +{totalRecipients - 2}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold">
                        {totalRecipients} recipient{totalRecipients > 1 ? "s" : ""}
                      </span>
                    </div>
                  </td>

                  {/* Created column */}
                  <td className="px-6 py-4.5">
                    <div className="flex flex-col">
                      <span className="text-slate-700">{formatDateTime(group.createdAt).split(",")[0]}</span>
                      <span className="text-[11px] text-slate-400 font-bold mt-0.5">
                        {formatDateTime(group.createdAt).split(",")[1]}
                      </span>
                    </div>
                  </td>

                  {/* Expires column */}
                  <td className="px-6 py-4.5">
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-bold ${
                          isRevoked
                            ? "text-orange-500"
                            : isExpired
                            ? "text-red-500"
                            : timeRemainingText.includes("day") || timeRemainingText.includes("days")
                            ? "text-slate-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {timeRemainingText}
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold mt-0.5">
                        {isRevoked ? "Link disabled" : isExpired ? formatDateTime(group.expiresAt).split(",")[0] : `Today, ${formatDateTime(group.expiresAt).split(",")[1]}`}
                      </span>
                    </div>
                  </td>

                  {/* Views column */}
                  <td className="px-6 py-4.5">
                    <span className="text-slate-700 text-center min-w-[20px]">{viewsCount}</span>
                  </td>
                </tr>
              );
            })}
            {groupedShares.length === 0 && (
              <tr>
              <td colSpan={5} className="text-center py-10 text-slate-400 italic">
                  No shares found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 select-none bg-slate-50/30">
          <span>
            Showing {startIndex}-{endIndex} of {totalItems} shared links
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer border border-slate-200 disabled:border-slate-100 flex items-center bg-white"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer border-none font-bold text-xs ${
                  currentPage === page
                    ? "bg-red-50 text-[#c62828]"
                    : "hover:bg-slate-100 text-slate-600 bg-transparent"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer border border-slate-200 disabled:border-slate-100 flex items-center bg-white"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
