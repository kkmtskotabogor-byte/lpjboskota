import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  ArrowRight,
} from 'lucide-react';
import {
  BkuTransaction,
  BudgetItem,
  HonorRecipient,
  LpjModuleKey,
  SchoolProfile,
  TriwulanFilter,
  ValidationIssue,
} from '../types/lpj';
import { formatRupiah } from '../utils/formatters';

interface RingkasanDashboardProps {
  school: SchoolProfile;
  budgetItems: BudgetItem[];
  transactions: BkuTransaction[];
  honorRecipients: HonorRecipient[];
  validationIssues: ValidationIssue[];
  twFilter: TriwulanFilter;
  onChangeTwFilter: (tw: TriwulanFilter) => void;
  onNavigate: (module: LpjModuleKey) => void;
  onExportBundlePdf: () => void;
  onExportRkasPdf: () => void;
  onExportBkuPdf: () => void;
  onExportKwitansiPdf: () => void;
  onExportHonorPdf: () => void;
  onExportExcel: () => void;
}

const CATEGORY_COLORS = ['#1e3a8a', '#0284c7', '#0f766e', '#d97706', '#4f46e5'];

export const RingkasanDashboard: React.FC<RingkasanDashboardProps> = ({
  school,
  budgetItems,
  transactions,
  honorRecipients,
  validationIssues,
  twFilter,
  onChangeTwFilter,
  onNavigate,
  onExportBundlePdf,
  onExportRkasPdf,
  onExportBkuPdf,
  onExportKwitansiPdf,
  onExportHonorPdf,
  onExportExcel,
}) => {
  const totalPagu = budgetItems.reduce((sum, i) => sum + i.jumlah, 0);

  const filteredPagu =
    twFilter === 'all'
      ? totalPagu
      : budgetItems.reduce((sum, i) => {
          const key = `tw${twFilter}` as 'tw1' | 'tw2' | 'tw3' | 'tw4';
          return sum + i[key];
        }, 0);

  const totalPenerimaan = transactions
    .filter((t) => t.jenis === 'penerimaan' && (twFilter === 'all' || t.triwulan === twFilter))
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.jenis === 'pengeluaran' && (twFilter === 'all' || t.triwulan === twFilter))
    .reduce((sum, t) => sum + t.nominal, 0);

  const saldoKas = totalPenerimaan - totalPengeluaran;
  const serapanPersen = filteredPagu > 0 ? (totalPengeluaran / filteredPagu) * 100 : 0;

  const errorCount = validationIssues.filter((v) => v.severity === 'error').length;
  const warningCount = validationIssues.filter((v) => v.severity === 'warning').length;

  const categoryMap = new Map<string, { no: string; name: string; total: number }>();
  budgetItems.forEach((item) => {
    const key = `${item.categoryNo}-${item.categoryName}`;
    const existing = categoryMap.get(key);
    const val =
      twFilter === 'all'
        ? item.jumlah
        : item[`tw${twFilter}` as 'tw1' | 'tw2' | 'tw3' | 'tw4'];
    if (existing) {
      existing.total += val;
    } else {
      categoryMap.set(key, { no: item.categoryNo, name: item.categoryName, total: val });
    }
  });

  const categories = Array.from(categoryMap.values());
  const chartSum = categories.reduce((s, c) => s + c.total, 0);

  let cumulativeAngle = 0;
  const donutSegments = categories.map((cat, idx) => {
    const fraction = chartSum > 0 ? cat.total / chartSum : 0;
    const startAngle = cumulativeAngle;
    const sweep = fraction * 360;
    cumulativeAngle += sweep;

    const r = 64;
    const circumference = 2 * Math.PI * r;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -((startAngle / 360) * circumference);

    return {
      ...cat,
      percent: fraction * 100,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const quarterlyStats = ([1, 2, 3, 4] as const).map((tw) => {
    const key = `tw${tw}` as 'tw1' | 'tw2' | 'tw3' | 'tw4';
    const pagu = budgetItems.reduce((s, i) => s + i[key], 0);
    const realisasi = transactions
      .filter((t) => t.jenis === 'pengeluaran' && t.triwulan === tw)
      .reduce((s, t) => s + t.nominal, 0);
    const masuk = transactions
      .filter((t) => t.jenis === 'penerimaan' && t.triwulan === tw)
      .reduce((s, t) => s + t.nominal, 0);
    return { tw, pagu, realisasi, masuk };
  });

  const maxQuarterVal = Math.max(...quarterlyStats.map((q) => Math.max(q.pagu, q.realisasi)), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Ringkasan Pertanggungjawaban BOS
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>{school.namaSekolah}</span>
            <span aria-hidden="true">·</span>
            <span>Tahun Anggaran {school.tahunAnggaran}</span>
            <span aria-hidden="true">·</span>
            <span>SK/NPHD {school.nomorSkNphd}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          {(['all', 1, 2, 3, 4] as TriwulanFilter[]).map((tw) => (
            <button
              key={String(tw)}
              type="button"
              onClick={() => onChangeTwFilter(tw)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                twFilter === tw
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tw === 'all' ? 'Tahun Penuh' : `Triwulan ${tw}`}
            </button>
          ))}
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">
            {twFilter === 'all' ? 'Total Pagu Anggaran BOS' : `Pagu Anggaran Triwulan ${twFilter}`}
          </p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {formatRupiah(filteredPagu)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {budgetItems.filter((b) => b.jumlah > 0).length} komponen kegiatan aktif · {categories.length} sub-program
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Realisasi Belanja (BKU)</p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {formatRupiah(totalPengeluaran)}
          </p>
          <p className="mt-1.5 text-xs text-slate-600">
            Serapan <span className="font-mono tabular-nums font-medium">{serapanPersen.toFixed(1)}%</span> ·{' '}
            {
              transactions.filter(
                (t) => t.jenis === 'pengeluaran' && (twFilter === 'all' || t.triwulan === twFilter)
              ).length
            }{' '}
            kwitansi
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Saldo Kas Tersisa</p>
          <p
            className={`mt-2 text-2xl font-semibold font-mono tabular-nums ${
              saldoKas < 0 ? 'text-red-700' : 'text-slate-900'
            }`}
          >
            {formatRupiah(saldoKas)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Dana masuk <span className="font-mono tabular-nums">{formatRupiah(totalPenerimaan)}</span>
          </p>
        </div>

        <div className="p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Status Validasi Otomatis</p>
            <div className="mt-2 flex items-center gap-2">
              {errorCount > 0 ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span className="text-lg font-semibold text-red-700">
                    {errorCount} Temuan Selisih
                  </span>
                </>
              ) : warningCount > 0 ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-lg font-semibold text-slate-900">
                    Pagu Seimbang · {warningCount} Catatan
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span className="text-lg font-semibold text-emerald-800">
                    100% Tervalidasi
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('validasi')}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-900 hover:underline whitespace-nowrap shrink-0 self-start"
          >
            Buka rincian pemeriksaan LPJ
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Proporsi Anggaran per Sub-Kegiatan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi sesuai struktur anggaran Excel yang diunggah
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('anggaran')}
                className="text-xs font-medium text-blue-900 hover:underline whitespace-nowrap shrink-0"
              >
                Kelola Anggaran
              </button>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-8">
              <div className="relative w-44 h-44 shrink-0">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="22"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={`${seg.no}-${seg.name}`}
                      cx="80"
                      cy="80"
                      r="64"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="22"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                  <span className="text-[11px] text-slate-500">Total Pagu</span>
                  <span className="text-xs font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                    {formatRupiah(chartSum)}
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full divide-y divide-slate-100">
                {donutSegments.map((seg) => (
                  <div
                    key={`${seg.no}-${seg.name}`}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-xs shrink-0"
                        style={{ backgroundColor: seg.color }}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-slate-800 truncate capitalize">
                        {seg.no}. {seg.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0 font-mono tabular-nums">
                      <div className="text-xs font-semibold text-slate-900">
                        {formatRupiah(seg.total)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {Math.round(seg.percent)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Honorarium meliputi {honorRecipients.filter((h) => twFilter === 'all' || h.triwulan === twFilter).length} tanda tangan penerima</span>
            <button
              type="button"
              onClick={() => onNavigate('honor')}
              className="font-medium text-blue-900 hover:underline whitespace-nowrap shrink-0"
            >
              Lihat Daftar Honor
            </button>
          </div>
        </section>

        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Rekonsiliasi Pagu & Realisasi per Triwulan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan rencana distribusi Triwulan 1–4 terhadap pengeluaran BKU
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('bku')}
                className="text-xs font-medium text-blue-900 hover:underline whitespace-nowrap shrink-0"
              >
                Buka Buku Kas Umum
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {quarterlyStats.map((q) => {
                const paguWidth = Math.round((q.pagu / maxQuarterVal) * 100);
                const realWidth = Math.round((q.realisasi / maxQuarterVal) * 100);
                const selisih = q.pagu - q.realisasi;

                return (
                  <div key={q.tw} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">
                        Triwulan {q.tw}
                      </span>
                      <div className="font-mono tabular-nums text-slate-600 flex items-center gap-2">
                        <span>Pagu {formatRupiah(q.pagu)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-900">
                          Realisasi {formatRupiah(q.realisasi)}
                        </span>
                      </div>
                    </div>

                    <div className="h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden relative">
                      <div
                        className="h-full bg-slate-300 rounded-sm"
                        style={{ width: `${paguWidth}%` }}
                      />
                      <div
                        className={`h-full top-0 left-0 absolute rounded-sm ${
                          q.realisasi > q.pagu ? 'bg-red-600' : 'bg-blue-900'
                        }`}
                        style={{ width: `${Math.min(realWidth, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Pencairan masuk: {formatRupiah(q.masuk)}</span>
                      <span className="font-mono tabular-nums">
                        {selisih === 0
                          ? 'Sesuai pagu (Selisih Rp 0)'
                          : selisih > 0
                          ? `Sisa pagu ${formatRupiah(selisih)}`
                          : `Melebihi pagu ${formatRupiah(Math.abs(selisih))}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Tahunan Triwulan 1–4: <strong className="font-mono tabular-nums text-slate-900">{formatRupiah(totalPagu)}</strong></span>
            <button
              type="button"
              onClick={() => onNavigate('kwitansi')}
              className="font-medium text-blue-900 hover:underline whitespace-nowrap shrink-0"
            >
              Cetak Kwitansi SPJ
            </button>
          </div>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Pusat Cetak & Ekspor Dokumen LPJ Siap Tanda Tangan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh dokumen PDF mengikuti tata naskah resmi pertanggungjawaban BOS lengkap dengan kop satuan pendidikan, terbilang otomatis, dan kolom tanda tangan pejabat.
            </p>
          </div>
          <button
            type="button"
            onClick={onExportBundlePdf}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            Unduh Bundel LPJ Lengkap (PDF)
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={onExportRkasPdf}
            className="flex items-center justify-between gap-3 px-4 py-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">Rekap Anggaran RKAS</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Format PDF A4 Landscape</div>
            </div>
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onExportBkuPdf}
            className="flex items-center justify-between gap-3 px-4 py-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">Buku Kas Umum (BKU)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Beserta penutupan kas</div>
            </div>
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onExportKwitansiPdf}
            className="flex items-center justify-between gap-3 px-4 py-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">Bundel Kwitansi BOS</div>
              <div className="text-[11px] text-slate-500 mt-0.5">2 kwitansi per lembar A4</div>
            </div>
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onExportHonorPdf}
            className="flex items-center justify-between gap-3 px-4 py-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">Daftar Penerimaan Honor</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Kolom tanda tangan zig-zag</div>
            </div>
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center justify-between gap-3 px-4 py-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">Ekspor File Excel (.xlsx)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">3 sheet (Anggaran, BKU, Honor)</div>
            </div>
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
          </button>
        </div>
      </section>
    </div>
  );
};
