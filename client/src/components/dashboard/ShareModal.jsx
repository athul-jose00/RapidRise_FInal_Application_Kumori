import { X, Check, Copy } from "lucide-react";

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
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-slate-800">
            Share "{shareFile?.originalFileName || "File"}"
          </h3>
          <button 
            className="bg-transparent hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-all duration-150 border-none" 
            onClick={() => setIsShareModalOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        
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
                The share email has been successfully sent to the recipient.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                className="rounded-xl p-2.5 px-5 text-sm font-bold cursor-pointer transition-all duration-200 border border-[#c62828] bg-[#c62828] hover:bg-[#b71c1c] text-white outline-none" 
                onClick={() => setIsShareModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleShareSubmit}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Recipient Email *</label>
                <input 
                  type="email" 
                  required 
                  placeholder="email@example.com" 
                  className="bg-white border border-slate-200 rounded-xl p-2.5 px-3.5 text-sm outline-none focus:border-[#c62828] transition-all duration-200"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Link Expiration</label>
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
                <label className="text-xs font-bold text-slate-500">Custom Message (Optional)</label>
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
                className="rounded-xl p-2.5 px-4.5 text-sm font-bold cursor-pointer transition-all duration-200 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600" 
                onClick={() => setIsShareModalOpen(false)}
                disabled={sharingInProgress}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="rounded-xl p-2.5 px-4.5 text-sm font-bold cursor-pointer transition-all duration-200 border border-[#c62828] bg-[#c62828] hover:bg-[#b71c1c] text-white"
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
