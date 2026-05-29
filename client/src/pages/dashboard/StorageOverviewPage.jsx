import React from "react";
import StorageOverview from "../../components/dashboard/StorageOverview";
import TopBar from "../../components/dashboard/TopBar";
import Sidebar from "../../components/dashboard/Sidebar";
import useDashboardController from "../dashboard/hooks/useDashboardController.jsx";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  Archive,
  File,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { toast } from "react-toastify";

// File type icon resolver to match reference image colors
const getFileIcon = (mimeType, fileName = "") => {
  const mime = (mimeType || "").toLowerCase();
  const name = fileName.toLowerCase();

  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-[#c62828]">
        <FileText size={16} />
      </div>
    );
  }
  if (
    mime.includes("word") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
        <FileText size={16} />
      </div>
    );
  }
  if (
    mime.includes("excel") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
  ) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
        <FileSpreadsheet size={16} />
      </div>
    );
  }
  if (
    mime.includes("powerpoint") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx")
  ) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-50 text-orange-600">
        <Presentation size={16} />
      </div>
    );
  }
  if (
    mime.includes("image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".gif") ||
    name.endsWith(".webp")
  ) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-cyan-50 text-cyan-600">
        <ImageIcon size={16} />
      </div>
    );
  }
  if (
    mime.includes("zip") ||
    mime.includes("tar") ||
    mime.includes("rar") ||
    mime.includes("gzip") ||
    name.endsWith(".zip") ||
    name.endsWith(".rar") ||
    name.endsWith(".7z")
  ) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-600">
        <Archive size={16} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 text-slate-500">
      <File size={16} />
    </div>
  );
};

export default function StorageOverviewPage() {
  const dashboard = useDashboardController();
  const files = dashboard.files || [];
  const navigate = useNavigate();

  const sizes = dashboard.categorySizes || { docs: 0, imgs: 0, vids: 0, others: 0 };
  const total = dashboard.totalStorageUsedBytes || 0;
  const formatBytes = dashboard.formatBytes;
  const quota = 1 * 1024 * 1024 * 1024; // 1.0 GB limit

  const hasData = total > 0;
  const chartData = hasData
    ? [
        { name: "Documents", value: sizes.docs, color: "#3b82f6" },
        { name: "Images", value: sizes.imgs, color: "#22c55e" },
        { name: "Videos", value: sizes.vids, color: "#eab308" },
        { name: "Other", value: sizes.others, color: "#94a3b8" },
      ]
    : [{ name: "Available", value: 1, color: "#e2e8f0" }];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-700 font-sans">
      <Sidebar
        activeTab={dashboard.activeTab}
        setActiveTab={dashboard.setActiveTab}
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
      <main className="grow p-8">
        <TopBar
          searchQuery={dashboard.searchQuery}
          setSearchQuery={dashboard.setSearchQuery}
          setMobileSidebarOpen={dashboard.setMobileSidebarOpen}
          currentUser={dashboard.currentUser}
          onProfileSettingsClick={() => dashboard.setIsProfileModalOpen(true)}
          handleLogout={dashboard.handleLogout}
        />

        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-start gap-6">
            {/* Left column */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-xl font-bold">Storage Overview</h1>
                  <div className="flex items-center gap-3">
                    <button
                      className="text-sm font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                      onClick={() => navigate(-1)}
                    >
                      Back
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-7 bg-white">
                    {/* Donut chart */}
                    <div className="flex items-center gap-6">
                      <div className="w-56 h-56 relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={85}
                              paddingAngle={hasData ? 3 : 0}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            {hasData && (
                              <Tooltip
                                formatter={(value, name) => [formatBytes(value), name]}
                                contentStyle={{
                                  background: "rgba(255, 255, 255, 0.95)",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                              />
                            )}
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                          <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {formatBytes(total)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            of {formatBytes(quota)} used
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <ul className="space-y-3">
                          <li className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-blue-500" />
                              <div>
                                <div className="font-semibold text-slate-700">Documents</div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {formatBytes(sizes.docs)}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs font-bold text-slate-500">
                              {total
                                ? ((sizes.docs / total) * 100).toFixed(1)
                                : 0}
                              %
                            </div>
                          </li>
                          <li className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-green-500" />
                              <div>
                                <div className="font-semibold text-slate-700">Images</div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {formatBytes(sizes.imgs)}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs font-bold text-slate-500">
                              {total
                                ? ((sizes.imgs / total) * 100).toFixed(1)
                                : 0}
                              %
                            </div>
                          </li>
                          <li className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-amber-500" />
                              <div>
                                <div className="font-semibold text-slate-700">Videos</div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {formatBytes(sizes.vids)}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs font-bold text-slate-500">
                              {total
                                ? ((sizes.vids / total) * 100).toFixed(1)
                                : 0}
                              %
                            </div>
                          </li>
                          <li className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-slate-400" />
                              <div>
                                <div className="font-semibold text-slate-700">Other</div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {formatBytes(sizes.others)}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs font-bold text-slate-500">
                              {total
                                ? ((sizes.others / total) * 100).toFixed(1)
                                : 0}
                              %
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Storage by File Type table */}
                    <div className="mt-6 bg-white border border-slate-100 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">
                        Storage by File Type
                      </h3>
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500">
                          <tr>
                            <th className="py-2">File Type</th>
                            <th className="py-2">Size</th>
                            <th className="py-2">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              name: "Documents",
                              size: sizes.docs,
                              color: "bg-blue-500",
                            },
                            {
                              name: "Images",
                              size: sizes.imgs,
                              color: "bg-green-500",
                            },
                            {
                              name: "Videos",
                              size: sizes.vids,
                              color: "bg-amber-500",
                            },
                            {
                              name: "Other",
                              size: sizes.others,
                              color: "bg-slate-400",
                            },
                          ].map((row) => (
                            <tr
                              key={row.name}
                              className="border-t border-slate-100"
                            >
                              <td className="py-3 flex items-center gap-3">
                                <span
                                  className={`w-3 h-3 rounded-full ${row.color}`}
                                />
                                <div className="font-semibold text-slate-700">{row.name}</div>
                              </td>
                              <td className="py-3 text-xs font-bold text-slate-500">{formatBytes(row.size)}</td>
                              <td className="py-3 text-xs font-bold text-slate-400">
                                {total
                                  ? ((row.size / total) * 100).toFixed(1)
                                  : 0}
                                %
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="col-span-5">
                    <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-xs mb-6">
                      <h4 className="font-semibold">Storage Summary</h4>
                      <div className="mt-3 text-sm text-slate-600">
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500 font-medium">Total Storage</span>
                          <span className="font-bold text-slate-800">{formatBytes(quota)}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500 font-medium">Used Storage</span>
                          <span className="font-bold text-slate-800">{formatBytes(total)}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500 font-medium">Available Storage</span>
                          <span className="font-bold text-slate-800">
                            {formatBytes(Math.max(0, quota - total))}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500 font-medium">Usage Percentage</span>
                          <span className="font-extrabold text-[#c62828]">
                            {quota
                              ? Math.round((total / quota) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-xs mb-6">
                      <h4 className="font-semibold mb-3">Largest Files</h4>
                      <ul className="text-sm space-y-3">
                        {files.length === 0 ? (
                          <div className="text-center py-4 text-xs font-medium text-slate-400">
                            No files uploaded yet.
                          </div>
                        ) : (
                          files
                            .slice()
                            .sort((a, b) => (Number(b.fileSize) || 0) - (Number(a.fileSize) || 0))
                            .slice(0, 5)
                            .map((f) => (
                              <li
                                key={f.id}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  {getFileIcon(f.mimeType, f.originalFileName)}
                                  <div className="max-w-[120px] truncate">
                                    <div className="font-semibold text-slate-800 truncate" title={f.originalFileName}>
                                      {f.originalFileName}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-medium">
                                      {formatBytes(Number(f.fileSize))}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs font-bold text-slate-500">
                                  {formatBytes(Number(f.fileSize))}
                                </div>
                              </li>
                            ))
                        )}
                      </ul>
                      <div className="mt-3 text-center pt-2 border-t border-slate-50">
                        <button
                          className="text-xs font-bold text-[#c62828] hover:text-[#b71c1c] hover:underline cursor-pointer bg-transparent border-none outline-none"
                          onClick={() => navigate("/dashboard/files")}
                        >
                          View all files
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
