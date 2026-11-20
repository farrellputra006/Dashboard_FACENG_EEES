import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  KeyRound,
  Users,
  UserPlus,
  Edit3,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Briefcase,
  ShieldAlert,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AccountSettingsModal({ isOpen, onClose }) {
  const { user: currentUser, logout } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Active top tab in Settings Modal: 'password' | 'users' | 'profile'
  const [activeTab, setActiveTab] = useState(() => (isAdmin ? 'users' : 'password'));

  // Update default tab if user role loads
  useEffect(() => {
    if (isAdmin) {
      setActiveTab('users');
    } else {
      setActiveTab('password');
    }
  }, [isAdmin]);

  // ==========================================
  // TAB 1: GANTI PASSWORD MANDIRI
  // ==========================================
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Password saat ini wajib diisi.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password baru minimal harus 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await apiRequest('/api/profile/password', {
        method: 'PUT',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordSuccess(data.message || 'Password berhasil diperbarui.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.message || 'Gagal memperbarui password. Silakan periksa password lama Anda.');
      }
    } catch {
      setPasswordError('Terjadi kesalahan jaringan saat memperbarui password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ==========================================
  // TAB 2: MANAJEMEN USER (KHUSUS ADMIN)
  // ==========================================
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setUsersLoading(true);
      setUsersError('');
      const res = await apiRequest('/api/users');
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList(data.users || []);
      } else {
        setUsersError(data.message || 'Gagal memuat daftar pengguna.');
      }
    } catch {
      setUsersError('Terjadi kesalahan koneksi saat memuat pengguna.');
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchUsers();
    }
  }, [isOpen, isAdmin, fetchUsers]);

  // Modal State: Tambah / Edit User
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = mode tambah, object = mode edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'project_control',
    job_title: '',
    password: '',
  });
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [userModalError, setUserModalError] = useState('');
  const [userModalSuccess, setUserModalSuccess] = useState('');

  const openCreateUserModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'project_control',
      job_title: '',
      password: '',
    });
    setUserModalError('');
    setUserModalSuccess('');
    setUserModalOpen(true);
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      job_title: user.job_title || '',
      password: '', // Blank by default on edit
    });
    setUserModalError('');
    setUserModalSuccess('');
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserModalError('');
    setUserModalSuccess('');

    if (!formData.name.trim()) {
      setUserModalError('Nama lengkap pengguna wajib diisi.');
      return;
    }
    if (!formData.email.trim()) {
      setUserModalError('Alamat email wajib diisi.');
      return;
    }
    if (!editingUser && (!formData.password || formData.password.length < 8)) {
      setUserModalError('Password wajib diisi minimal 8 karakter untuk user baru.');
      return;
    }
    if (editingUser && formData.password && formData.password.length < 8) {
      setUserModalError('Jika ingin mereset password, minimal harus 8 karakter.');
      return;
    }

    try {
      setUserModalLoading(true);
      const isEdit = Boolean(editingUser);
      const endpoint = isEdit ? `/api/users/${editingUser.id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        job_title: formData.job_title.trim() || undefined,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await apiRequest(endpoint, {
        method,
        body: payload,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUserModalSuccess(data.message || 'Data pengguna berhasil disimpan.');
        await fetchUsers();
        setTimeout(() => {
          setUserModalOpen(false);
        }, 800);
      } else {
        setUserModalError(data.message || 'Gagal menyimpan data pengguna.');
      }
    } catch {
      setUserModalError('Terjadi kesalahan jaringan.');
    } finally {
      setUserModalLoading(false);
    }
  };

  // Delete User Confirmation State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      setDeleteLoading(true);
      setDeleteError('');
      const res = await apiRequest(`/api/users/${deleteConfirmUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteConfirmUser(null);
        await fetchUsers();
      } else {
        setDeleteError(data.message || 'Gagal menghapus pengguna.');
      }
    } catch {
      setDeleteError('Terjadi kesalahan jaringan.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Pengaturan Akun & Keamanan
              </h2>
              <p className="text-xs text-slate-500">
                Energy Equity Epic (Sengkang) Pty. Ltd. • FACENG Project Control
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manajemen User</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                {usersList.length || '3'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Ganti Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Informasi Profil</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* ========================================================= */}
          {/* TAB: MANAJEMEN USER (KHUSUS ADMIN)                        */}
          {/* ========================================================= */}
          {activeTab === 'users' && isAdmin && (
            <div className="space-y-4">
              {/* Header Tab */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Daftar Pengguna Sistem</span>
                    <span className="text-[11px] font-semibold text-slate-400 font-mono">
                      ({usersList.length} Akun Terdaftar)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hanya Administrator yang memiliki wewenang untuk menambah, mengubah, dan mereset password user.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchUsers}
                    disabled={usersLoading}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    title="Muat Ulang Data User"
                  >
                    <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin text-blue-600' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={openCreateUserModal}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:shadow"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambah User</span>
                  </button>
                </div>
              </div>

              {/* Alert Error if any */}
              {usersError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{usersError}</span>
                </div>
              )}

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Pengguna</th>
                        <th className="py-3 px-4">Alamat Email</th>
                        <th className="py-3 px-4">Role / Hak Akses</th>
                        <th className="py-3 px-4">Jabatan / Divisi</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersLoading && usersList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-400">
                            <div className="ee-loader mx-auto mb-3"></div>
                            <span className="text-xs font-semibold text-slate-500">Memuat daftar pengguna...</span>
                          </td>
                        </tr>
                      ) : usersList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-400">
                            Tidak ada data pengguna ditemukan.
                          </td>
                        </tr>
                      ) : (
                        usersList.map((u) => {
                          const isSelf = currentUser?.id === u.id;
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                    {getInitials(u.name)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                      <span>{u.name}</span>
                                      {isSelf && (
                                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full">
                                          Anda
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      ID: #{u.id}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 font-mono text-slate-600">
                                {u.email}
                              </td>

                              <td className="py-3 px-4">
                                {u.role === 'admin' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                                    Admin
                                  </span>
                                ) : u.role === 'project_control' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <Briefcase className="w-3 h-3 text-blue-600" />
                                    Project Control
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    <User className="w-3 h-3 text-slate-500" />
                                    Viewer
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-slate-600">
                                {u.job_title || '-'}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditUserModal(u)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="Edit data / Reset password"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmUser(u)}
                                    disabled={isSelf}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isSelf
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                    }`}
                                    title={isSelf ? 'Anda tidak dapat menghapus akun Anda sendiri' : 'Hapus pengguna'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: GANTI PASSWORD MANDIRI                                */}
          {/* ========================================================= */}
          {activeTab === 'password' && (
            <div className="max-w-xl mx-auto space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Perbarui Kata Sandi Akun</h3>
                    <p className="text-xs text-slate-500">
                      Ganti kata sandi secara berkala untuk menjaga keamanan akun Anda.
                    </p>
                  </div>
                </div>

                {/* Notifications */}
                {passwordSuccess && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password Saat Ini <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Masukkan password lama"
                        disabled={passwordLoading}
                        className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password Baru <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter kombinasi"
                        disabled={passwordLoading}
                        className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Panjang kata sandi minimal 8 karakter.
                    </span>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Konfirmasi Password Baru <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ketik ulang password baru"
                        disabled={passwordLoading}
                        className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan Password...</span>
                        </>
                      ) : (
                        <span>Simpan Password Baru</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: INFORMASI PROFIL                                     */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <div className="max-w-xl mx-auto space-y-4 text-xs">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-xs shrink-0">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-900 truncate">{currentUser?.name}</h3>
                  <p className="text-xs text-blue-600 font-semibold">{currentUser?.job_title || 'Project Control Engineer'}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{currentUser?.email}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Peran / Hak Akses:</span>
                  <span className="font-bold text-slate-800 capitalize bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {currentUser?.role || 'project_control'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Divisi & Operasional:</span>
                  <span className="font-semibold text-slate-800">FACENG (Facility Engineering)</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Aplikasi:</span>
                  <span className="font-semibold text-slate-800">Energy Equity Control v2.5</span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Status Autentikasi:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi Sanctum Bearer
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INNER MODAL: TAMBAH / EDIT USER (ADMIN ONLY)              */}
      {/* ========================================================= */}
      {userModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  {editingUser ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              {userModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userModalError}</span>
                </div>
              )}

              {userModalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{userModalSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="misal: Project Control FACENG"
                    disabled={userModalLoading}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contoh: user.faceng@example.com"
                    disabled={userModalLoading}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Hak Akses <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={userModalLoading}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="admin">Admin (Penuh)</option>
                    <option value="project_control">Project Control</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Tim
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    placeholder="misal: Engineer"
                    disabled={userModalLoading}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi {editingUser ? '(Opsional - Reset Password)' : <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah password' : 'Min. 8 karakter'}
                    disabled={userModalLoading}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {editingUser && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Hanya isi kolom ini jika Anda ingin mengganti/mereset password akun user ini.
                  </span>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  disabled={userModalLoading}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={userModalLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors"
                >
                  {userModalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Pengguna</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INNER MODAL: KONFIRMASI HAPUS USER (ADMIN ONLY)           */}
      {/* ========================================================= */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Pengguna</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <strong className="text-slate-800">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})?
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Dokumen dan data proyek yang pernah diunggah akan tetap aman di sistem.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Akun</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
