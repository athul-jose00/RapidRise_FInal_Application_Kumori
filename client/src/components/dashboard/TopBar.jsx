import { Search, Bell, ChevronDown, Menu, X } from "lucide-react";
import { toast } from "react-toastify";

export default function TopBar({
  searchQuery,
  setSearchQuery,
  setMobileSidebarOpen,
  currentUser,
  onProfileClick
}) {
  return (
    <div className="flex justify-between items-center mb-8 gap-5 w-full">
      {/* Mobile Hamburger menu */}
      <div className="hidden max-lg:flex items-center justify-between">
        <button 
          className="bg-transparent border-none text-slate-700 cursor-pointer"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Centered Search Input */}
      <div className="flex-1 flex justify-center max-w-2xl mx-auto w-full">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px]" />
          <input 
            type="text" 
            placeholder="Search files and folders..." 
            className="w-full bg-slate-50 border border-slate-200/80 rounded-full py-2.5 px-4 pl-11 pr-10 text-sm text-slate-800 placeholder-slate-400/80 outline-none focus:bg-white focus:border-[#c62828]/50 focus:ring-3 focus:ring-red-100 transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none outline-none p-0 flex items-center justify-center"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-5 shrink-0">
        <button 
          className="bg-transparent hover:bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer relative text-slate-600 transition-all duration-200 border-none outline-none"
          onClick={() => toast.info("You have 3 new notifications")}
        >
          <Bell size={20} className="text-slate-700" />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border-2 border-white">
            3
          </span>
        </button>
        
        <div 
          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors"
          onClick={onProfileClick}
        >
          <img 
            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.firstName || "user"}`} 
            alt="Avatar" 
            className="w-9 h-9 rounded-full object-cover border border-slate-200/60" 
          />
          <span className="text-sm font-semibold text-slate-800 hidden sm:inline">
            {currentUser?.firstName || "Alex"}
          </span>
          <ChevronDown className="text-slate-500 w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
