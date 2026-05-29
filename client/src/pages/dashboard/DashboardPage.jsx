// Subcomponents
import Sidebar from "../../components/dashboard/Sidebar";
import TopBar from "../../components/dashboard/TopBar";
import ShareModal from "../../components/dashboard/ShareModal";
import FilePreview from "../../components/dashboard/FilePreview";
import ConfirmModal from "../../components/ui/ConfirmModal";
import UploadPage from "../../components/dashboard/UploadPage";
import SearchResults from "../../components/dashboard/SearchResults";
import ProfileSettingsModal from "../../components/dashboard/ProfileSettingsModal";
import useDashboardController from "./hooks/useDashboardController.jsx";
import { toast } from "react-toastify";

export default function DashboardPage() {
  const dashboard = useDashboardController();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-700 font-sans overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={dashboard.activeTab}
        setActiveTab={dashboard.handleTabChange}
        mobileSidebarOpen={dashboard.mobileSidebarOpen}
        setMobileSidebarOpen={dashboard.setMobileSidebarOpen}
        sidebarCollapsed={dashboard.sidebarCollapsed}
        setSidebarCollapsed={dashboard.setSidebarCollapsed}
        storagePercentage={dashboard.storagePercentage}
        totalStorageUsedBytes={dashboard.totalStorageUsedBytes}
        formatBytes={dashboard.formatBytes}
        currentUser={dashboard.currentUser}
        handleLogout={dashboard.handleLogout}
        onUploadClick={() => dashboard.handleTabChange("Upload")}
      />

      {/* Main Panel */}
      <main className="grow flex flex-col min-h-screen p-6 lg:p-8 overflow-y-auto">
        {/* Top Header bar */}
        {!dashboard.previewFile && (
          <TopBar
            searchQuery={dashboard.searchQuery}
            setSearchQuery={dashboard.setSearchQuery}
            setMobileSidebarOpen={dashboard.setMobileSidebarOpen}
            currentUser={dashboard.currentUser}
            onProfileSettingsClick={() => dashboard.setIsProfileModalOpen(true)}
            handleLogout={dashboard.handleLogout}
          />
        )}

        {dashboard.previewFile ? (
          <FilePreview
            file={dashboard.previewFile}
            onBack={() => dashboard.setPreviewFile(null)}
            handleDownload={dashboard.handleDownload}
            openShareModal={dashboard.openShareModal}
            handleDelete={dashboard.handleDelete}
            formatBytes={dashboard.formatBytes}
            formatTimeAgo={dashboard.formatTimeAgo}
            currentUser={dashboard.currentUser}
          />
        ) : dashboard.searchQuery.trim() ? (
          <SearchResults
            query={dashboard.searchQuery}
            onFileClick={dashboard.setPreviewFile}
            formatBytes={dashboard.formatBytes}
            formatTimeAgo={dashboard.formatTimeAgo}
          />
        ) : dashboard.activeTab === "Upload" ? (
          <UploadPage
            formatBytes={dashboard.formatBytes}
            files={dashboard.files}
          />
        ) : (
          dashboard.renderTabPage()
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
      {dashboard.isShareModalOpen && (
        <ShareModal
          setIsShareModalOpen={dashboard.setIsShareModalOpen}
          shareFile={dashboard.shareFile}
          shareEmail={dashboard.shareEmail}
          setShareEmail={dashboard.setShareEmail}
          shareExpiration={dashboard.shareExpiration}
          setShareExpiration={dashboard.setShareExpiration}
          shareMessage={dashboard.shareMessage}
          setShareMessage={dashboard.setShareMessage}
          shareLinkSuccess={dashboard.shareLinkSuccess}
          sharingInProgress={dashboard.sharingInProgress}
          handleShareSubmit={dashboard.handleShareSubmit}
          copyToClipboard={dashboard.copyToClipboard}
          copied={dashboard.copied}
        />
      )}
      <ConfirmModal
        isOpen={dashboard.confirmOpen}
        title={
          dashboard.confirmIsTrash ? "Delete Permanently" : "Move to Trash"
        }
        description={
          dashboard.confirmIsTrash
            ? "Are you sure you want to permanently delete this file? This action cannot be undone and the file will be lost forever."
            : "Are you sure you want to delete this file? Deleted files will be moved to the Trash and kept for 15 days."
        }
        onClose={() => dashboard.setConfirmOpen(false)}
        onPrimary={null}
        onDanger={
          dashboard.confirmIsTrash
            ? dashboard.onConfirmPermanentlyDelete
            : dashboard.onConfirmMoveToTrash
        }
        dangerLabel={
          dashboard.confirmIsTrash ? "Delete Permanently" : "Move to Trash"
        }
      />

      <ProfileSettingsModal
        isOpen={dashboard.isProfileModalOpen}
        onClose={() => dashboard.setIsProfileModalOpen(false)}
        currentUser={dashboard.currentUser}
      />
    </div>
  );
}
