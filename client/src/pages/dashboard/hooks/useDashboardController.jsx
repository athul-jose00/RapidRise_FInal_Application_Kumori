import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  bulkDeleteFiles,
  bulkPermanentlyDeleteFiles,
  bulkRestoreFiles,
  generateBulkShareLink,
} from "../../../redux/files/fileSlice";
import {
  logoutUser,
  selectCurrentUser,
  selectAccessToken,
  setSidebarCollapsed as setSidebarCollapsedAction,
} from "../../../redux/user/userSlice";
import api from "../../../api/axios";
import { toast } from "react-toastify";
import DashboardHomeTabPage from "../tabs/DashboardHomeTabPage";
import MyFilesTabPage from "../tabs/MyFilesTabPage";
import SharedTabPage from "../tabs/SharedTabPage";
import RecentTabPage from "../tabs/RecentTabPage";
import TrashTabPage from "../tabs/TrashTabPage";

export default function useDashboardController() {
  const dispatch = useDispatch();
  const files = useSelector(selectFiles) || [];
  const trashFiles = useSelector(selectTrashFiles) || [];
  const currentUser = useSelector(selectCurrentUser);
  const accessToken = useSelector(selectAccessToken);

  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTabFromPath = (path) => {
    if (path === "/dashboard/files") return "My Files";
    if (path === "/dashboard/shared") return "Shared";
    if (path === "/dashboard/recent") return "Recent";
    if (path === "/dashboard/trash") return "Trash";
    if (path === "/dashboard/upload") return "Upload";
    return "Dashboard";
  };

  const activeTab = getActiveTabFromPath(location.pathname);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState([]);

  useEffect(() => {
    setSelectedFileIds([]);
  }, [searchQuery]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sidebarCollapsed = useSelector((s) => s.user.sidebarCollapsed);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [sharedCount, setSharedCount] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareExpiration, setShareExpiration] = useState("24");
  const [shareMessage, setShareMessage] = useState("");
  const [shareLinkSuccess, setShareLinkSuccess] = useState("");
  const [sharingInProgress, setSharingInProgress] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const fileInputRef = useRef(null);
  const recentCutoff = useRef(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
  ).current;

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

  useEffect(() => {
    if (activeTab === "Trash") {
      dispatch(fetchTrashFiles());
    }
    if (activeTab === "My Files") {
      dispatch(fetchFiles());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

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

  const handleTabChange = (tab) => {
    setPreviewFile(null);
    setSearchQuery("");
    setSelectedFileIds([]);
    if (tab === "My Files") navigate("/dashboard/files");
    else if (tab === "Shared") navigate("/dashboard/shared");
    else if (tab === "Recent") navigate("/dashboard/recent");
    else if (tab === "Trash") navigate("/dashboard/trash");
    else if (tab === "Upload") navigate("/dashboard/upload");
    else navigate("/dashboard");
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Successfully logged out");
    navigate("/login");
  };

  const handleDownload = async (file, e) => {
    e.stopPropagation();
    const toastId = toast.info(
      `Preparing download for ${file.originalFileName}...`,
    );
    try {
      const downloadUrl = `${api.defaults.baseURL || "http://localhost:3000"}/api/files/${file.id}/download${accessToken ? `?token=${encodeURIComponent(accessToken)}` : ""}`;
      window.location.assign(downloadUrl);
      toast.dismiss(toastId);
      toast.success("Download started!");
    } catch {
      toast.dismiss(toastId);
      toast.error("Download failed. Please try again.");
    }
  };

  const handleDelete = (idOrIds, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setConfirmTarget({ id: idOrIds, isTrash: activeTab === "Trash" });
    setConfirmOpen(true);
  };

  const onConfirmMoveToTrash = async () => {
    if (!confirmTarget) return;
    const target = confirmTarget.id;
    setConfirmOpen(false);
    try {
      if (Array.isArray(target)) {
        await dispatch(bulkDeleteFiles(target)).unwrap();
        toast.success(`${target.length} files moved to trash`);
      } else {
        await dispatch(deleteFile(target)).unwrap();
        toast.success("File moved to trash");
      }
      setSelectedFileIds([]);
      dispatch(fetchFiles());
      void refreshSharesCount();
    } catch (err) {
      toast.error(`Delete failed: ${err}`);
    }
  };

  const onConfirmPermanentlyDelete = async () => {
    if (!confirmTarget) return;
    const target = confirmTarget.id;
    setConfirmOpen(false);
    try {
      if (Array.isArray(target)) {
        await dispatch(bulkPermanentlyDeleteFiles(target)).unwrap();
        toast.success(`${target.length} files permanently deleted`);
      } else {
        await dispatch(permanentlyDeleteFile(target)).unwrap();
        toast.success("File permanently deleted");
      }
      setSelectedFileIds([]);
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

  const handleBulkRestore = async (ids) => {
    try {
      await dispatch(bulkRestoreFiles(ids)).unwrap();
      toast.success(`${ids.length} files restored successfully`);
      setSelectedFileIds([]);
      dispatch(fetchTrashFiles());
      dispatch(fetchFiles());
    } catch (err) {
      toast.error(`Restore failed: ${err}`);
    }
  };

  const handleBulkDownload = async (filesToDownload) => {
    const toastId = toast.info(`Preparing downloads for ${filesToDownload.length} files...`);
    try {
      filesToDownload.forEach((file) => {
        const downloadUrl = `${api.defaults.baseURL || "http://localhost:3000"}/api/files/${file.id}/download${accessToken ? `?token=${encodeURIComponent(accessToken)}` : ""}`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", file.originalFileName);
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
      toast.dismiss(toastId);
      toast.success(`Started downloads for ${filesToDownload.length} files!`);
      setSelectedFileIds([]);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Bulk download failed.");
    }
  };

  const openShareModal = (file, e) => {
    e.stopPropagation();
    setShareFile(file);
    setShareEmail("");
    setShareExpiration("24");
    setShareMessage("");
    setShareLinkSuccess("");
    setIsShareModalOpen(true);
  };

  const handleShareSubmit = async (e, emailsList) => {
    if (e) e.preventDefault();

    const emailsToShare = emailsList || (shareEmail ? [shareEmail] : []);
    if (emailsToShare.length === 0) {
      toast.error("Please enter or add at least one recipient email");
      return;
    }

    setSharingInProgress(true);
    try {
      const expHours = parseInt(shareExpiration);
      const isBulk = Array.isArray(shareFile);

      let actionResult;
      if (isBulk) {
        actionResult = await dispatch(
          generateBulkShareLink({
            fileIds: shareFile.map(f => f.id),
            recipientEmail: emailsToShare.join(", "),
            expirationHours: expHours,
            message: shareMessage,
          })
        ).unwrap();
      } else {
        actionResult = await dispatch(
          generateShareLink({
            id: shareFile.id,
            recipientEmail: emailsToShare.join(", "),
            expirationHours: expHours,
            message: shareMessage,
          })
        ).unwrap();
      }

      const shares = actionResult.shares || [];
      if (shares.length > 0) {
        setShareLinkSuccess(shares);
        toast.success(
          `${isBulk ? "Files" : "File"} successfully shared with ${emailsToShare.length} recipient(s)!`,
        );
        setSelectedFileIds([]);
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

  const totalFilesCount = files.length;
  const totalStorageUsedBytes = files.reduce(
    (acc, file) => acc + (Number(file.fileSize) || 0),
    0,
  );
  const totalStorageQuotaBytes = 1 * 1024 * 1024 * 1024;
  const storagePercentage = Math.min(
    100,
    Math.max(0, (totalStorageUsedBytes / totalStorageQuotaBytes) * 100),
  );

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

  const getFilteredFiles = () => {
    let result = activeTab === "Trash" ? [...trashFiles] : [...files];

    if (activeTab === "Shared") {
      result = result.filter((f) => f.shares && f.shares.length > 0);
    } else if (activeTab === "Recent") {
      result = result.filter((f) => new Date(f.createdAt) > recentCutoff);
    } else if (activeTab === "Trash") {
      result = [...trashFiles];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) =>
        (f.originalFileName || "").toLowerCase().includes(q),
      );
    }

    return result;
  };

  const filteredFiles = getFilteredFiles();

  const fileListProps = {
    filteredFiles,
    activeTab,
    setActiveTab: handleTabChange,
    activeMenuId,
    setActiveMenuId,
    handleDownload,
    openShareModal,
    handleDelete,
    handleRestore,
    formatTimeAgo,
    formatBytes,
    fileInputRef,
    handleUploadFiles,
    isDragActive,
    setIsDragActive,
    handleDrag,
    handleDrop,
    onFileClick: setPreviewFile,
    selectedFileIds,
    setSelectedFileIds,
    handleBulkRestore,
    handleBulkDownload,
  };

  const openShareFromDashboard = () => {
    if (files.length > 0) {
      openShareModal(files[0], { stopPropagation: () => {} });
    } else {
      toast.warning("Upload a file first to share!");
    }
  };

  const onCreateNew = () => handleTabChange("Upload");

  const renderTabPage = () => {
    if (activeTab === "Dashboard") {
      return (
        <DashboardHomeTabPage
          currentUser={currentUser}
          totalFilesCount={totalFilesCount}
          sharedCount={sharedCount}
          totalStorageUsedBytes={totalStorageUsedBytes}
          formatBytes={formatBytes}
          fileListProps={fileListProps}
          storagePercentage={storagePercentage}
          categorySizes={categorySizes}
          onUploadClick={() => handleTabChange("Upload")}
          onShareClick={openShareFromDashboard}
          onTrashClick={() => handleTabChange("Trash")}
        />
      );
    }

    if (activeTab === "My Files") {
      return (
        <MyFilesTabPage
          onCreateNew={onCreateNew}
          fileListProps={fileListProps}
        />
      );
    }

    if (activeTab === "Shared") {
      return (
        <SharedTabPage
          onCreateNew={onCreateNew}
          fileListProps={fileListProps}
        />
      );
    }

    if (activeTab === "Recent") {
      return (
        <RecentTabPage
          onCreateNew={onCreateNew}
          fileListProps={fileListProps}
        />
      );
    }



    if (activeTab === "Trash") {
      return (
        <TrashTabPage onCreateNew={onCreateNew} fileListProps={fileListProps} />
      );
    }

    return null;
  };

  return {
    files,
    trashFiles,
    currentUser,
    activeTab,
    setActiveTab: handleTabChange,
    searchQuery,
    setSearchQuery,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed: (val) => dispatch(setSidebarCollapsedAction(!!val)),
    selectedFileIds,
    setSelectedFileIds,
    handleBulkRestore,
    handleBulkDownload,
    previewFile,
    setPreviewFile,
    isProfileModalOpen,
    setIsProfileModalOpen,
    sharedCount,
    isShareModalOpen,
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
    copied,
    handleTabChange,
    handleLogout,
    handleDownload,
    handleDelete,
    onConfirmMoveToTrash,
    onConfirmPermanentlyDelete,
    handleRestore,
    openShareModal,
    handleShareSubmit,
    copyToClipboard,
    fileInputRef,
    isDragActive,
    setIsDragActive,
    confirmOpen,
    setConfirmOpen,
    confirmTarget,
    confirmIsTrash: Boolean(confirmTarget?.isTrash),
    totalFilesCount,
    totalStorageUsedBytes,
    storagePercentage,
    formatBytes,
    formatTimeAgo,
    categorySizes,
    fileListProps,
    renderTabPage,
    refreshSharesCount,
    setPreviewFile,
  };
}
