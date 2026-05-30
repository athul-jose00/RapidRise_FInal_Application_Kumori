import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import { selectCurrentUser } from "../../../redux/user/userSlice";
import SharedMainTable from "./shared/SharedMainTable";
import SharedSidePanel from "./shared/SharedSidePanel";

export default function SharedTabPage() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [isClosedByUser, setIsClosedByUser] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const currentUser = useSelector(selectCurrentUser);

  const fetchAllShares = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/shares");
      if (res.data && res.data.shares) {
        setShares(res.data.shares);
      }
    } catch (err) {
      console.error("Failed to load shares:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAllShares();
  }, []);

  // Group shares by fileId
  const getGroupedShares = () => {
    const groups = {};
    shares.forEach((share) => {
      const fileId = share.fileId;
      if (!groups[fileId]) {
        groups[fileId] = {
          fileId,
          fileName: share.fileName,
          fileSize: share.fileSize || 0,
          mimeType: share.mimeType || "",
          createdAt: share.createdAt,
          expiresAt: share.expiresAt,
          shares: [],
        };
      }
      groups[fileId].shares.push(share);

      // Keep latest created
      if (new Date(share.createdAt) > new Date(groups[fileId].createdAt)) {
        groups[fileId].createdAt = share.createdAt;
      }
      // Keep furthest expiresAt
      if (new Date(share.expiresAt) > new Date(groups[fileId].expiresAt)) {
        groups[fileId].expiresAt = share.expiresAt;
      }
    });

    // Sort grouped shares by latest share created timestamp
    return Object.values(groups).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  };

  const grouped = getGroupedShares();

  // Automatically select the latest share group if none selected and not closed by user
  useEffect(() => {
    if (grouped.length > 0 && !selectedFileId && !isClosedByUser) {
      setSelectedFileId(grouped[0].fileId);
    }
  }, [grouped, selectedFileId, isClosedByUser]);

  // Pagination calculations (8 items per page)
  const itemsPerPage = 8;
  const totalItems = grouped.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedGrouped = grouped.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const activeGroup = grouped.find((g) => g.fileId === selectedFileId) || null;

  // Helper formatting functions
  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return (
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      ", " +
      d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const formatTimeRemaining = (dateString) => {
    if (!dateString) return "-";
    const diff = new Date(dateString) - new Date();
    if (diff <= 0) return "Expired";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m left`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h left`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  const handleRevokeShare = async (shareId) => {
    try {
      setRevoking(true);
      await api.delete(`/api/shares/${shareId}`);
      toast.success("Share link revoked");
      await fetchAllShares();
    } catch (err) {
      console.error("Revoke failed:", err);
      toast.error(err.response?.data?.message || "Failed to revoke share link");
    } finally {
      setRevoking(false);
    }
  };

  const handleRevokeAllShares = async (shareIds) => {
    try {
      setRevoking(true);
      await Promise.all(shareIds.map((id) => api.delete(`/api/shares/${id}`)));
      toast.success("All selected share links revoked");
      await fetchAllShares();
    } catch (err) {
      console.error("Revoke all failed:", err);
      toast.error("Failed to revoke share links");
    } finally {
      setRevoking(false);
    }
  };

  const handleDeleteShare = async (shareId) => {
    try {
      setDeleting(true);
      await api.delete(`/api/shares/${shareId}/permanent`);
      toast.success("Share link deleted");
      // If we just deleted the last share in the active group, deselect the fileId
      if (activeGroup && activeGroup.shares.length === 1 && activeGroup.shares[0].id === shareId) {
        setSelectedFileId(null);
      }
      await fetchAllShares();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(err.response?.data?.message || "Failed to delete share link");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreShare = async (shareId) => {
    try {
      setRevoking(true);
      await api.post(`/api/shares/${shareId}/restore`);
      toast.success("Share link access restored");
      await fetchAllShares();
    } catch (err) {
      console.error("Restore failed:", err);
      toast.error(err.response?.data?.message || "Failed to restore share link access");
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#c62828] animate-spin" />
          <span className="text-slate-500 font-bold text-sm">Retrieving secure shared list...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col grow min-h-0">
      {/* Tab Title and Header actions */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Shared
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Files and folders that you have shared with others.
          </p>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 lg:items-start items-stretch overflow-hidden w-full min-w-0">
        <SharedMainTable
          groupedShares={paginatedGrouped}
          selectedFileId={selectedFileId}
          onSelectFile={(fileId) => {
            setSelectedFileId(fileId);
            setIsClosedByUser(false);
          }}
          formatBytes={formatBytes}
          formatDateTime={formatDateTime}
          formatTimeRemaining={formatTimeRemaining}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
        />

        {activeGroup && (
          <SharedSidePanel
            selectedGroup={activeGroup}
            onClose={() => {
              setSelectedFileId(null);
              setIsClosedByUser(true);
            }}
            formatBytes={formatBytes}
            formatDateTime={formatDateTime}
            formatTimeRemaining={formatTimeRemaining}
            currentUser={currentUser}
            onRevokeShare={handleRevokeShare}
            onRevokeAllShares={handleRevokeAllShares}
            onDeleteShare={handleDeleteShare}
            onRestoreShare={handleRestoreShare}
            revoking={revoking}
            deleting={deleting}
          />
        )}
      </div>
    </div>
  );
}
