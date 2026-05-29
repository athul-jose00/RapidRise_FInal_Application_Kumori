import React from "react";
import StorageOverview from "../../components/dashboard/StorageOverview";
import TopBar from "../../components/dashboard/TopBar";
import Sidebar from "../../components/dashboard/Sidebar";
import useDashboardController from "../dashboard/hooks/useDashboardController.jsx";
import { useNavigate } from "react-router-dom";

export default function StorageOverviewPage() {
  const dashboard = useDashboardController();
  const files = dashboard.files || [];
  const navigate = useNavigate();

  // derive category sizes
  const sizes = files.reduce(
    (acc, f) => {
      const ext = (f.name || "").toLowerCase();
      if (ext.endsWith(".pdf") || ext.endsWith(".doc") || ext.endsWith(".docx") || ext.endsWith(".txt") || f.type?.startsWith("text")) {
        acc.docs += f.size || 0;
      } else if (f.type?.startsWith("image") || ext.match(/\.(png|jpe?g|gif|svg)$/)) {
        acc.imgs += f.size || 0;
      } else if (f.type?.startsWith("video") || ext.match(/\.(mp4|mov|mkv)$/)) {
        acc.vids += f.size || 0;
      } else {
        acc.others += f.size || 0;
      }
      return acc;
    },
    { docs: 0, imgs: 0, vids: 0, others: 0 }
  );

  const total = sizes.docs + sizes.imgs + sizes.vids + sizes.others;
  const formatBytes = dashboard.formatBytes;

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
                      className="text-sm font-semibold text-slate-600 hover:text-slate-800"
                      onClick={() => navigate(-1)}
                    >
                      Back
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-7 bg-white">
                    {/* Placeholder for donut chart */}
                    <div className="flex items-center gap-6">
                      <div className="w-56 h-56 rounded-full bg-gradient-to-br from-white to-slate-50 flex items-center justify-center shadow-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{formatBytes(total)}</div>
                          <div className="text-sm text-slate-500">of 200 GB used</div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <ul className="space-y-3">
                          <li className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-blue-500" />
                              <div>
                                <div className="font-medium">Documents</div>
                                <div className="text-sm text-slate-500">{formatBytes(sizes.docs)}</div>
                              </div>
                            </div>
                            <div className="text-sm text-slate-600">{total ? ((sizes.docs / total) * 100).toFixed(1) : 0}%</div>
                          </li>
                          <li className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-green-500" />
                              <div>
                                <div className="font-medium">Images</div>
                                <div className="text-sm text-slate-500">{formatBytes(sizes.imgs)}</div>
                              </div>
                            </div>
                            <div className="text-sm text-slate-600">{total ? ((sizes.imgs / total) * 100).toFixed(1) : 0}%</div>
                          </li>
                          <li className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-amber-500" />
                              <div>
                                <div className="font-medium">Videos</div>
                                <div className="text-sm text-slate-500">{formatBytes(sizes.vids)}</div>
                              </div>
                            </div>
                            <div className="text-sm text-slate-600">{total ? ((sizes.vids / total) * 100).toFixed(1) : 0}%</div>
                          </li>
                          <li className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-slate-400" />
                              <div>
                                <div className="font-medium">Other</div>
                                <div className="text-sm text-slate-500">{formatBytes(sizes.others)}</div>
                              </div>
                            </div>
                            <div className="text-sm text-slate-600">{total ? ((sizes.others / total) * 100).toFixed(1) : 0}%</div>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Storage by File Type table */}
                    <div className="mt-6 bg-white border border-slate-100 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Storage by File Type</h3>
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
                            { name: "Documents", size: sizes.docs, color: "bg-blue-500" },
                            { name: "Images", size: sizes.imgs, color: "bg-green-500" },
                            { name: "Videos", size: sizes.vids, color: "bg-amber-500" },
                            { name: "Other", size: sizes.others, color: "bg-slate-400" },
                          ].map((row) => (
                            <tr key={row.name} className="border-t border-slate-100">
                              <td className="py-3 flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full ${row.color}`} />
                                <div className="font-medium">{row.name}</div>
                              </td>
                              <td className="py-3">{formatBytes(row.size)}</td>
                              <td className="py-3 text-slate-600">{total ? ((row.size / total) * 100).toFixed(1) : 0}%</td>
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
                        <div className="flex justify-between py-1"><span>Total Storage</span><span>200 GB</span></div>
                        <div className="flex justify-between py-1"><span>Used Storage</span><span>{formatBytes(total)}</span></div>
                        <div className="flex justify-between py-1"><span>Available Storage</span><span>{formatBytes(200 * 1024 * 1024 * 1024 - total)}</span></div>
                        <div className="flex justify-between py-1"><span>Usage Percentage</span><span className="font-bold text-red-600">{total ? Math.round((total / (200 * 1024 * 1024 * 1024)) * 100) : 0}%</span></div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-xs mb-6">
                      <h4 className="font-semibold">Largest Files</h4>
                      <ul className="mt-3 text-sm space-y-3">
                        {files
                          .slice()
                          .sort((a, b) => (b.size || 0) - (a.size || 0))
                          .slice(0, 6)
                          .map((f) => (
                            <li key={f.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-red-50 text-red-600 font-bold">{(f.name || "")[0]}</div>
                                <div>
                                  <div className="font-medium">{f.name}</div>
                                  <div className="text-xs text-slate-500">{formatBytes(f.size)}</div>
                                </div>
                              </div>
                              <div className="text-sm text-slate-600">{formatBytes(f.size)}</div>
                            </li>
                          ))}
                      </ul>
                      <div className="mt-3 text-center">
                        <button className="text-sm font-semibold text-[#c62828]">View all files</button>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-xs">
                      <h4 className="font-semibold">Need More Space?</h4>
                      <p className="text-sm text-slate-500 mt-2">Upgrade your plan to get more storage and advanced features.</p>
                      <div className="mt-4">
                        <button className="px-4 py-2 rounded-lg bg-white text-[#c62828] border border-[#f5c6c6] font-semibold">Upgrade Now</button>
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
