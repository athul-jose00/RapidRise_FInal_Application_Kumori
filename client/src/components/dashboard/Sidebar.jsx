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
  X,
  User,
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
      className={`bg-white border-r border-slate-100 flex flex-col shrink-0 sticky top-0 h-screen justify-between transition-all duration-300 ease-in-out z-50 
        max-lg:fixed max-lg:left-0 max-lg:top-0 
        ${sidebarCollapsed ? "w-20 px-4 py-6" : "w-72 p-6"}
        ${mobileSidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
      `}
    >
      <div>
        <div className="lg:hidden flex items-center justify-end mb-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Brand header */}
        <div className="flex items-center mb-8 transition-all duration-300 ease-in-out">
          <img
            src="/mascot.png"
            alt="Kumori Mascot"
            className="w-12 h-12 object-contain shrink-0 transition-all duration-300 ease-in-out"
          />
          <span
            className={`text-3xl font-extrabold text-[#c62828] tracking-tight transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              sidebarCollapsed
                ? "max-w-0 opacity-0 ml-0"
                : "max-w-40 opacity-100 ml-3"
            }`}
          >
            Kumori
          </span>
        </div>

        {/* Upload Button */}
        <div className="mb-6 px-1">
          <button
            className={`flex flex-col items-center justify-center bg-[#c62828] hover:bg-[#b71c1c] text-white transition-all duration-300 ease-in-out shadow-md shadow-red-900/10 hover:shadow-lg hover:shadow-red-900/20 active:translate-y-px cursor-pointer overflow-hidden whitespace-nowrap mx-auto
              ${
                sidebarCollapsed
                  ? "w-12 h-12 rounded-full py-0 px-0"
                  : "w-full py-3.5 px-5 rounded-2xl font-semibold text-[15px]"
              }
            `}
            onClick={onUploadClick}
            title={sidebarCollapsed ? "Upload File" : ""}
          >
            <Upload
              size={18}
              className="shrink-0 transition-all duration-300 ease-in-out"
            />
            <span
              className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
                sidebarCollapsed
                  ? "max-h-0 opacity-0 mt-0"
                  : "max-h-10 opacity-100 mt-1.5"
              }`}
            >
              Upload
            </span>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col gap-1.5 mb-auto">
          {[
            { name: "Dashboard", icon: <Cloud className="w-5 h-5 shrink-0" /> },
            { name: "My Files", icon: <Folder className="w-5 h-5 shrink-0" /> },
            { name: "Shared", icon: <Users className="w-5 h-5 shrink-0" /> },
            { name: "Recent", icon: <Clock className="w-5 h-5 shrink-0" /> },
            { name: "Starred", icon: <Star className="w-5 h-5 shrink-0" /> },
            { name: "Trash", icon: <Trash2 className="w-5 h-5 shrink-0" /> },
          ].map((item) => (
            <button
              key={item.name}
              className={`flex items-center rounded-xl text-[15px] font-semibold transition-all duration-300 ease-in-out w-full text-left cursor-pointer border-none overflow-hidden
                ${sidebarCollapsed ? "py-3 px-3.5" : "py-3 px-4"}
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
              <span
                className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
                  sidebarCollapsed
                    ? "max-w-0 opacity-0 ml-0"
                    : "max-w-40 opacity-100 ml-3.5"
                }`}
              >
                {item.name}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Widgets */}
      <div className="flex flex-col gap-4">
        {/* Storage Meter */}
        <div
          className={`bg-slate-50/50 border border-slate-100 rounded-2xl transition-all duration-300 ease-in-out overflow-hidden
            ${sidebarCollapsed ? "p-2.5 cursor-pointer flex flex-col items-center" : "p-4"}`}
          title={
            sidebarCollapsed
              ? `Storage: ${formatBytes(totalStorageUsedBytes)} used (${Math.round(storagePercentage)}%)`
              : ""
          }
        >
          {/* Collapsed State Elements */}
          <div
            className={`flex flex-col items-center transition-all duration-300 ease-in-out ${sidebarCollapsed ? "opacity-100 max-h-12" : "opacity-0 max-h-0 pointer-events-none overflow-hidden"}`}
          >
            <Cloud className="w-5 h-5 text-slate-600 mb-1" />
            <span className="text-[10px] font-bold text-slate-700">
              {Math.round(storagePercentage)}%
            </span>
          </div>

          {/* Expanded State Elements */}
          <div
            className={`transition-all duration-300 ease-in-out ${!sidebarCollapsed ? "opacity-100 max-h-24" : "opacity-0 max-h-0 pointer-events-none overflow-hidden"}`}
          >
            <div className="text-xs font-bold text-slate-700 mb-2">Storage</div>
            <div className="flex justify-between items-baseline text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-800">
                {formatBytes(totalStorageUsedBytes)}{" "}
                <span className="font-normal text-slate-500">
                  of 1.0 GB used
                </span>
              </span>
              <span className="font-bold text-slate-800">
                {Math.round(storagePercentage)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c62828] rounded-full transition-all duration-300"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* User profile details */}
        <div className="flex items-center pt-4 border-t border-slate-100 relative transition-all duration-300 ease-in-out">
          <div
            className={`shrink-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? "ml-1" : "ml-0"}`}
          >
            {currentUser?.profileImage ? (
              <img
                src={currentUser.profileImage}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>

          <div
            className={`flex flex-col transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              sidebarCollapsed
                ? "max-w-0 opacity-0 ml-0"
                : "max-w-36 opacity-100 ml-2.5"
            }`}
          >
            <span className="text-sm font-bold text-slate-800 truncate">
              {currentUser
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : "Alex Johnson"}
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              {currentUser?.email || "alex@email.com"}
            </span>
          </div>

          <button
            className={`ml-auto text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition-all duration-150 border-none flex items-center justify-center shrink-0 ${
              sidebarCollapsed
                ? "w-0 h-0 p-0 opacity-0 pointer-events-none"
                : "w-8 h-8 opacity-100"
            }`}
            title="Log Out"
            onClick={handleLogout}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Collapse Button */}
        <div className="relative h-8 w-full flex items-center">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all duration-300 ease-in-out shadow-xs cursor-pointer absolute
              ${sidebarCollapsed ? "right-1/2 translate-x-1/2" : "right-0 translate-x-0"}
            `}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronsRight size={15} />
            ) : (
              <ChevronsLeft size={15} />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
