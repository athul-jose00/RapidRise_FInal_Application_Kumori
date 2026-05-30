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
import { useDispatch, useSelector } from "react-redux";
import {
  addUpload,
  updateUpload,
  removeUpload,
  clearUploads,
  selectUploads,
} from "../../redux/uploads/uploadsSlice";
import { fetchFiles } from "../../redux/files/fileSlice";

const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;

export default function UploadPage({ formatBytes, files = [] }) {
  const dispatch = useDispatch();
  const uploads = useSelector(selectUploads);
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  // local cancel token refs (non-serializable)
  const cancelRefs = useRef({});

  const recentFiles = [
    ...uploads.map((up) => ({
      id: up.id,
      name: up.name,
      type: up.type,
      size: up.size,
      status: up.status,
      progress: up.progress,
      loaded: up.loaded,
      timeLeft: up.timeLeft,
      time: up.time,
    })),
    ...files.map((f) => ({
      id: f.id,
      name: f.originalFileName,
      type: f.mimeType,
      size: f.fileSize,
      status: "completed",
      time: new Date(f.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    })),
  ].slice(0, 2);

  const getFileIcon = (fileName, mimeType) => {
    const name = fileName.toLowerCase();
    const mime = (mimeType || "").toLowerCase();
    if (mime.includes("pdf") || name.endsWith(".pdf")) {
      return (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-600">
          <FileText size={18} />
        </div>
      );
    }
    if (
      mime.includes("word") ||
      mime.includes("officedocument.wordprocessingml") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    ) {
      return (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
          <FileText size={18} />
        </div>
      );
    }
    if (
      mime.includes("excel") ||
      mime.includes("officedocument.spreadsheetml") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx")
    ) {
      return (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
          <FileSpreadsheet size={18} />
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
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-cyan-50 text-cyan-600">
          <ImageIcon size={18} />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 text-slate-500">
        <File size={18} />
      </div>
    );
  };

  const handleUploadFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    Array.from(selectedFiles).forEach((file) => {
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        toast.error(`Upload failed for ${file.name}: Max file size is 100 MB.`);
        return;
      }

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
        startTime: Date.now(),
      };

      // store cancel token locally
      cancelRefs.current[uploadId] = cancelTokenSource;
      dispatch(addUpload(newUpload));

      const formData = new FormData();
      formData.append("files", file);

      api
        .post("/api/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          cancelToken: cancelTokenSource.token,
          onUploadProgress: (progressEvent) => {
            const loaded = progressEvent.loaded || 0;
            const total = progressEvent.total || file.size;
            const progress =
              total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;

            const entry = uploads.find((u) => u.id === uploadId) || newUpload;
            const elapsedSecs = Math.max(
              (Date.now() - entry.startTime) / 1000,
              0.1,
            );
            const bytesPerSec = loaded / elapsedSecs;
            const remainingBytes = Math.max(total - loaded, 0);
            let timeLeft = "Processing...";

            if (progress < 100 && bytesPerSec > 0) {
              const secondsLeft = Math.round(remainingBytes / bytesPerSec);
              timeLeft =
                secondsLeft < 60
                  ? `${secondsLeft} secs left`
                  : `${Math.floor(secondsLeft / 60)} mins left`;
            }

            if (progress >= 100) timeLeft = "Processing...";

            dispatch(
              updateUpload({ id: uploadId, loaded, progress, timeLeft }),
            );
          },
        })
        .then((res) => {
          // remove cancel ref
          delete cancelRefs.current[uploadId];

          const uploadedFiles = res.data?.files || [];
          const uploadedFile = uploadedFiles[0];

          if (!uploadedFile?.id) {
            dispatch(removeUpload(uploadId));
            toast.success(`${file.name} uploaded successfully!`);
            dispatch(fetchFiles());
            return;
          }

          // Update state to "AI indexing..."
          dispatch(
            updateUpload({
              id: uploadId,
              loaded: file.size,
              progress: 100,
              timeLeft: "AI indexing...",
            })
          );

          // Start polling the server status endpoint
          let pollCount = 0;
          const maxPolls = 15; // 30 seconds max (15 * 2s)
          const intervalId = setInterval(async () => {
            try {
              pollCount++;
              const statusRes = await api.get(`/api/files/${uploadedFile.id}/status`);
              if (statusRes.data?.processed || pollCount >= maxPolls) {
                clearInterval(intervalId);
                dispatch(removeUpload(uploadId));
                toast.success(`${file.name} uploaded successfully!`);
                dispatch(fetchFiles());
              }
            } catch (pollErr) {
              clearInterval(intervalId);
              dispatch(removeUpload(uploadId));
              toast.success(`${file.name} uploaded successfully!`);
              dispatch(fetchFiles());
            }
          }, 2000);
        })
        .catch((err) => {
          if (axios.isCancel(err)) {
            toast.info(`Upload for ${file.name} cancelled`);
          } else {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Upload failed for ${file.name}: ${msg}`);
            const existing =
              uploads.find((u) => u.id === uploadId) || newUpload;
            const loaded =
              existing.loaded ||
              Math.round((existing.size * existing.progress) / 100);
            dispatch(
              updateUpload({
                id: uploadId,
                status: "failed",
                timeLeft: "Upload failed",
                loaded,
              }),
            );
          }
        });
    });
  };

  const handleCancelUpload = (id) => {
    const cancelSrc = cancelRefs.current[id];
    if (cancelSrc) {
      cancelSrc.cancel();
      delete cancelRefs.current[id];
    }
    dispatch(removeUpload(id));
  };

  const handleCancelAll = () => {
    Object.values(cancelRefs.current).forEach(
      (src) => src && src.cancel && src.cancel(),
    );
    cancelRefs.current = {};
    dispatch(clearUploads());
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
                ${isDragActive ? "border-[#c62828] bg-red-50/15" : "border-red-200 bg-red-50/5 hover:border-[#c62828]/60 hover:bg-red-50/10"}
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
          You can upload up to 100 MB per file
        </p>
      </div>

      {/* Recent Uploads */}
      {recentFiles.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Files</h3>
            {uploads.length > 0 && (
              <button
                onClick={handleCancelAll}
                className="text-xs font-bold text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer outline-none"
              >
                Cancel All
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {recentFiles.map((up) => (
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
                      {up.status === "completed"
                        ? formatBytes(up.size)
                        : `${formatBytes(up.loaded || 0)} / ${formatBytes(up.size)}`}
                    </span>
                  </div>
                  {up.status !== "completed" && (
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden w-full">
                      <div
                        className={`h-full rounded-full transition-[width] duration-150 ease-out ${up.status === "failed" ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${up.progress || 0}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0 font-bold text-xs text-slate-700">
                  {up.status === "completed" ? (
                    <>
                      <CheckCircle size={15} className="text-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-600">
                        Completed
                      </span>
                      <span className="text-slate-400 text-[10px] ml-2">
                        {up.time}
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className={up.status === "failed" ? "text-red-600" : ""}
                      >
                        {up.status === "failed"
                          ? "Failed"
                          : `${up.progress || 0}%`}
                      </span>
                      <span
                        className={`text-[10px] min-w-16 ${up.status === "failed" ? "text-red-500" : "text-slate-450"}`}
                      >
                        {up.status === "failed" ? "Error" : up.timeLeft}
                      </span>
                      <button
                        onClick={() => handleCancelUpload(up.id)}
                        className={`p-1 rounded-lg transition-colors border-none bg-transparent cursor-pointer outline-none flex items-center justify-center ${up.status === "failed" ? "hover:bg-red-50 text-red-400 hover:text-red-600" : "hover:bg-slate-200 text-slate-450 hover:text-slate-750"}`}
                      >
                        <X size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
