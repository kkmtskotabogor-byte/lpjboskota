import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Save,
  Wrench,
} from 'lucide-react';
import {
  LpjModuleKey,
  SchoolProfile,
  ValidationIssue,
  ValidationSeverity,
} from '../types/lpj';

interface ValidasiModuleProps {
  issues: ValidationIssue[];
  onApplyFix: (issue: ValidationIssue) => void;
  onNavigate: (mod: LpjModuleKey) => void;
}

export const ValidasiModule: React.FC<ValidasiModuleProps> = ({
  issues,
  onApplyFix,
  onNavigate,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | ValidationSeverity>('all');

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const valids = issues.filter((i) => i.severity === 'valid');

  const visible =
    filterSeverity === 'all'
      ? issues
      : issues.filter((i) => i.severity === filterSeverity);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Validasi Data & Rekonsiliasi Otomatis LPJ
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Pemeriksaan silang otomatis antara Pagu Anggaran Excel, Distribusi Triwulan 1–4, Saldo Buku Kas Umum, Kelengkapan Kwitansi, dan Daftar Tanda Tangan Honorarium.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          {(
            [
              { id: 'all', label: `Semua (${issues.length})` },
              { id: 'error', label: `Selisih (${errors.length})` },
              { id: 'warning', label: `Catatan (${warnings.length})` },
              { id: 'valid', label: `Lolos (${valids.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterSeverity(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filterSeverity === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <div className="text-xs text-slate-500">Temuan Kritis / Selisih Angka</div>
            <div className="text-lg font-semibold font-mono tabular-nums text-slate-900">
              {errors.length} Temuan
            </div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="text-xs text-slate-500">Peringatan Rumus / Sisa Pagu</div>
            <div className="text-lg font-semibold font-mono tabular-nums text-slate-900">
              {warnings.length} Catatan
            </div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <div className="text-xs text-slate-500">Indikator Kepatuhan LPJ Lolos</div>
            <div className="text-lg font-semibold font-mono tabular-nums text-emerald-800">
              {valids.length} Pemeriksaan
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        {visible.map((issue) => (
          <div
            key={issue.id}
            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              {issue.severity === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              ) : issue.severity === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700 capitalize">
                    Modul {issue.module.toUpperCase()}
                  </span>
                  {issue.triwulan && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Triwulan {issue.triwulan}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>
                    {issue.severity === 'error'
                      ? 'Wajib Diperbaiki'
                      : issue.severity === 'warning'
                      ? 'Perlu Ditinjau'
                      : 'Terverifikasi'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{issue.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{issue.detail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 pl-8 md:pl-0">
              {issue.fixAction && (
                <button
                  type="button"
                  onClick={() => onApplyFix(issue)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  {issue.fixAction.label}
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigate(issue.module)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                Buka Modul
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

interface PengaturanSekolahProps {
  school: SchoolProfile;
  onUpdateSchool: (next: SchoolProfile) => void;
  onResetAllDefault: () => void;
}

export const PengaturanSekolahModule: React.FC<PengaturanSekolahProps> = ({
  school,
  onUpdateSchool,
  onResetAllDefault,
}) => {
  const [draft, setDraft] = useState<SchoolProfile>(school);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchool(draft);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Identitas Satuan Pendidikan & Pejabat Penandatangan
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Data ini dicetak otomatis pada Kop Surat, SPTJM, Buku Kas Umum, Kwitansi BOS, dan Daftar Penerimaan Honorarium PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetAllDefault}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors self-start whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Kembalikan ke Data Awal Excel
        </button>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Sekolah / Madrasah
            </label>
            <input
              type="text"
              value={draft.namaSekolah}
              onChange={(e) => setDraft({ ...draft, namaSekolah: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">NPSN</label>
            <input
              type="text"
              value={draft.npsn}
              onChange={(e) => setDraft({ ...draft, npsn: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tahun Anggaran
            </label>
            <input
              type="text"
              value={draft.tahunAnggaran}
              onChange={(e) => setDraft({ ...draft, tahunAnggaran: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Alamat Lengkap Satuan Pendidikan
            </label>
            <input
              type="text"
              value={draft.alamat}
              onChange={(e) => setDraft({ ...draft, alamat: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Kota / Kabupaten
            </label>
            <input
              type="text"
              value={draft.kota}
              onChange={(e) => setDraft({ ...draft, kota: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Sumber Dana BOS
            </label>
            <input
              type="text"
              value={draft.sumberDana}
              onChange={(e) => setDraft({ ...draft, sumberDana: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nomor SK Penetapan / NPHD BOS
            </label>
            <input
              type="text"
              value={draft.nomorSkNphd}
              onChange={(e) => setDraft({ ...draft, nomorSkNphd: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Status & Akreditasi
            </label>
            <input
              type="text"
              value={draft.statusSekolah}
              onChange={(e) => setDraft({ ...draft, statusSekolah: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900">
              Pejabat Penanggung Jawab (Kepala Sekolah / Madrasah)
            </h3>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={draft.kepalaSekolah}
                onChange={(e) => setDraft({ ...draft, kepalaSekolah: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">NIP / NUPTK</label>
              <input
                type="text"
                value={draft.nipKepala}
                onChange={(e) => setDraft({ ...draft, nipKepala: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900">Bendahara Dana BOS</h3>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={draft.bendaharaBos}
                onChange={(e) => setDraft({ ...draft, bendaharaBos: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">NIP / NUPTK</label>
              <input
                type="text"
                value={draft.nipBendahara}
                onChange={(e) => setDraft({ ...draft, nipBendahara: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tgl Tutup Buku TW 1
            </label>
            <input
              type="date"
              value={draft.tanggalLaporanTw1}
              onChange={(e) => setDraft({ ...draft, tanggalLaporanTw1: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tgl Tutup Buku TW 2
            </label>
            <input
              type="date"
              value={draft.tanggalLaporanTw2}
              onChange={(e) => setDraft({ ...draft, tanggalLaporanTw2: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tgl Tutup Buku TW 3
            </label>
            <input
              type="date"
              value={draft.tanggalLaporanTw3}
              onChange={(e) => setDraft({ ...draft, tanggalLaporanTw3: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tgl Tutup Buku TW 4
            </label>
            <input
              type="date"
              value={draft.tanggalLaporanTw4}
              onChange={(e) => setDraft({ ...draft, tanggalLaporanTw4: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Pengaturan satuan pendidikan berhasil disimpan.
              </span>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Identitas Satuan Pendidikan
          </button>
        </div>
      </form>
    </div>
  );
};
