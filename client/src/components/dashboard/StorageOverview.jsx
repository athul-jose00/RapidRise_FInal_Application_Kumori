import { useNavigate } from "react-router-dom";

export default function StorageOverview({
  totalStorageUsedBytes,
  storagePercentage,
  formatBytes,
  categorySizes
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-[17px] font-bold text-slate-800">Storage Overview</h2>
        <button 
          className="text-xs font-bold text-[#c62828] hover:text-[#b71c1c] hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-none"
          onClick={() => navigate("/dashboard/storage")}
        >
          View Details
        </button>
      </div>

      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-semibold text-slate-800">
          {formatBytes(totalStorageUsedBytes)} <span className="font-medium text-slate-500">used of 1.0 GB</span>
        </span>
        <span className="text-base font-bold text-slate-800">{Math.round(storagePercentage)}%</span>
      </div>

      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-5">
        <div 
          className="h-full bg-[#c62828] rounded-full transition-all duration-300" 
          style={{ width: `${storagePercentage}%` }}
        />
      </div>

      <div className="flex flex-col gap-3">
        {/* Documents */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2.5 font-medium text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Documents
          </span>
          <span className="font-semibold text-slate-700">{formatBytes(categorySizes.docs)}</span>
        </div>

        {/* Images */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2.5 font-medium text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Images
          </span>
          <span className="font-semibold text-slate-700">{formatBytes(categorySizes.imgs)}</span>
        </div>

        {/* Videos */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2.5 font-medium text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Videos
          </span>
          <span className="font-semibold text-slate-700">{formatBytes(categorySizes.vids)}</span>
        </div>

        {/* Others */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2.5 font-medium text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            Others
          </span>
          <span className="font-semibold text-slate-700">{formatBytes(categorySizes.others)}</span>
        </div>
      </div>
    </div>
  );
}
