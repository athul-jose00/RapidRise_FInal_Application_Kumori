import {
  Folder,
  Users,
  Clock,
  Star,
  Trash2,
  ChevronDown,
  Upload,
  Cloud,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  storagePercentage,
  totalStorageUsedBytes,
  formatBytes,
  currentUser,
  handleLogout,
  onUploadClick,
}) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClose = () => setUserDropdownOpen(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  return (
    <aside
      className={`bg-white border-r border-slate-100 flex flex-col p-6 shrink-0 sticky top-0 h-screen justify-between transition-all duration-300 z-50 
        max-lg:fixed max-lg:left-0 max-lg:top-0 
        ${sidebarCollapsed ? "w-22 px-3 py-6" : "w-72"}
        ${mobileSidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
      `}
    >
      <div>
        {/* Brand header */}
        <div className={`flex items-center gap-3 mb-8 ${sidebarCollapsed ? "justify-center" : ""}`}>
          <img
            src="/mascot.png"
            alt="Kumori Mascot"
            className="w-10 h-10 object-contain"
          />
          {!sidebarCollapsed && (
            <span className="text-3xl font-extrabold text-[#c62828] tracking-tight">
              Kumori
            </span>
          )}
        </div>

        {/* Upload Button */}
        <div className="mb-6 px-1">
          {sidebarCollapsed ? (
            <button
              className="flex items-center justify-center bg-[#c62828] hover:bg-[#b71c1c] text-white rounded-full w-12 h-12 shadow-md shadow-red-900/10 hover:shadow-lg hover:shadow-red-900/20 active:translate-y-px transition-all duration-200 cursor-pointer mx-auto"
              onClick={onUploadClick}
              title="Upload File"
            >
              <Upload size={20} />
            </button>
          ) : (
            <button
              className="flex flex-col items-center justify-center gap-1.5 bg-[#c62828] hover:bg-[#b71c1c] text-white rounded-2xl py-3.5 px-5 font-semibold text-[15px] w-full shadow-md shadow-red-900/10 hover:shadow-lg hover:shadow-red-900/20 active:translate-y-px transition-all duration-200 cursor-pointer"
              onClick={onUploadClick}
            >
              <Upload size={18} />
              <span>Upload</span>
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col gap-1.5 mb-auto">
          {[
            { name: "Dashboard", icon: <Cloud className="w-5 h-5" /> },
            { name: "My Files", icon: <Folder className="w-5 h-5" /> },
            { name: "Shared", icon: <Users className="w-5 h-5" /> },
            { name: "Recent", icon: <Clock className="w-5 h-5" /> },
            { name: "Starred", icon: <Star className="w-5 h-5" /> },
            { name: "Trash", icon: <Trash2 className="w-5 h-5" /> },
          ].map((item) => (
            <button
              key={item.name}
              className={`flex items-center rounded-xl text-[15px] font-semibold transition-all duration-200 w-full text-left cursor-pointer border-none
                ${sidebarCollapsed ? "justify-center py-3.5 px-0" : "gap-3.5 py-3 px-4"}
                ${
                  activeTab === item.name
                    ? "bg-red-50 text-[#c62828]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }
              `}
              onClick={() => {
                setActiveTab(item.name);
                setMobileSidebarOpen(false);
              }}
              title={sidebarCollapsed ? item.name : ""}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Widgets */}
      <div className="flex flex-col gap-4">
        {/* Storage Meter */}
        {!sidebarCollapsed ? (
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-700 mb-2">Storage</div>
            <div className="flex justify-between items-baseline text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-800">
                {formatBytes(totalStorageUsedBytes)} <span className="font-normal text-slate-500">of 1.0 GB used</span>
              </span>
              <span className="font-bold text-slate-800">{Math.round(storagePercentage)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c62828] rounded-full transition-all duration-300"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center bg-slate-50/50 border border-slate-100 rounded-2xl p-2.5 cursor-pointer"
            title={`Storage: ${formatBytes(totalStorageUsedBytes)} used (${Math.round(storagePercentage)}%)`}
          >
            <Cloud className="w-5 h-5 text-slate-600 mb-1" />
            <span className="text-[10px] font-bold text-slate-700">{Math.round(storagePercentage)}%</span>
          </div>
        )}

        {/* Go Premium banner */}
        {!sidebarCollapsed && (
          <div className="bg-linear-to-br from-red-50/30 to-red-100/20 border border-red-100/30 rounded-3xl p-4 relative overflow-hidden shadow-xs">
            <img
              src="/mascot.png"
              alt="Mascot"
              className="absolute right-2 top-2 w-14 h-14 object-contain opacity-90"
            />
            <div className="text-sm font-bold text-slate-800 mb-1 pr-12">
              Go Premium
            </div>
            <div className="text-[11px] text-slate-500 leading-normal mb-3 pr-12">
              Unlock more storage and powerful features.
            </div>
            <button
              className="bg-white hover:bg-red-50 text-[#c62828] border border-red-200 rounded-xl py-2 px-4 text-xs font-bold transition-all duration-200 cursor-pointer w-full"
              onClick={() => toast.info("Premium plans coming soon!")}
            >
              Upgrade Now
            </button>
          </div>
        )}

        {/* User profile details */}
        <div className={`flex items-center gap-2.5 pt-4 border-t border-slate-100 relative ${sidebarCollapsed ? "justify-center" : ""}`}>
          <img
            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.firstName || "user"}`}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover bg-slate-100 border border-slate-200"
          />
          {!sidebarCollapsed && (
            <div className="flex flex-col max-w-36 truncate">
              <span className="text-sm font-bold text-slate-800 truncate">
                {currentUser
                  ? `${currentUser.firstName} ${currentUser.lastName}`
                  : "Alex Johnson"}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {currentUser?.email || "alex@email.com"}
              </span>
            </div>
          )}
          
          {!sidebarCollapsed && (
            <button
              className="ml-auto text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition-all duration-150 border-none flex items-center justify-center"
              title="Log Out"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        {/* Collapse Button */}
        <div className={`flex justify-end ${sidebarCollapsed ? "justify-center" : ""}`}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors shadow-xs cursor-pointer"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
