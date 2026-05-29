import MetricsRow from "../../../components/dashboard/MetricsRow";
import FileList from "../../../components/dashboard/FileList";
import StorageOverview from "../../../components/dashboard/StorageOverview";

export default function DashboardHomeTabPage({
  currentUser,
  totalFilesCount,
  sharedCount,
  totalStorageUsedBytes,
  formatBytes,
  fileListProps,
  storagePercentage,
  categorySizes,
  onUploadClick,
  onShareClick,
  onTrashClick,
}) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Welcome back, {currentUser?.firstName || "Alex"}!
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's what's happening with your files today.
        </p>
      </div>

      <MetricsRow
        totalFilesCount={totalFilesCount}
        sharedCount={sharedCount}
        totalStorageUsedBytes={totalStorageUsedBytes}
        formatBytes={formatBytes}
      />

      <div className="grid grid-cols-[2fr_1fr] max-xl:grid-cols-1 gap-7 items-start">
        <div className="flex flex-col gap-6">
          <FileList {...fileListProps} />
        </div>

        <div className="flex flex-col gap-6">
          <StorageOverview
            totalStorageUsedBytes={totalStorageUsedBytes}
            storagePercentage={storagePercentage}
            formatBytes={formatBytes}
            categorySizes={categorySizes}
          />
        </div>
      </div>
    </>
  );
}
