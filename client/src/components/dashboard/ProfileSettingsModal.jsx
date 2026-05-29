import React, { useRef, useState } from "react";
import { X, Upload, User, Loader2, Lock } from "lucide-react";
import { useDispatch } from "react-redux";
import { updateProfileImage } from "../../redux/user/userSlice";
import { toast } from "react-toastify";
import api from "../../api/axios";

export default function ProfileSettingsModal({ isOpen, onClose, currentUser }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", file);

    setIsUploading(true);
    try {
      await dispatch(updateProfileImage(formData)).unwrap();
      toast.success("Profile image updated successfully!");
    } catch (error) {
      toast.error(error || "Failed to update profile image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharPattern.test(newPassword)) {
      toast.error("Password must include at least one special character");
      return;
    }

    const toastId = toast.info("Changing password...", { autoClose: false });
    setIsChangingPassword(true);

    try {
      await api.post("/api/auth/change-password", {
        oldPassword,
        newPassword,
        confirmPassword,
      });

      toast.update(toastId, {
        render: "Password changed successfully!",
        type: "success",
        autoClose: 3000,
      });

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to change password";
      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        autoClose: 5000,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-xl transition-colors cursor-pointer border-none outline-none"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center shadow-inner">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                ) : currentUser?.profileImage ? (
                  <img 
                    src={currentUser.profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-slate-300" />
                )}
              </div>
              
              <button
                className="absolute bottom-0 right-0 bg-[#c62828] text-white p-2 rounded-full shadow-lg hover:bg-[#b71c1c] hover:scale-110 transition-all cursor-pointer border-none"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Change Image"
              >
                <Upload size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800">
              {currentUser?.firstName} {currentUser?.lastName}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{currentUser?.email}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Account Details</p>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">First Name</span>
                  <span className="text-sm font-medium text-slate-800">{currentUser?.firstName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Last Name</span>
                  <span className="text-sm font-medium text-slate-800">{currentUser?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Email</span>
                  <span className="text-sm font-medium text-slate-800">{currentUser?.email}</span>
                </div>
              </div>
            </div>

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-150 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer border border-slate-200 outline-none"
              >
                <Lock size={16} />
                Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Change Password</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      disabled={isChangingPassword}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c62828] focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 special char"
                      disabled={isChangingPassword}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c62828] focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={isChangingPassword}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c62828] focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#c62828] hover:bg-[#b71c1c] disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer border-none outline-none"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          Update Password
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      disabled={isChangingPassword}
                      className="flex-1 px-3 py-2 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 font-semibold text-sm rounded-lg transition-colors cursor-pointer border border-slate-200 outline-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
