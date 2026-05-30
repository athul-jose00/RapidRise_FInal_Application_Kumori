import {
  X,
  Check,
  Copy,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Presentation,
  Archive,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

const getFileIcon = (mimeType, fileName = "") => {
  const mime = (mimeType || "").toLowerCase();
  const name = fileName.toLowerCase();

  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    return (
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-red-50 text-red-600">
        <FileText size={13} />
      </div>
    );
  }
  if (
    mime.includes("word") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return (
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
        <FileText size={13} />
      </div>
    );
  }
  if (
    mime.includes("excel") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
  ) {
    return (
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
        <FileSpreadsheet size={13} />
      </div>
    );
  }
  if (
    mime.includes("powerpoint") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx")
  ) {
    return (
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-orange-50 text-orange-600">
        <Presentation size={13} />
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
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-cyan-50 text-cyan-600">
        <ImageIcon size={13} />
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
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-slate-100 text-slate-600">
        <Archive size={13} />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-slate-50 text-slate-500">
      <File size={13} />
    </div>
  );
};

export default function ShareModal({
  setIsShareModalOpen,
  shareFile,
  shareEmail,
  setShareEmail,
  shareExpiration,
  setShareExpiration,
  shareMessage,
  setShareMessage,
  shareLinkSuccess,
  sharingInProgress,
  handleShareSubmit,
  copyToClipboard,
  copied
}) {
  const [emailInput, setEmailInput] = useState("");
  const [emailsList, setEmailsList] = useState([]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddEmail = () => {
    const cleanedInput = emailInput.trim();
    if (!cleanedInput) return;
    
    // Split by semicolons, commas, or whitespace
    const splitEmails = cleanedInput.split(/[;,\s\n]+/).map(e => e.trim()).filter(Boolean);
    const validEmails = [];
    const invalidEmails = [];
    const duplicateEmails = [];
    
    splitEmails.forEach(email => {
      if (!validateEmail(email)) {
        invalidEmails.push(email);
      } else if (emailsList.includes(email) || validEmails.includes(email)) {
        duplicateEmails.push(email);
      } else {
        validEmails.push(email);
      }
    });
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(", ")}`);
    }
    if (duplicateEmails.length > 0) {
      toast.info(`Already added: ${duplicateEmails.join(", ")}`);
    }
    
    if (validEmails.length > 0) {
      setEmailsList([...validEmails, ...emailsList]); // Prepend to show at top
      setEmailInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalEmails = [...emailsList];
    
    // If user typed an email but forgot to click Add, try to add it
    if (emailInput.trim()) {
      const cleaned = emailInput.trim();
      const splitEmails = cleaned.split(/[;,\s\n]+/).map(e => e.trim()).filter(Boolean);
      let hasInvalid = false;
      
      splitEmails.forEach(email => {
        if (validateEmail(email)) {
          if (!finalEmails.includes(email)) {
            finalEmails.push(email);
          }
        } else {
          hasInvalid = true;
        }
      });

      if (hasInvalid) {
        toast.error("Please enter a valid email address before sharing");
        return;
      }
      setEmailInput("");
    }

    if (finalEmails.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    handleShareSubmit(e, finalEmails);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            {Array.isArray(shareFile) 
              ? `Share ${shareFile.length} files` 
              : `Share File`}
          </h3>
          <button 
            className="bg-transparent hover:bg-slate-50 text-slate-400 hover:text-slate-650 rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-all duration-150 border-none outline-none" 
            onClick={() => setIsShareModalOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        
        {shareFile && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 mb-4 max-h-28 overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Files to share:</span>
            <ul className="space-y-2.5 list-none pl-0 m-0 flex flex-col">
              {(Array.isArray(shareFile) ? shareFile : [shareFile]).map((file, idx) => (
                <li key={file.id || idx} className="flex items-center gap-2.5 min-w-0">
                  {getFileIcon(file.mimeType, file.originalFileName)}
                  <span className="truncate text-[13.5px] font-semibold text-slate-800 font-sans" title={file.originalFileName}>
                    {file.originalFileName}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {shareLinkSuccess ? (
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 mb-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check size={24} />
              </div>
              <div className="text-base font-bold text-emerald-800 mb-2">
                Shared Successfully!
              </div>
              <p className="text-[13px] text-emerald-700/80 leading-relaxed">
                The share email(s) have been successfully sent to the recipient(s).
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                className="rounded-xl p-2.5 px-5 text-sm font-semibold cursor-pointer transition-all duration-200 border border-[#c62828] bg-[#c62828] hover:bg-[#b71c1c] text-white outline-none" 
                onClick={() => setIsShareModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Recipient Email *</label>
                
                {/* Chip list of added emails above the input */}
                {emailsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto mb-2 border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                    {emailsList.map((email, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-1 bg-white border border-slate-200/60 rounded-full pl-2.5 pr-1.5 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-red-50 hover:border-red-100 hover:text-[#c62828] transition-all duration-150 shrink-0"
                      >
                        <span className="truncate max-w-[150px]" title={email}>{email}</span>
                        <button
                          type="button"
                          onClick={() => setEmailsList(emailsList.filter((e) => e !== email))}
                          className="bg-transparent hover:bg-slate-100 text-slate-400 hover:text-slate-650 rounded-full p-0.5 flex items-center justify-center cursor-pointer border-none outline-none"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
 
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="email@example.com" 
                    className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 px-3.5 text-sm outline-none focus:border-[#c62828] transition-all duration-200"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="rounded-xl px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-750 hover:text-slate-900 border border-slate-200 cursor-pointer transition-all duration-150 flex items-center justify-center shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
 
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Link Expiration</label>
                <select 
                  className="bg-white border border-slate-200 rounded-xl p-2.5 px-3.5 text-sm outline-none focus:border-[#c62828] transition-all duration-200"
                  value={shareExpiration}
                  onChange={(e) => setShareExpiration(e.target.value)}
                >
                  <option value="1">1 Hour</option>
                  <option value="12">12 Hours</option>
                  <option value="24">1 Day</option>
                  <option value="168">7 Days</option>
                </select>
              </div>
 
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">Custom Message (Optional)</label>
                <textarea 
                  placeholder="Add a message for the recipient..." 
                  className="bg-white border border-slate-200 rounded-xl p-2.5 px-3.5 text-sm outline-none min-h-[80px] resize-y focus:border-[#c62828] transition-all duration-200"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                className="rounded-xl p-2.5 px-4.5 text-sm font-semibold cursor-pointer transition-all duration-200 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650" 
                onClick={() => setIsShareModalOpen(false)}
                disabled={sharingInProgress}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="rounded-xl p-2.5 px-4.5 text-sm font-semibold cursor-pointer transition-all duration-200 border border-[#c62828] bg-[#c62828] hover:bg-[#b71c1c] text-white"
                disabled={sharingInProgress}
              >
                {sharingInProgress ? "Sharing..." : "Generate & Share"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
