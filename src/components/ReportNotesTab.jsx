import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

import {
  Save,
  Printer,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  Table as TableIcon,
  Plus,
  Trash2,
  FileText,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ChevronDown,
  Columns,
  Rows,
  Sparkles,
  LayoutTemplate
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import ProjectAttachmentsCard from './ProjectAttachmentsCard';

// Template Standar Resmi FACENG (Area of Concern, Risk Register, Issue Register)
const FACENG_STANDARD_TEMPLATE_HTML = `<h2>1. Area of Concern</h2>
<ol>
  <li>Keterlambatan penyelesaian pekerjaan pengelasan spool pipa tie-in header gas (evaluasi revisi jadwal kerja kontraktor).</li>
  <li>Kondisi cuaca hujan dengan intensitas tinggi di area Sengkang yang berpotensi menghambat pergerakan alat berat di site.</li>
  <li>Penerbitan Permit to Work (PTW) simultan antara tim kontraktor dan pihak operasi stasiun eksisting.</li>
</ol>

<h2>2. Risk Register</h2>
<table>
  <thead>
    <tr>
      <th style="width: 22%;">Risk Category</th>
      <th style="width: 26%;">Root Causes</th>
      <th style="width: 26%;">Consequence</th>
      <th style="width: 26%;">Mitigations</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Technical / Engineering</strong></td>
      <td>Ketidaksesuaian elevasi spool pipa dengan flange sambungan eksisting.</td>
      <td>
        <ul>
          <li>Potensi re-welding dan pemotongan ulang di site.
            <ul>
              <li>Penambahan jam kerja teknisi las.</li>
              <li>Potensi delay commissioning 2-3 hari.</li>
            </ul>
          </li>
        </ul>
      </td>
      <td>
        <ul>
          <li>Lakukan 3D laser scan dan joint dimensional check sebelum final tie-in.
            <ul>
              <li>Verifikasi ulang gambar isometrik approved.</li>
            </ul>
          </li>
          <li>Standby tim fit-up dan welder bersertifikat 24 jam.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Safety / HSE</strong></td>
      <td>Lifting operation modul kompresor 42-ton pada kondisi tanah lunak.</td>
      <td>
        <ul>
          <li>Penurunan tumpuan outrigger mobile crane 80-ton.</li>
          <li>Risiko kerusakan alat berat dan insiden near miss.</li>
        </ul>
      </td>
      <td>
        <ul>
          <li>Pemasangan steel plate crane mat tebal di seluruh titik outrigger.</li>
          <li>Pengujian soil compaction (CBR test) sebelum posisi crane disetujui.</li>
          <li>Pelaksanaan toolbox meeting khusus dan safety briefing pra-lifting.</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

<h2>3. Issue Register</h2>
<ul>
  <li><strong>Issue #01:</strong> Dokumen sertifikasi kalibrasi Safety Relief Valve (SRV) dari Ditjen Migas masih dalam proses review akhir.</li>
  <li><strong>Issue #02:</strong> Kebutuhan penambahan 2 orang rigger bersertifikasi Migas level-1 untuk pekerjaan minggu depan.</li>
</ul>`;

export default function ReportNotesTab({
  projectId = 1,
  selectedWeek = 'Week 12',
  currentProject
}) {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';

  const rawId = currentProject?.rawId || (typeof projectId === 'string' ? projectId.replace('proj-', '') : projectId) || 1;

  // Document metadata state
  const [docTitle, setDocTitle] = useState(`Project Notes & Risk — ${selectedWeek}`);
  const [lastSaved, setLastSaved] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isTableMenuOpen, setIsTableMenuOpen] = useState(false);
  const tableMenuRef = useRef(null);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Tiptap Editor Initialization
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    editable: !isViewer,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[550px] text-slate-800 text-sm leading-relaxed p-6 sm:p-12 font-sans bg-white',
      },
    },
  });

  // Keep editable status synced with role
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isViewer);
    }
  }, [editor, isViewer]);

  // Close table dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(e.target)) {
        setIsTableMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch document from backend API
  const fetchDocument = useCallback(async () => {
    if (!rawId) return;
    setIsLoadingDoc(true);

    try {
      const res = await apiRequest(`/api/project-documents?project_id=${rawId}&week=${encodeURIComponent(selectedWeek)}`, {
        method: 'GET',
      });
      const data = await res.json();

      if (res.ok && data.success && data.document) {
        const doc = data.document;
        setDocTitle(doc.title || `Project Notes & Risk — ${selectedWeek}`);
        setUpdatedBy(doc.updated_by || null);
        setLastSaved(doc.updated_at ? new Date(doc.updated_at) : null);

        if (editor) {
          const initialContent = doc.content || FACENG_STANDARD_TEMPLATE_HTML;
          editor.commands.setContent(initialContent);
        }
      }
    } catch (err) {
      showToast('Gagal memuat dokumen laporan dari database.', 'error');
    } finally {
      setIsLoadingDoc(false);
    }
  }, [rawId, selectedWeek, editor]);

  // Fetch when rawId, selectedWeek, or editor instance is ready
  useEffect(() => {
    if (editor) {
      fetchDocument();
    }
  }, [editor, rawId, selectedWeek, fetchDocument]);

  // Handle 1-Click Apply FACENG Standard Template
  const handleApplyFacengTemplate = () => {
    if (isViewer) return;
    if (!editor) return;

    const currentText = editor.getText().trim();
    if (currentText.length > 0) {
      const confirmApply = window.confirm(
        'Apakah Anda ingin menerapkan Template Standar FACENG (Area of Concern & Risk Register)?\n\nIsi dokumen saat ini akan digantikan dengan kerangka standar resmi. Lanjutkan?'
      );
      if (!confirmApply) return;
    }

    editor.commands.setContent(FACENG_STANDARD_TEMPLATE_HTML);
    showToast('Template Standar FACENG (Area of Concern & Risk Register) berhasil diterapkan!');
  };

  // Handle Save Document (POST /api/project-documents)
  const handleSaveDocument = async () => {
    if (isViewer) {
      showToast('Akses ditolak: Akun Viewer tidak memiliki izin menyimpan dokumen.', 'error');
      return;
    }

    if (!editor) return;

    setIsSaving(true);
    const htmlContent = editor.getHTML();

    try {
      const res = await apiRequest('/api/project-documents', {
        method: 'POST',
        body: {
          project_id: rawId,
          week: selectedWeek,
          title: docTitle.trim() || `Project Notes & Risk — ${selectedWeek}`,
          content: htmlContent,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || 'Gagal menyimpan dokumen.', 'error');
        return;
      }

      setLastSaved(new Date());
      setUpdatedBy(data.document?.updated_by || user?.name || 'Project Control');
      showToast('Dokumen Project Notes & Risk berhasil disimpan ke database!');
    } catch (err) {
      showToast('Terjadi kesalahan jaringan saat menyimpan dokumen.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Print / PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`no-print p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Document Header & Action Bar */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              {selectedWeek} • {currentProject?.code || 'EEES'}
            </span>
            {lastSaved && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  Disimpan:{' '}
                  {lastSaved.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {updatedBy ? ` oleh ${updatedBy}` : ''}
                </span>
              </span>
            )}
          </div>

          {!isViewer ? (
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Judul Dokumen / Laporan..."
              className="text-lg sm:text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full transition-colors"
            />
          ) : (
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">{docTitle}</h2>
          )}
        </div>

        {/* Action Buttons: 1-Click Template, Print & Save */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isViewer && (
            <button
              type="button"
              onClick={handleApplyFacengTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all group"
              title="Sisipkan kerangka resmi: Area of Concern, Risk Register (Tabel 4 Kolom), dan Issue Register"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Template Area of Concern & Risk</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors shadow-xs"
            title="Cetak lembar dokumen atau simpan sebagai PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / PDF</span>
          </button>

          {!isViewer && (
            <button
              type="button"
              onClick={handleSaveDocument}
              disabled={isSaving || isLoadingDoc}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Dokumen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Viewer Notice Banner */}
      {isViewer && (
        <div className="no-print p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2 shadow-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mode Baca (Viewer):</strong> Anda sedang melihat dokumen resmi Project Notes & Risk dalam mode <em>read-only</em>. Tombol toolbar dan pengeditan dinonaktifkan.
          </span>
        </div>
      )}

      {/* Main Document Workspace Wrapper (Paper layout) */}
      <div className="bg-slate-100/70 p-3 sm:p-6 rounded-2xl border border-slate-200/80 shadow-inner flex flex-col items-center">
        {/* Sticky Word-Style Toolbar (Hidden for Viewer) */}
        {!isViewer && editor && (
          <div className="no-print sticky top-3 z-30 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-md p-1.5 mb-4 flex flex-wrap items-center gap-1 text-slate-700 text-xs">
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Batalkan (Undo)"
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Ulangi (Redo)"
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>

            {/* Heading Level Selector */}
            <div className="flex items-center gap-1 px-1.5 border-r border-slate-200">
              <button
                type="button"
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={`px-2 py-1 rounded-md font-semibold text-xs ${
                  editor.isActive('paragraph') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Format Paragraf Biasa"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-2 py-1 rounded-md font-bold text-xs ${
                  editor.isActive('heading', { level: 1 }) ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Judul Utama (Heading 1)"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-2 py-1 rounded-md font-bold text-xs ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Sub Judul (Heading 2)"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`px-2 py-1 rounded-md font-bold text-xs ${
                  editor.isActive('heading', { level: 3 }) ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Poin Judul (Heading 3)"
              >
                H3
              </button>
            </div>

            {/* Text Formatting: Bold, Italic, Underline, Strikethrough, Highlight */}
            <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive('bold') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Tebal (Bold)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive('italic') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Miring (Italic)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive('underline') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Garis Bawah (Underline)"
              >
                <UnderlineIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive('strike') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Coret Teks (Strikethrough)"
              >
                <Strikethrough className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive('highlight') ? 'bg-amber-300 text-slate-900' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Stabilo Kuning (Highlight)"
              >
                <Highlighter className="w-4 h-4" />
              </button>
            </div>

            {/* Alignment: Left, Center, Right, Justify */}
            <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive({ textAlign: 'left' }) ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Rata Kiri"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive({ textAlign: 'center' }) ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Rata Tengah"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive({ textAlign: 'right' }) ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Rata Kanan"
              >
                <AlignRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive({ textAlign: 'justify' }) ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Rata Kiri Kanan (Justify)"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
            </div>

            {/* Lists & Nested List (Indent / Outdent) */}
            <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive('bulletList') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Daftar Poin (Bullet List)"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded-lg ${
                  editor.isActive('orderedList') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Daftar Nomor (Numbered List)"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
                disabled={!editor.can().sinkListItem('listItem')}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Indent / Sub-poin (Masuk satu tingkat list / sub-bullet)"
              >
                <IndentIncrease className="w-4 h-4 text-blue-600" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().liftListItem('listItem').run()}
                disabled={!editor.can().liftListItem('listItem')}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Outdent / Poin Utama (Keluar satu tingkat list)"
              >
                <IndentDecrease className="w-4 h-4 text-blue-600" />
              </button>
            </div>

            {/* Table Dropdown Menu */}
            <div className="relative px-1" ref={tableMenuRef}>
              <button
                type="button"
                onClick={() => setIsTableMenuOpen(!isTableMenuOpen)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                  editor.isActive('table') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Menu Tabel Interaktif"
              >
                <TableIcon className="w-4 h-4 text-blue-600" />
                <span>Tabel</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isTableMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 text-xs font-medium space-y-0.5 animate-scaleUp">
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                      setIsTableMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sisipkan Tabel Baru (3x3)</span>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().addRowAfter().run();
                      setIsTableMenuOpen(false);
                    }}
                    disabled={!editor.can().addRowAfter()}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 disabled:opacity-40"
                  >
                    <Rows className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tambah Baris ke Bawah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteRow().run();
                      setIsTableMenuOpen(false);
                    }}
                    disabled={!editor.can().deleteRow()}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hapus Baris Ini</span>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().addColumnAfter().run();
                      setIsTableMenuOpen(false);
                    }}
                    disabled={!editor.can().addColumnAfter()}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 disabled:opacity-40"
                  >
                    <Columns className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tambah Kolom ke Kanan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteColumn().run();
                      setIsTableMenuOpen(false);
                    }}
                    disabled={!editor.can().deleteColumn()}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hapus Kolom Ini</span>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteTable().run();
                      setIsTableMenuOpen(false);
                    }}
                    disabled={!editor.can().deleteTable()}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Seluruh Tabel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paper Document Body (Word / Docs Style) */}
        <div
          id="printable-document"
          className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-200/90 min-h-[750px] relative transition-shadow overflow-hidden"
        >
          {/* Header watermark on paper */}
          <div className="px-6 sm:px-12 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>ENERGY EQUITY EPIC (SENGKANG) PTY. LTD.</span>
            <span>{currentProject?.code || 'FACENG'} — {selectedWeek}</span>
          </div>

          {/* Loading Overlay */}
          {isLoadingDoc ? (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold">Memuat dokumen Project Notes & Risk...</p>
            </div>
          ) : (
            <EditorContent editor={editor} />
          )}

          {/* Paper Footer */}
          <div className="px-6 sm:px-12 py-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Project Control System • Energy Equity Sengkang</span>
            <span className="font-mono">Dokumen Resmi Project Notes & Risk</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: LAMPIRAN DOKUMEN PDF (Weekly Report, Kontrak, LOA, SPK, dll)    */}
      {/* ========================================================================= */}
      <div className="no-print">
        <ProjectAttachmentsCard
          projectId={rawId}
          currentProject={currentProject}
          selectedWeek={selectedWeek}
        />
      </div>

      {/* Embedded CSS for Tiptap Table & Print Formatting */}
      <style>{`
        .ProseMirror {
          min-height: 550px;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror h1 {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0f172a;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.25;
        }
        .ProseMirror h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
          border-bottom: 1.5px solid #e2e8f0;
          padding-bottom: 0.35rem;
        }
        .ProseMirror h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: #334155;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          line-height: 1.65;
        }
        /* List & Sub-bullets Styling */
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror li {
          margin-bottom: 0.35rem;
          line-height: 1.5;
        }
        /* Nested Lists (Sub-bullets) */
        .ProseMirror ul ul,
        .ProseMirror ol ul {
          list-style-type: circle;
          padding-left: 1.4rem;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .ProseMirror ul ul ul,
        .ProseMirror ol ul ul {
          list-style-type: square;
          padding-left: 1.4rem;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }

        /* Corporate Blue Professional Table Presentation Styling */
        .ProseMirror table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
          margin: 1.5rem 0;
          border: 1.5px solid #93c5fd;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        }
        .ProseMirror table th {
          background-color: #3b71ca !important;
          color: #ffffff !important;
          font-weight: 700;
          text-align: left;
          padding: 11px 14px;
          border: 1px solid #2f5eb0;
          font-size: 0.8rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .ProseMirror table th p {
          color: #ffffff !important;
          font-weight: 700;
          margin: 0;
        }
        .ProseMirror table td {
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          vertical-align: top;
          box-sizing: border-box;
          font-size: 0.85rem;
          color: #1e293b;
          line-height: 1.55;
        }

        /* Zebra Striping: alternate rows with white and light blue tint */
        .ProseMirror table tbody tr:nth-child(even) {
          background-color: #f4f8fd;
        }
        .ProseMirror table tbody tr:nth-child(odd) {
          background-color: #ffffff;
        }
        .ProseMirror table tbody tr:hover {
          background-color: #eaf2fc;
        }

        /* Lists inside table cells */
        .ProseMirror table td ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin: 0.25rem 0;
        }
        .ProseMirror table td ol {
          list-style-type: decimal;
          padding-left: 1.25rem;
          margin: 0.25rem 0;
        }
        .ProseMirror table td ul ul {
          list-style-type: circle;
          padding-left: 1.25rem;
          margin: 0.2rem 0;
        }
        .ProseMirror table td ul ul ul {
          list-style-type: square;
          padding-left: 1.25rem;
          margin: 0.2rem 0;
        }
        .ProseMirror table td li {
          margin-bottom: 0.25rem;
        }

        .ProseMirror table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(59, 113, 202, 0.18);
          pointer-events: none;
        }
        .ProseMirror table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #3b71ca;
          pointer-events: none;
        }
        .tableWrapper {
          overflow-x: auto;
        }

        /* Print Specific Styling */
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          #printable-document, #printable-document * {
            visibility: visible;
          }
          #printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          .ProseMirror table th {
            background-color: #3b71ca !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .ProseMirror table tbody tr:nth-child(even) {
            background-color: #f4f8fd !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
