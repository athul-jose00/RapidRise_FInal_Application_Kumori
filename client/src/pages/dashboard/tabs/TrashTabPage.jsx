import React, { useState } from "react";
import StandardFilesTabPage from "./StandardFilesTabPage";
import { Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { emptyTrash, selectTrashFiles } from "../../../redux/files/fileSlice";
import { toast } from "react-toastify";

export default function TrashTabPage({ fileListProps }) {
  const dispatch = useDispatch();
  const trashFiles = useSelector(selectTrashFiles) || [];
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEmptyTrash = async () => {
    setIsDeleting(true);
    try {
      await dispatch(emptyTrash()).unwrap();
      toast.success("Trash emptied successfully");
      setIsConfirmOpen(false);
    } catch (err) {
      toast.error(`Failed to empty trash: ${err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const rightActions = trashFiles.length > 0 ? (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all duration-200 shadow-xs cursor-pointer outline-none"
      >
        <Trash2 size={16} />
        Empty Trash
      </button>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Empty Trash?</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600">
                Are you sure you want to permanently delete all items in the Trash? This action cannot be undone, and all associated file assets will be purged.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-sm outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-xl transition-all cursor-pointer border-none shadow-sm outline-none"
              >
                {isDeleting ? "Emptying..." : "Empty Trash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  ) : null;

  return (
    <StandardFilesTabPage
      title="Trash"
      description="Files here can be restored within 15 days before permanent deletion."
      fileListProps={fileListProps}
      showNewButton={false}
      rightActions={rightActions}
    />
  );
}
