import { ChevronDown } from "lucide-react";
import FileList from "../../../components/dashboard/FileList";

export default function StandardFilesTabPage({
  title,
  description,
  onCreateNew,
  fileListProps,
}) {
  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <div className="flex items-center bg-[#c62828] hover:bg-[#b71c1c] text-white rounded-xl shadow-xs transition-all duration-200">
          <button
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border-none bg-transparent text-white cursor-pointer outline-none"
            onClick={onCreateNew}
          >
            <span className="text-lg font-light">+</span> New
          </button>
          <div className="w-[1px] h-5 bg-white/20 shrink-0" />
          <button
            className="px-3 py-2 flex items-center justify-center border-none bg-transparent text-white cursor-pointer outline-none"
            onClick={onCreateNew}
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <FileList {...fileListProps} />
    </>
  );
}
