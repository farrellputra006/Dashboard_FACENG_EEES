import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  TrendingUp,
  ShieldCheck,
  CalendarCheck2,
  LockKeyhole
} from 'lucide-react';
import logoSkkMigas from '../assets/images/logo-skkmigas.png';
import logoEnergyEquity from '../assets/images/logo-energy-equity.png';

export default function LoginPage() {
  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to dashboard or intended route
  useEffect(() => {
    if (isAuthenticated && user) {
      const target = location.state?.from?.pathname || '/';
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Email wajib diisi.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Format email tidak valid.';
    }

    if (!password) {
      errors.password = 'Password wajib diisi.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password, remember);
      const target = location.state?.from?.pathname || '/';
      navigate(target, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Email atau password salah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex w-full bg-slate-50 font-sans antialiased">
      {/* ======================================================== */}
      {/* 1. PANEL KIRI: ENTERPRISE BRANDING (Desktop >= lg)       */}
      {/* ======================================================== */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10 xl:p-14 flex-col justify-between relative overflow-hidden border-r border-slate-800 text-white">
        {/* Subtle geometric background accents matching dashboard */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Top: Logos Card */}
        <div className="relative z-10">
          <div className="inline-block bg-white rounded-2xl shadow-xl shadow-slate-950/40 p-4 border border-slate-200/90">
            <div className="flex items-center gap-5">
              <img
                src={logoSkkMigas}
                alt="Logo SKK Migas"
                className="h-11 w-auto object-contain"
              />
              <div className="h-9 w-px bg-slate-300" />
              <img
                src={logoEnergyEquity}
                alt="Logo Energy Equity"
                className="h-12 max-h-[80px] w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Center: Hero Information */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-300 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Energy Equity Epic (Sengkang) Pty. Ltd.
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Project Control <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Executive Dashboard
            </span>
          </h1>

          <p className="text-slate-300 text-sm xl:text-base leading-relaxed mb-8 max-w-md">
            Sistem monitoring terpadu progres proyek, kurva S, WBS kargo, pelaporan HSE, dan analisis deviasi mingguan.
          </p>

          {/* 3 Feature Bullet Points */}
          <div className="space-y-4 max-w-md">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-cyan-300 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">S-Curve Analysis & WBS Tracking</h4>
                <p className="text-xs text-slate-400">Komparasi akurat bobot rencana vs aktual mingguan dengan data deviasi langsung.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Pelaporan HSE & Jam Kerja Selamat</h4>
                <p className="text-xs text-slate-400">Monitoring real-time Safe Manhours, statistik Zero Accident, dan verifikasi lapangan.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Multi-Week History & Excel Import</h4>
                <p className="text-xs text-slate-400">Arsip mingguan terstruktur dengan integrasi upload laporan Excel / CSV otomatis.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Legal / Copyright */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span>&copy; {currentYear} Energy Equity Epic (Sengkang) Pty. Ltd.</span>
          <span className="font-mono text-[11px] text-slate-400">v2.1 Enterprise</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PANEL KANAN: FORM LOGIN                                */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative bg-slate-50">
        <div className="w-full max-w-md">
          {/* Logo card for Mobile (< lg) */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="inline-block bg-white rounded-2xl shadow-md p-4 border border-slate-200">
              <div className="flex items-center gap-4">
                <img
                  src={logoSkkMigas}
                  alt="Logo SKK Migas"
                  className="h-9 w-auto object-contain"
                />
                <div className="h-8 w-px bg-slate-300" />
                <img
                  src={logoEnergyEquity}
                  alt="Logo Energy Equity"
                  className="h-10 max-h-[70px] w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Login Card Header */}
          <div className="text-center sm:text-left mb-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
              <LockKeyhole className="w-3.5 h-3.5" />
              Autentikasi Pengguna
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke Akun Anda
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Gunakan akun yang diberikan administrator.
            </p>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs animate-in fade-in duration-200"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold block">Gagal Masuk</span>
                <span>{serverError}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Field: Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: null }));
                    }
                  }}
                  disabled={isSubmitting}
                  placeholder="contoh: control.faceng@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:ring-rose-400/50 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-blue-500/30 focus:border-blue-600'
                  }`}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-rose-600 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Field: Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: null }));
                    }
                  }}
                  disabled={isSubmitting}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-11 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:ring-rose-400/50 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-blue-500/30 focus:border-blue-600'
                  }`}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-rose-600 font-medium">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Help Text */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-medium">Ingat saya</span>
              </label>

              <span className="text-xs text-slate-500">
                Lupa password? <span className="font-semibold text-slate-700">Hubungi administrator.</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </form>

          {/* Akun Demo / Cepat Masuk Divisi FACENG */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pilih Akun Demo Divisi:
              </span>
              <span className="text-[10px] text-slate-400">1-Klik Isi Form</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin.faceng@example.com');
                  setPassword('admin123');
                  setFieldErrors({});
                  setServerError('');
                }}
                className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700 leading-tight truncate">
                  Admin
                </div>
                <div className="text-[9px] text-slate-500 leading-tight mt-0.5 font-mono truncate">
                  admin.faceng
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('control.faceng@example.com');
                  setPassword('control123');
                  setFieldErrors({});
                  setServerError('');
                }}
                className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700 leading-tight truncate">
                  Project Control
                </div>
                <div className="text-[9px] text-slate-500 leading-tight mt-0.5 font-mono truncate">
                  control.faceng
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('viewer.faceng@example.com');
                  setPassword('viewer123');
                  setFieldErrors({});
                  setServerError('');
                }}
                className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700 leading-tight truncate">
                  Viewer
                </div>
                <div className="text-[9px] text-slate-500 leading-tight mt-0.5 font-mono truncate">
                  viewer.faceng
                </div>
              </button>
            </div>
          </div>

          {/* Security Note Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Sistem ini hanya untuk pengguna yang berwenang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
