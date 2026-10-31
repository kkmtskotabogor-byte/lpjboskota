import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { BudgetItem } from '../types/lpj';
import { parseBudgetExcelFile } from '../utils/excelService';
import { formatRupiah } from '../utils/formatters';

interface AnggaranModuleProps {
  budgetItems: BudgetItem[];
  onUpdateItems: (items: BudgetItem[], autoSyncBkuAndHonor?: boolean) => void;
  onSyncBkuAndHonor: () => void;
  onExportRkasPdf: () => void;
  onExportTemplateExcel: () => void;
}

const EMPTY_FORM: Omit<BudgetItem, 'id'> = {
  categoryNo: '1',
  categoryName: 'Honor',
  kodeRekening: '5.1.02.02.01.0013',
  uraian: '',
  jumlah: 0,
  keterangan: '',
  tw1: 0,
  tw2: 0,
  tw3: 0,
  tw4: 0,
};

export const AnggaranModule: React.FC<AnggaranModuleProps> = ({
  budgetItems,
  onUpdateItems,
  onSyncBkuAndHonor,
  onExportRkasPdf,
  onExportTemplateExcel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showSourceImage, setShowSourceImage] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [autoSyncOnImport, setAutoSyncOnImport] = useState(true);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formState, setFormState] = useState<Omit<BudgetItem, 'id'>>(EMPTY_FORM);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseBudgetExcelFile(file);
      onUpdateItems(result.items, autoSyncOnImport);
      setImportFeedback({
        type: 'success',
        message: `Berhasil mengimpor ${result.items.length} rincian kegiatan dari sheet "${result.sheetName}" dengan total pagu ${formatRupiah(result.totalImportedPagu)}.${
          autoSyncOnImport ? ' Buku Kas Umum, Kwitansi, dan Daftar Honor telah disinkronkan otomatis.' : ''
        }`,
      });
    } catch (err) {
      setImportFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal membaca file Excel.',
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openEditModal = (item: BudgetItem) => {
    setIsAddingNew(false);
    setEditingItem(item);
    setFormState({
      categoryNo: item.categoryNo,
      categoryName: item.categoryName,
      kodeRekening: item.kodeRekening,
      uraian: item.uraian,
      jumlah: item.jumlah,
      keterangan: item.keterangan,
      tw1: item.tw1,
      tw2: item.tw2,
      tw3: item.tw3,
      tw4: item.tw4,
    });
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsAddingNew(true);
    setFormState(EMPTY_FORM);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.uraian.trim()) return;

    if (isAddingNew) {
      const newItem: BudgetItem = {
        ...formState,
        id: `item-${Date.now()}`,
      };
      onUpdateItems([...budgetItems, newItem], false);
    } else if (editingItem) {
      const updated = budgetItems.map((b) =>
        b.id === editingItem.id ? { ...formState, id: editingItem.id } : b
      );
      onUpdateItems(updated, false);
    }
    setIsAddingNew(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateItems(
      budgetItems.filter((b) => b.id !== id),
      false
    );
  };

  // Group budget items by category
  const groups: { no: string; name: string; rows: BudgetItem[] }[] = [];
  budgetItems.forEach((item) => {
    const existing = groups.find(
      (g) => g.no === item.categoryNo && g.name === item.categoryName
    );
    if (existing) existing.rows.push(item);
    else groups.push({ no: item.categoryNo, name: item.categoryName, rows: [item] });
  });

  const grandTotal = budgetItems.reduce((s, i) => s + i.jumlah, 0);
  const sumTw1 = budgetItems.reduce((s, i) => s + i.tw1, 0);
  const sumTw2 = budgetItems.reduce((s, i) => s + i.tw2, 0);
  const sumTw3 = budgetItems.reduce((s, i) => s + i.tw3, 0);
  const sumTw4 = budgetItems.reduce((s, i) => s + i.tw4, 0);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Anggaran BOS & Impor Format Excel
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Data anggaran dari berkas Excel telah dimuat otomatis. Anda dapat mengunggah pembaruan file Excel (.xlsx/.csv) atau menyunting rincian per Triwulan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowSourceImage((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            {showSourceImage ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showSourceImage ? 'Tutup Referensi Unggahan' : 'Lihat Referensi Excel Asli'}
          </button>

          <button
            type="button"
            onClick={onExportTemplateExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={onExportRkasPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Ekspor PDF RKAS
          </button>
        </div>
      </div>

      {/* Collapsible Uploaded Excel Reference Preview */}
      {showSourceImage && (
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Pratinjau Dokumen Anggaran yang Diunggah ke Sistem
              </h2>
              <p className="text-xs text-slate-500">
                 Seluruh 4 kategori utama, 17 rincian kegiatan, dan distribusi Triwulan 1–4 (Rp 113.250.000) telah dipetakan ke tabel kerja di bawah.
              </p>
            </div>
          </div>
          {!imgError ? (
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-slate-50 p-2">
              <img
                src="/assets/aistudio/image_719496df.png"
                alt="Tabel Anggaran BOS dari file Excel yang diunggah"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="max-w-full h-auto rounded"
              />
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-600">
              Data sumber anggaran (Total Pagu Rp 113.250.000) aktif di dalam tabel rincian anggaran di bawah.
            </div>
          )}
        </section>
      )}

      {/* Excel Upload & Auto-Sync Control Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              Unggah File Anggaran Excel (.xlsx, .xls, .csv)
            </h2>
            <p className="text-xs text-slate-500">
              Format kolom yang didukung: <span className="font-mono">No. | Uraian Kegiatan | Jumlah per sub Kegiatan | Jumlah | keterangan | Tri Wulan 1–4</span>
            </p>
            <label className="inline-flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSyncOnImport}
                onChange={(e) => setAutoSyncOnImport(e.target.checked)}
                className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
              />
              <span>Otomatis buat ulang transaksi BKU, Kwitansi, dan Daftar Honor saat file Excel baru diunggah</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              Pilih File Excel Anggaran
            </button>

            <button
              type="button"
              onClick={onSyncBkuAndHonor}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sinkronkan BKU & Honor dari Tabel Ini
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Kegiatan
            </button>
          </div>
        </div>

        {importFeedback && (
          <div
            className={`mt-4 p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              importFeedback.type === 'success'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-red-50/70 border-red-200 text-red-900'
            }`}
          >
            {importFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{importFeedback.message}</span>
          </div>
        )}
      </section>

      {/* Add / Edit Inline Panel */}
      {(isAddingNew || editingItem) && (
        <form
          onSubmit={handleSaveForm}
          className="bg-white border border-blue-300 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {isAddingNew ? 'Tambah Rincian Kegiatan Baru' : `Sunting Kegiatan: ${editingItem?.uraian}`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingItem(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">No. Kategori</label>
              <input
                type="text"
                value={formState.categoryNo}
                onChange={(e) => setFormState({ ...formState, categoryNo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nama Sub-Kegiatan</label>
              <input
                type="text"
                value={formState.categoryName}
                onChange={(e) => setFormState({ ...formState, categoryName: e.target.value })}
                placeholder="Honor / Kegiatan / Operasional Sekolah"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kode Rekening</label>
              <input
                type="text"
                value={formState.kodeRekening}
                onChange={(e) => setFormState({ ...formState, kodeRekening: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Uraian Kegiatan</label>
              <input
                type="text"
                value={formState.uraian}
                onChange={(e) => setFormState({ ...formState, uraian: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Keterangan / Rumus Satuan</label>
              <input
                type="text"
                value={formState.keterangan}
                onChange={(e) => setFormState({ ...formState, keterangan: e.target.value })}
                placeholder="Contoh: Rp.150.000 x 9 guru"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
              />
            </div>
            {(['tw1', 'tw2', 'tw3', 'tw4'] as const).map((twKey, idx) => (
              <div key={twKey}>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Triwulan {idx + 1} (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formState[twKey]}
                  onChange={(e) => {
                    const nextVal = Number(e.target.value) || 0;
                    const updated = { ...formState, [twKey]: nextVal };
                    updated.jumlah = updated.tw1 + updated.tw2 + updated.tw3 + updated.tw4;
                    setFormState(updated);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-700">Total Pagu Tahunan (Rp):</label>
              <input
                type="number"
                min={0}
                value={formState.jumlah}
                onChange={(e) =>
                  setFormState({ ...formState, jumlah: Number(e.target.value) || 0 })
                }
                className="w-44 px-3 py-1.5 text-xs font-mono font-semibold tabular-nums border border-slate-300 rounded-lg"
              />
              <span className="text-xs text-slate-500">
                Total TW 1–4: {formatRupiah(formState.tw1 + formState.tw2 + formState.tw3 + formState.tw4)}
              </span>
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Simpan Perubahan Kegiatan
            </button>
          </div>
        </form>
      )}

      {/* Exact 9-Column Hierarchical Budget Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="py-3 px-3 text-center font-semibold w-12">No.</th>
                <th className="py-3 px-4 text-left font-semibold min-w-[220px]">Uraian Kegiatan</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Jumlah per Sub Kegiatan</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Jumlah</th>
                <th className="py-3 px-4 text-left font-semibold min-w-[210px]">Keterangan</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Tri Wulan 1</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Tri Wulan 2</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Tri Wulan 3</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Tri Wulan 4</th>
                <th className="py-3 px-3 text-center font-semibold w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {groups.map((grp) => {
                const subTotal = grp.rows.reduce((s, r) => s + r.jumlah, 0);
                return (
                  <React.Fragment key={`${grp.no}-${grp.name}`}>
                    {/* Category Header Row matching blue-tinted Excel Sub-Kegiatan band */}
                    <tr className="bg-blue-50/60 font-semibold text-slate-900">
                      <td className="py-2.5 px-3 text-center font-mono">{grp.no}.</td>
                      <td className="py-2.5 px-4 capitalize">{grp.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {formatRupiah(subTotal, false)}
                      </td>
                      <td colSpan={7} className="py-2.5 px-3" />
                    </tr>

                    {grp.rows.map((row) => {
                      const rowTwSum = row.tw1 + row.tw2 + row.tw3 + row.tw4;
                      const hasMismatch = row.jumlah !== rowTwSum;
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            hasMismatch ? 'bg-red-50/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400" />
                          <td className="py-2.5 px-4 text-slate-900">
                            <div className="font-medium">{row.uraian}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {row.kodeRekening}
                              {hasMismatch && (
                                <span className="ml-2 text-red-700 font-sans font-medium">
                                  · Selisih TW ({formatRupiah(rowTwSum)})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-400" />
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                            {row.jumlah > 0 ? formatRupiah(row.jumlah, false) : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{row.keterangan || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {row.tw1 > 0 ? formatRupiah(row.tw1, false) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {row.tw2 > 0 ? formatRupiah(row.tw2, false) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {row.tw3 > 0 ? formatRupiah(row.tw3, false) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {row.tw4 > 0 ? formatRupiah(row.tw4, false) : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(row)}
                                title="Sunting kegiatan"
                                className="p-1.5 text-slate-500 hover:text-blue-900 rounded hover:bg-slate-100"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(row.id)}
                                title="Hapus kegiatan"
                                className="p-1.5 text-slate-500 hover:text-red-700 rounded hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold text-slate-900">
                <td colSpan={2} className="py-3 px-4">
                  JUMLAH BOS
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatRupiah(grandTotal, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatRupiah(grandTotal, false)}
                </td>
                <td className="py-3 px-4 text-center text-slate-500">-</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatRupiah(sumTw1, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatRupiah(sumTw2, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatRupiah(sumTw3, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatRupiah(sumTw4, false)}
                </td>
                <td className="py-3 px-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
};
