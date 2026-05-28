import { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  CheckCircle,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
} from "lucide-react";
import api from "../../api/axios";
import axios from "axios";
import { toast } from "react-toastify";

export default function UploadPage({ formatBytes }) {
  const [uploads, setUploads] = useState([]);
  const [completedUploads, setCompletedUploads] = useState([]);
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const activeIntervalsRef = useRef({});

  const getFileIcon = (fileName, mimeType) => {
    const name = fileName.toLowerCase();
    const mime = (mimeType || "").toLowerCase();
    if (mime.includes("pdf") || name.endsWith(".pdf")) {
      return <FileText className="text-red-500 w-8 h-8" />;
    }
    if (
      mime.includes("word") ||
      mime.includes("officedocument.wordprocessingml") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    ) {
      return <FileText className="text-blue-500 w-8 h-8" />;
    }
    if (
      mime.includes("excel") ||
      mime.includes("officedocument.spreadsheetml") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx")
    ) {
      return <FileSpreadsheet className="text-emerald-500 w-8 h-8" />;
    }
    if (
      mime.includes("image/") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".gif") ||
      name.endsWith(".webp")
    ) {
      return <ImageIcon className="text-cyan-500 w-8 h-8" />;
    }
    return <File className="text-slate-400 w-8 h-8" />;
  };

  const handleUploadFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    Array.from(selectedFiles).forEach((file) => {
      const uploadId = Math.random().toString(36).substring(2, 9);
      const cancelTokenSource = axios.CancelToken.source();

      const newUpload = {
        id: uploadId,
        name: file.name,
        type: file.type,
        size: file.size,
        loaded: 0,
        progress: 0,
        timeLeft: "Estimating...",
        status: "uploading",
        cancelTokenSource,
        startTime: Date.now(),
      };

      setUploads((prev) => [newUpload, ...prev]);

      // Start simulated progress interval to make the upload feel smooth
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        setUploads((prev) => {
          const upExists = prev.some((up) => up.id === uploadId);
          if (!upExists) {
            clearInterval(progressInterval);
            delete activeIntervalsRef.current[uploadId];
            return prev;
          }
          return prev.map((up) => {
            if (up.id === uploadId) {
              // Smooth step size: slower as it gets higher
              let step = 8;
              if (currentProgress >= 80) {
                step = 1.5;
              } else if (currentProgress >= 50) {
                step = 4;
              }
              currentProgress = Math.min(currentProgress + step, 95);

              const loaded = Math.round((file.size * currentProgress) / 100);
              const timeElapsed = (Date.now() - up.startTime) / 1000;
              const speed = timeElapsed > 0 ? loaded / timeElapsed : 0;
              const remainingBytes = file.size - loaded;
              let timeLeft = "Processing...";
              if (speed > 0 && currentProgress < 90) {
                const secondsLeft = Math.round(remainingBytes / speed);
                timeLeft = secondsLeft < 60 ? `${secondsLeft} secs left` : `${Math.floor(secondsLeft / 65)} mins left`;
              }

              return {
                ...up,
                progress: Math.round(currentProgress),
                loaded,
                timeLeft,
              };
            }
            return up;
          });
        });
      }, 150);

      activeIntervalsRef.current[uploadId] = progressInterval;

      const formData = new FormData();
      formData.append("files", file);

      api
        .post("/api/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          cancelToken: cancelTokenSource.token,
        })
        .then((res) => {
          clearInterval(progressInterval);
          delete activeIntervalsRef.current[uploadId];

          setUploads((prev) => prev.filter((up) => up.id !== uploadId));
          const fileRecord =
            res.data.files && res.data.files[0] ? res.data.files[0] : res.data.file;

          const now = new Date();
          const timestamp = now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          setCompletedUploads((prev) => [
            {
              id: fileRecord?.id || uploadId,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              time: `Today, ${timestamp}`,
            },
            ...prev,
          ]);

          toast.success(`${file.name} uploaded successfully!`);
        })
        .catch((err) => {
          clearInterval(progressInterval);
          delete activeIntervalsRef.current[uploadId];

          if (axios.isCancel(err)) {
            toast.info(`Upload for ${file.name} cancelled`);
          } else {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Upload failed for ${file.name}: ${msg}`);
            setUploads((prev) =>
              prev.map((up) =>
                up.id === uploadId ? { ...up, status: "failed" } : up,
              ),
            );
          }
        });
    });
  };

  const handleCancelUpload = (id) => {
    const upload = uploads.find((up) => up.id === id);
    if (upload && upload.cancelTokenSource) {
      upload.cancelTokenSource.cancel();
      if (activeIntervalsRef.current[id]) {
        clearInterval(activeIntervalsRef.current[id]);
        delete activeIntervalsRef.current[id];
      }
      setUploads((prev) => prev.filter((up) => up.id !== id));
    }
  };

  const handleCancelAll = () => {
    uploads.forEach((up) => {
      if (up.cancelTokenSource) {
        up.cancelTokenSource.cancel();
      }
      if (activeIntervalsRef.current[up.id]) {
        clearInterval(activeIntervalsRef.current[up.id]);
        delete activeIntervalsRef.current[up.id];
      }
    });
    setUploads([]);
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

  return (
    <div className="flex flex-col grow p-6 lg:p-8 bg-white min-h-0 overflow-y-auto">
      {/* Page Title Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Upload Files</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload files to your Kumori storage.
        </p>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 mb-8
          ${
            isDragActive
              ? "border-[#c62828] bg-red-50/15"
              : "border-red-200 bg-red-50/5 hover:border-[#c62828]/60 hover:bg-red-50/10"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUploadFiles(e.target.files)}
        />
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-[#c62828] mb-4">
          <UploadCloud size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Drag & drop files here to upload
        </h3>
        <span className="text-xs text-slate-400 mb-4 font-semibold">or</span>
        <button
          type="button"
          className="bg-[#c62828] hover:bg-[#b71c1c] text-white py-2 px-6 rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer border-none outline-none"
        >
          Choose Files
        </button>
        <p className="text-xs text-slate-400 mt-4 font-semibold">
          You can upload up to 10 GB per file
        </p>
      </div>

      {/* Uploads in Progress */}
      {uploads.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Upload in Progress ({uploads.length})
            </h3>
            <button
              onClick={handleCancelAll}
              className="text-xs font-bold text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer outline-none"
            >
              Cancel All
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {uploads.map((up) => (
              <div
                key={up.id}
                className="flex items-center gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl"
              >
                {getFileIcon(up.name, up.type)}
                <div className="grow min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[250px]">
                      {up.name}
                    </span>
                    <span className="text-[10px] text-slate-450 font-bold">
                      {formatBytes(up.loaded)} / {formatBytes(up.size)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden w-full">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-[width] duration-150 ease-out"
                      style={{ width: `${up.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-bold text-xs text-slate-700">
                  <span>{up.progress}%</span>
                  <span className="text-slate-450 text-[10px] min-w-16">
                    {up.timeLeft}
                  </span>
                  <button
                    onClick={() => handleCancelUpload(up.id)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-450 hover:text-slate-750 transition-colors border-none bg-transparent cursor-pointer outline-none flex items-center justify-center"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Uploads */}
      {completedUploads.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Completed ({completedUploads.length})
          </h3>
          <div className="flex flex-col gap-3">
            {completedUploads.map((up) => (
              <div
                key={up.id}
                className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(up.name, up.mimeType)}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 max-w-[300px] truncate">
                      {up.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                      {formatBytes(up.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-600">
                    Completed
                  </span>
                  <span className="text-slate-400 text-[10px] ml-2">
                    {up.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
