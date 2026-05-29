import {
  X,
  FileText,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  User,
  ShieldCheck,
  Ban,
  Trash2,
} from "lucide-react";

export default function SharedSidePanel({
  selectedGroup,
  onClose,
  formatBytes,
  formatDateTime,
  formatTimeRemaining,
  currentUser,
  onRevokeShare,
  onRevokeAllShares,
  onDeleteShare,
  onRestoreShare,
  revoking,
  deleting,
}) {
  if (!selectedGroup) return null;

  const getFileIcon = (mimeType, name) => {
    const mime = (mimeType || "").toLowerCase();
    const fileName = (name || "").toLowerCase();
    if (mime.includes("pdf") || fileName.endsWith(".pdf")) {
      return <FileText size={22} className="text-[#DC2626]" />;
    }
    if (mime.includes("text") || fileName.endsWith(".txt") || mime.includes("word") || fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      return <FileText size={22} className="text-[#2563EB]" />;
    }
    if (mime.includes("excel") || mime.includes("spreadsheet") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      return <FileSpreadsheet size={22} className="text-emerald-500" />;
    }
    if (mime.includes("image/") || fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".webp")) {
      return <ImageIcon size={22} className="text-cyan-500" />;
    }
    return <File size={22} className="text-slate-500" />;
  };

  const getInitials = (email) => {
    if (!email) return "??";
    const parts = email.split("@")[0].split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const allRevoked = selectedGroup.shares.every((s) => s.revokedAt);
  const isExpired = new Date(selectedGroup.expiresAt) < new Date();
  const timeRemaining = allRevoked
    ? "Revoked"
    : isExpired
    ? "Expired"
    : formatTimeRemaining(selectedGroup.expiresAt);
  const totalRecipients = selectedGroup.shares.length;
  const totalViews = selectedGroup.shares.filter((s) => s.openedAt).length;

  const ownerName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : "Alex Johnson";

  const ownerAvatar = currentUser?.profileImage || null;

  return (
    <div className="w-full lg:w-[360px] bg-white border border-slate-100 rounded-3xl p-5 shadow-xs shrink-0 self-stretch overflow-y-auto flex flex-col gap-6 relative font-sans">
      {/* Header section with file type, name, size and close */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 truncate">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            {getFileIcon(selectedGroup.mimeType, selectedGroup.fileName)}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-semibold text-slate-800 truncate" title={selectedGroup.fileName}>
              {selectedGroup.fileName}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-0.5">
              {formatBytes(selectedGroup.fileSize)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 cursor-pointer border-none bg-transparent outline-none flex items-center justify-center shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* Overview Block */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Overview</h4>
        <div className="flex flex-col gap-3.5 text-xs font-medium text-slate-600">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Shared on</span>
            <span>{formatDateTime(selectedGroup.createdAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Shared by</span>
            <div className="flex items-center gap-2">
              {ownerAvatar ? (
                <img src={ownerAvatar} alt="Owner" className="w-5.5 h-5.5 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-5.5 h-5.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <User size={12} />
                </div>
              )}
              <span>{ownerName}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Recipients</span>
            <span>{totalRecipients} recipients</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Views</span>
            <span>{totalViews}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Link created</span>
            <span>{formatDateTime(selectedGroup.createdAt)}</span>
          </div>
        </div>
      </div>

      <hr className="border-slate-100 m-0" />

      {/* Link Information Block */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Link Information</h4>
        <div className="flex flex-col gap-3.5 text-xs font-medium text-slate-600">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Created by</span>
            <span>{ownerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Link created on</span>
            <span>{formatDateTime(selectedGroup.createdAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Expires on</span>
            <span>{formatDateTime(selectedGroup.expiresAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Time remaining</span>
            <span
              className={`font-bold ${
                allRevoked
                  ? "text-orange-500"
                  : isExpired
                  ? "text-red-500"
                  : timeRemaining.includes("day") || timeRemaining.includes("days")
                  ? "text-slate-700"
                  : "text-emerald-600"
              }`}
            >
              {timeRemaining}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status</span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                allRevoked
                  ? "bg-orange-50 text-orange-600 border border-orange-100"
                  : isExpired
                  ? "bg-slate-100 text-slate-500"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
              }`}
            >
              {allRevoked ? "Revoked" : isExpired ? "Expired" : "Active"}
            </span>
          </div>
        </div>
      </div>

      <hr className="border-slate-100 m-0" />

      {/* Recipients List Block */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Recipients ({totalRecipients})
        </h4>
        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
          {selectedGroup.shares.map((share, idx) => (
            <div key={share.id} className="flex items-center gap-3">
              <div
                className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10.5px] font-bold text-white shrink-0 ${
                  share.revokedAt
                    ? "bg-slate-400"
                    : idx % 4 === 0
                    ? "bg-indigo-500"
                    : idx % 4 === 1
                    ? "bg-purple-500"
                    : idx % 4 === 2
                    ? "bg-pink-500"
                    : "bg-teal-500"
                }`}
              >
                {getInitials(share.recipientEmail)}
              </div>
              <div className="flex flex-col truncate flex-1 min-w-0">
                <span className={`text-xs font-semibold truncate ${share.revokedAt ? "text-slate-400 line-through" : "text-slate-800"}`} title={share.recipientEmail}>
                  {share.recipientEmail}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {share.revokedAt
                    ? "Revoked"
                    : share.openedAt
                    ? `Viewed • ${formatDateTime(share.openedAt).split(",")[0]}`
                    : "Not viewed yet"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {share.revokedAt ? (
                  <button
                    onClick={() => onRestoreShare && onRestoreShare(share.id)}
                    disabled={revoking || deleting}
                    className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold cursor-pointer border border-emerald-100 transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={() => onRevokeShare && onRevokeShare(share.id)}
                    disabled={revoking || deleting}
                    className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-[10px] font-bold cursor-pointer border border-red-100 transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Revoke
                  </button>
                )}
                <button
                  onClick={() => onDeleteShare && onDeleteShare(share.id)}
                  disabled={revoking || deleting}
                  title="Delete share link permanently"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 cursor-pointer border border-slate-200 hover:border-red-100 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-white"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revoke button */}
      {!allRevoked && (
        <button
          onClick={() => {
            if (onRevokeAllShares) {
              const activeShareIds = selectedGroup.shares
                .filter((s) => !s.revokedAt)
                .map((s) => s.id);
              if (activeShareIds.length > 0) {
                onRevokeAllShares(activeShareIds);
              }
            }
          }}
          disabled={revoking || deleting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer border border-red-100 transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Ban size={14} />
          {revoking ? "Revoking..." : "Revoke All Links"}
        </button>
      )}

      {/* Secure link box */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 flex items-start gap-3 mt-auto shadow-xs">
        <div className="w-8 h-8 rounded-full bg-blue-50/80 border border-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
          <ShieldCheck size={16} />
        </div>
        <div className="flex flex-col gap-0.5">
          <h5 className="text-[11px] font-extrabold text-slate-800">Secure link</h5>
          <p className="text-[10.5px] text-slate-400 leading-normal font-semibold">
            This link is private and only accessible by the recipients via email.
          </p>
        </div>
      </div>
    </div>
  );
}
