import { Folder, Upload, Share2, Trash2, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";

export default function QuickActions({
  onUploadClick,
  onShareClick,
  onTrashClick
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-[17px] font-bold text-slate-800">Quick Actions</h2>
      </div>

      <div className="flex flex-col gap-1.5">
        {/* Create Folder */}
        <button 
          className="flex items-center justify-between p-3 px-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:translate-x-0.5 cursor-pointer transition-all duration-200 w-full text-left"
          onClick={() => toast.info("Folders feature is coming soon!")}
        >
          <div className="flex items-center gap-3">
            <Folder className="w-4.5 h-4.5 text-slate-500" />
            <span>Create New Folder</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Upload Files */}
        <button 
          className="flex items-center justify-between p-3 px-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:translate-x-0.5 cursor-pointer transition-all duration-200 w-full text-left"
          onClick={onUploadClick}
        >
          <div className="flex items-center gap-3">
            <Upload className="w-4.5 h-4.5 text-slate-500" />
            <span>Upload Files</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Share File */}
        <button 
          className="flex items-center justify-between p-3 px-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:translate-x-0.5 cursor-pointer transition-all duration-200 w-full text-left"
          onClick={onShareClick}
        >
          <div className="flex items-center gap-3">
            <Share2 className="w-4.5 h-4.5 text-slate-500" />
            <span>Share a File or Folder</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* View Trash */}
        <button 
          className="flex items-center justify-between p-3 px-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:translate-x-0.5 cursor-pointer transition-all duration-200 w-full text-left"
          onClick={onTrashClick}
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-4.5 h-4.5 text-slate-500" />
            <span>View Trash</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
