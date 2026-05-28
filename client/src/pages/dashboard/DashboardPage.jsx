import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown } from "lucide-react";
import {
  fetchFiles,
  fetchTrashFiles,
  uploadFile,
  deleteFile,
  permanentlyDeleteFile,
  restoreFile,
  generateShareLink,
  selectFiles,
  selectTrashFiles,
} from "../../redux/files/fileSlice";
import { logoutUser, selectCurrentUser } from "../../redux/user/userSlice";
import api from "../../api/axios";
import { toast } from "react-toastify";

// Subcomponents
import Sidebar from "../../components/dashboard/Sidebar";
import TopBar from "../../components/dashboard/TopBar";
import MetricsRow from "../../components/dashboard/MetricsRow";
import FileList from "../../components/dashboard/FileList";
import StorageOverview from "../../components/dashboard/StorageOverview";
import QuickActions from "../../components/dashboard/QuickActions";
import ShareModal from "../../components/dashboard/ShareModal";
import FilePreview from "../../components/dashboard/FilePreview";
import ConfirmModal from "../../components/ui/ConfirmModal";
import UploadPage from "../../components/dashboard/UploadPage";
import SearchResults from "../../components/dashboard/SearchResults";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const files = useSelector(selectFiles) || [];
  const trashFiles = useSelector(selectTrashFiles) || [];
  const currentUser = useSelector(selectCurrentUser);

  // Local UI States
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPreviewFile(null);
  };

  const [recentCutoff] = useState(
    () => new Date(Date.now() - 24 * 60 * 60 * 1000),
  );

  // Statistics and Shares
  const [sharedCount, setSharedCount] = useState(0);

  // Share Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareExpiration, setShareExpiration] = useState("24");
  const [shareMessage, setShareMessage] = useState("");
  const [shareLinkSuccess, setShareLinkSuccess] = useState("");
  const [sharingInProgress, setSharingInProgress] = useState(false);
  const [copied, setCopied] = useState(false);

  // File upload state
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  // Confirm modal state (for delete actions)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchFiles());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    const loadSharesCount = async () => {
      try {
        const res = await api.get("/api/shares");
        if (!cancelled && res.data && res.data.shares) {
          setSharedCount(res.data.shares.length);
        }
      } catch (error) {
        console.error("Failed to fetch shares count:", error);
      }
    };

    void loadSharesCount();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSharesCount = async () => {
    try {
      const res = await api.get("/api/shares");
      if (res.data && res.data.shares) {
        setSharedCount(res.data.shares.length);
      }
    } catch (error) {
      console.error("Failed to fetch shares count:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "Trash") {
      dispatch(fetchTrashFiles());
    }
    if (activeTab === "My Files") {
      dispatch(fetchFiles());
    }
  }, [activeTab, dispatch]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Format bytes helper
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Time ago helper
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  // Handle Log Out
  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Successfully logged out");
    window.location.hash = "#/login";
  };

  // Handle file download
  const handleDownload = async (file, e) => {
    e.stopPropagation();
    toast.info(`Preparing download for ${file.originalFileName}...`);
    try {
      const response = await api.get(`/api/files/${file.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch {
      toast.error("Download failed. Please try again.");
    }
  };

  // Handle file delete (opens confirm modal)
  const handleDelete = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setConfirmTarget({ id, isTrash: activeTab === "Trash" });
    setConfirmOpen(true);
  };

  const onConfirmMoveToTrash = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;
    setConfirmOpen(false);
    try {
      await dispatch(deleteFile(id)).unwrap();
      toast.success("File moved to trash");
      dispatch(fetchFiles());
      void refreshSharesCount();
    } catch (err) {
      toast.error(`Delete failed: ${err}`);
    }
  };

  const onConfirmPermanentlyDelete = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;
    setConfirmOpen(false);
    try {
      await dispatch(permanentlyDeleteFile(id)).unwrap();
      toast.success("File permanently deleted");
      dispatch(fetchTrashFiles());
      void refreshSharesCount();
    } catch (err) {
      toast.error(`Permanent delete failed: ${err}`);
    }
  };

  const handleRestore = (id, e) => {
    e.stopPropagation();
    dispatch(restoreFile(id))
      .unwrap()
      .then((result) => {
        toast.success(result?.message || "File restored successfully");
        dispatch(fetchTrashFiles());
        dispatch(fetchFiles());
      })
      .catch((err) => {
        toast.error(`Restore failed: ${err}`);
      });
  };

  // Handle Share link generation modal
  const openShareModal = (file, e) => {
    e.stopPropagation();
    setShareFile(file);
    setShareEmail("");
    setShareExpiration("24");
    setShareMessage("");
    setShareLinkSuccess("");
    setIsShareModalOpen(true);
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareEmail) {
      toast.error("Please enter a recipient email");
      return;
    }
    setSharingInProgress(true);
    try {
      const expHours = parseInt(shareExpiration);
      const actionResult = await dispatch(
        generateShareLink({
          id: shareFile.id,
          recipientEmail: shareEmail,
          expirationHours: expHours,
          message: shareMessage,
        }),
      ).unwrap();

      const firstShare = actionResult.shares && actionResult.shares[0];
      if (firstShare && firstShare.shareUrl) {
        setShareLinkSuccess(firstShare.shareUrl);
        toast.success("Share link generated and email sent!");
        void refreshSharesCount();
      } else {
        toast.error("Successfully shared, but could not retrieve share link");
      }
    } catch (err) {
      toast.error(`Sharing failed: ${err}`);
    } finally {
      setSharingInProgress(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLinkSuccess);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // File Upload Handlers
  const handleUploadFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    Array.from(selectedFiles).forEach((file) => {
      toast.info(`Uploading ${file.name}...`);
      dispatch(uploadFile(file))
        .unwrap()
        .then(() => {
          toast.success(`${file.name} uploaded successfully!`);
        })
        .catch((err) => {
          toast.error(`Failed to upload ${file.name}: ${err}`);
        });
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Compute actual file stats
  const totalFilesCount = files.length;
  const totalStorageUsedBytes = files.reduce(
    (acc, file) => acc + (Number(file.fileSize) || 0),
    0,
  );
  const totalStorageQuotaBytes = 1 * 1024 * 1024 * 1024; // 1 GB
  const storagePercentage = Math.min(
    100,
    Math.max(0, (totalStorageUsedBytes / totalStorageQuotaBytes) * 100),
  );

  // File categorization for progress bar legend
  const getCategorySizes = () => {
    let docs = 0,
      imgs = 0,
      vids = 0,
      others = 0;
    files.forEach((f) => {
      const mime = (f.mimeType || "").toLowerCase();
      const name = (f.originalFileName || "").toLowerCase();
      const size = Number(f.fileSize) || 0;

      if (
        mime.includes("pdf") ||
        mime.includes("word") ||
        mime.includes("excel") ||
        name.endsWith(".pdf") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx") ||
        name.endsWith(".xls") ||
        name.endsWith(".xlsx") ||
        name.endsWith(".txt")
      ) {
        docs += size;
      } else if (
        mime.includes("image/") ||
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".gif")
      ) {
        imgs += size;
      } else if (
        mime.includes("video/") ||
        name.endsWith(".mp4") ||
        name.endsWith(".mkv") ||
        name.endsWith(".mov") ||
        name.endsWith(".avi")
      ) {
        vids += size;
      } else {
        others += size;
      }
    });
    return { docs, imgs, vids, others };
  };

  const categorySizes = getCategorySizes();

  // Filter files based on search & tab
  const getFilteredFiles = () => {
    let result = activeTab === "Trash" ? [...trashFiles] : [...files];

    // Filter by tab
    if (activeTab === "My Files") {
      // All files
    } else if (activeTab === "Shared") {
      result = result.filter((f) => f.shares && f.shares.length > 0);
    } else if (activeTab === "Recent") {
      result = result.filter((f) => new Date(f.createdAt) > recentCutoff);
    } else if (activeTab === "Starred") {
      result = result.filter((_, idx) => idx % 4 === 0);
    } else if (activeTab === "Trash") {
      result = [...trashFiles];
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) =>
        (f.originalFileName || "").toLowerCase().includes(q),
      );
    }

    return result;
  };

  const filteredFiles = getFilteredFiles();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-700 font-sans overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        storagePercentage={storagePercentage}
        totalStorageUsedBytes={totalStorageUsedBytes}
        formatBytes={formatBytes}
        currentUser={currentUser}
        handleLogout={handleLogout}
        onUploadClick={() => handleTabChange("Upload")}
      />

      {/* Main Panel */}
      <main className="grow flex flex-col min-h-screen p-6 lg:p-8 overflow-y-auto">
        {/* Top Header bar */}
        {!previewFile && (
          <TopBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setMobileSidebarOpen={setMobileSidebarOpen}
            currentUser={currentUser}
            onProfileClick={() => {}}
          />
        )}

        {previewFile ? (
          <FilePreview
            file={previewFile}
            onBack={() => setPreviewFile(null)}
            handleDownload={handleDownload}
            openShareModal={openShareModal}
            handleDelete={handleDelete}
            formatBytes={formatBytes}
            formatTimeAgo={formatTimeAgo}
            currentUser={currentUser}
          />
        ) : searchQuery.trim() ? (
          <SearchResults
            query={searchQuery}
            onFileClick={setPreviewFile}
            formatBytes={formatBytes}
            formatTimeAgo={formatTimeAgo}
          />
        ) : activeTab === "Upload" ? (
          <UploadPage formatBytes={formatBytes} />
        ) : activeTab === "Dashboard" ? (
          <>
            {/* Welcome Headers */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Welcome back, {currentUser?.firstName || "Alex"}!
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Here's what's happening with your files today.
              </p>
            </div>

            {/* Dynamic Metric Cards */}
            <MetricsRow
              totalFilesCount={totalFilesCount}
              sharedCount={sharedCount}
              totalStorageUsedBytes={totalStorageUsedBytes}
              formatBytes={formatBytes}
            />

            {/* Split grid */}
            <div className="grid grid-cols-[2fr_1fr] max-xl:grid-cols-1 gap-7 items-start">
              {/* Left Side: Recent Files list & Drag & Drop Area */}
              <div className="flex flex-col gap-6">
                <FileList
                  filteredFiles={filteredFiles}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  handleDownload={handleDownload}
                  openShareModal={openShareModal}
                  handleDelete={handleDelete}
                  handleRestore={handleRestore}
                  formatTimeAgo={formatTimeAgo}
                  formatBytes={formatBytes}
                  fileInputRef={fileInputRef}
                  handleUploadFiles={handleUploadFiles}
                  isDragActive={isDragActive}
                  setIsDragActive={setIsDragActive}
                  handleDrag={handleDrag}
                  handleDrop={handleDrop}
                  onFileClick={setPreviewFile}
                />
              </div>

              {/* Right Side: Storage details & Quick Actions */}
              <div className="flex flex-col gap-6">
                {/* Storage Overview Card */}
                <StorageOverview
                  totalStorageUsedBytes={totalStorageUsedBytes}
                  storagePercentage={storagePercentage}
                  formatBytes={formatBytes}
                  categorySizes={categorySizes}
                />

                {/* Quick Actions Card */}
                <QuickActions
                  onUploadClick={() => handleTabChange("Upload")}
                  onShareClick={() => {
                    if (files.length > 0) {
                      openShareModal(files[0], { stopPropagation: () => {} });
                    } else {
                      toast.warning("Upload a file first to share!");
                    }
                  }}
                  onTrashClick={() => setActiveTab("Trash")}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {activeTab}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {activeTab === "My Files"
                    ? "Manage and organize all your uploaded files."
                    : activeTab === "Trash"
                      ? "Files here can be restored within 15 days before permanent deletion."
                      : "Browse your workspace."}
                </p>
              </div>
              <div className="flex items-center bg-[#c62828] hover:bg-[#b71c1c] text-white rounded-xl shadow-xs transition-all duration-200">
                <button
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border-none bg-transparent text-white cursor-pointer outline-none"
                  onClick={() => handleTabChange("Upload")}
                >
                  <span className="text-lg font-light">+</span> New
                </button>
                <div className="w-[1px] h-5 bg-white/20 shrink-0" />
                <button
                  className="px-3 py-2 flex items-center justify-center border-none bg-transparent text-white cursor-pointer outline-none"
                  onClick={() => handleTabChange("Upload")}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            <FileList
              filteredFiles={filteredFiles}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeMenuId={activeMenuId}
              setActiveMenuId={setActiveMenuId}
              handleDownload={handleDownload}
              openShareModal={openShareModal}
              handleDelete={handleDelete}
              handleRestore={handleRestore}
              formatTimeAgo={formatTimeAgo}
              formatBytes={formatBytes}
              fileInputRef={fileInputRef}
              handleUploadFiles={handleUploadFiles}
              isDragActive={isDragActive}
              setIsDragActive={setIsDragActive}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
              onFileClick={setPreviewFile}
            />
          </>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <img
              src="/mascot.png"
              alt="Mascot"
              className="w-5 h-5 object-contain"
            />
            <span>© 2026 Kumori. All rights reserved.</span>
          </div>
          <div className="flex gap-5">
            <a
              href="#help"
              className="text-[13px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => toast.info("Help Center coming soon")}
            >
              Help Center
            </a>
            <a
              href="#privacy"
              className="text-[13px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => toast.info("Privacy Policy coming soon")}
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="text-[13px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => toast.info("Terms of Service coming soon")}
            >
              Terms of Service
            </a>
          </div>
        </footer>
      </main>

      {/* Share Modal Dialog */}
      {isShareModalOpen && (
        <ShareModal
          setIsShareModalOpen={setIsShareModalOpen}
          shareFile={shareFile}
          shareEmail={shareEmail}
          setShareEmail={setShareEmail}
          shareExpiration={shareExpiration}
          setShareExpiration={setShareExpiration}
          shareMessage={shareMessage}
          setShareMessage={setShareMessage}
          shareLinkSuccess={shareLinkSuccess}
          sharingInProgress={sharingInProgress}
          handleShareSubmit={handleShareSubmit}
          copyToClipboard={copyToClipboard}
          copied={copied}
        />
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmTarget?.isTrash ? "Delete Permanently" : "Move to Trash"}
        description={
          confirmTarget?.isTrash
            ? "Are you sure you want to permanently delete this file? This action cannot be undone and the file will be lost forever."
            : "Are you sure you want to delete this file? Deleted files will be moved to the Trash and kept for 15 days."
        }
        onClose={() => setConfirmOpen(false)}
        onPrimary={null}
        onDanger={confirmTarget?.isTrash ? onConfirmPermanentlyDelete : onConfirmMoveToTrash}
        dangerLabel={confirmTarget?.isTrash ? "Delete Permanently" : "Move to Trash"}
      />
    </div>
  );
}
