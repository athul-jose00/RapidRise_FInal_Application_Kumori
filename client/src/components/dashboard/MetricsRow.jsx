import { Folder, Users, Cloud, Shield } from "lucide-react";

export default function MetricsRow({
  totalFilesCount,
  sharedCount,
  totalStorageUsedBytes,
  formatBytes
}) {
  return (
    <section className="grid grid-cols-4 max-xl:grid-cols-2 max-sm:grid-cols-1 gap-5 mb-7">
      {/* Total Files Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-red-50 text-[#c62828]">
          <Folder size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-slate-400 mb-0.5">Total Files</span>
          <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{totalFilesCount}</span>
          <span className="text-[11px] font-semibold text-[#c62828] mt-0.5">
            +{totalFilesCount > 0 ? 1 : 0} this week
          </span>
        </div>
      </div>

      {/* Shared Files Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-orange-50 text-orange-600">
          <Users size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-slate-400 mb-0.5">Shared Files</span>
          <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{sharedCount}</span>
          <span className="text-[11px] font-semibold text-orange-600 mt-0.5">
            +{sharedCount > 0 ? 1 : 0} this week
          </span>
        </div>
      </div>

      {/* Storage Used Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
          <Cloud size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-slate-400 mb-0.5">Storage Used</span>
          <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            {formatBytes(totalStorageUsedBytes)}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 mt-0.5">of 1.0 GB</span>
        </div>
      </div>

      {/* Files Secure Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
          <Shield size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-slate-400 mb-0.5">Files Secure</span>
          <span className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">100%</span>
          <span className="text-[11px] font-semibold text-emerald-600 mt-0.5">Protected</span>
        </div>
      </div>
    </section>
  );
}
