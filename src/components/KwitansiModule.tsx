import React, { useMemo, useState } from 'react';
import { Download, FileText, Printer, Search } from 'lucide-react';
import {
  BkuTransaction,
  SchoolProfile,
  TriwulanFilter,
} from '../types/lpj';
import {
  formatRupiah,
  formatTanggalIndo,
  terbilangRupiah,
} from '../utils/formatters';

interface KwitansiModuleProps {
  school: SchoolProfile;
  transactions: BkuTransaction[];
  selectedTxId: string | null;
  twFilter: TriwulanFilter;
  onChangeTwFilter: (tw: TriwulanFilter) => void;
  onSelectTx: (id: string) => void;
  onSaveTransaction: (tx: BkuTransaction) => void;
  onExportSingleKwitansiPdf: (tx: BkuTransaction) => void;
  onExportBatchKwitansiPdf: (list: BkuTransaction[], label: string) => void;
}

export const KwitansiModule: React.FC<KwitansiModuleProps> = ({
  school,
  transactions,
  selectedTxId,
  twFilter,
  onChangeTwFilter,
  onSelectTx,
  onSaveTransaction,
  onExportSingleKwitansiPdf,
  onExportBatchKwitansiPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const expenseVouchers = useMemo(() => {
    return transactions
      .filter((t) => t.jenis === 'pengeluaran')
      .filter((t) => twFilter === 'all' || t.triwulan === twFilter)
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.noBukti.toLowerCase().includes(q) ||
          t.uraian.toLowerCase().includes(q) ||
          t.penerima.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [transactions, twFilter, searchQuery]);

  const activeVoucher = useMemo(() => {
    if (selectedTxId) {
      const found = expenseVouchers.find((v) => v.id === selectedTxId);
      if (found) return found;
    }
    return expenseVouchers[0] || null;
  }, [expenseVouchers, selectedTxId]);

  const handleFieldChange = <K extends keyof BkuTransaction>(
    key: K,
    val: BkuTransaction[K]
  ) => {
    if (!activeVoucher) return;
    onSaveTransaction({
      ...activeVoucher,
      [key]: val,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Kwitansi Pembayaran Dana BOS
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Setiap pengeluaran pada Buku Kas Umum menghasilkan lembar Kwitansi resmi otomatis lengkap dengan konversi kalimat Terbilang Rupiah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeVoucher && (
            <button
              type="button"
              onClick={() => onExportSingleKwitansiPdf(activeVoucher)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Unduh PDF Kwitansi Ini
            </button>
          )}

          <button
            type="button"
            disabled={expenseVouchers.length === 0}
            onClick={() =>
              onExportBatchKwitansiPdf(
                expenseVouchers,
                twFilter === 'all' ? 'TW1-4' : `TW${twFilter}`
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Semua Kwitansi ({expenseVouchers.length} Bukti)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              {tw === 'all' ? 'Semua TW' : `Triwulan ${tw}`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. bukti atau uraian kwitansi..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
          />
        </div>
      </div>

      {/* Split Master-Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Vouchers */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Daftar Bukti Pengeluaran ({expenseVouchers.length})
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              {formatRupiah(expenseVouchers.reduce((s, v) => s + v.nominal, 0))}
            </span>
          </div>

          <div className="max-h-[620px] overflow-y-auto divide-y divide-slate-200">
            {expenseVouchers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Belum ada pengeluaran BKU pada periode ini.
              </div>
            ) : (
              expenseVouchers.map((v) => {
                const isSelected = activeVoucher?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onSelectTx(v.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-950">
                        {v.noBukti}
                      </span>
                      <span className="text-xs font-mono font-semibold tabular-nums text-slate-900">
                        {formatRupiah(v.nominal)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-800 line-clamp-1">
                      {v.uraian}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                      {v.tanggal} · TW {v.triwulan} · {v.penerima}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Paper Preview + Quick Inline Metadata Editor */}
        <div className="lg:col-span-8 space-y-5">
          {!activeVoucher ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500">
              Pilih salah satu bukti pengeluaran di sebelah kiri untuk menampilkan dan menyunting Kwitansi.
            </div>
          ) : (
            <>
              {/* Realistic Formal Kwitansi Paper Sheet */}
              <section className="bg-white border-2 border-slate-800 rounded-md p-6 sm:p-8">
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-300">
                  <div>
                    <div className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      {school.namaSekolah}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {school.sumberDana} · Tahun Anggaran {school.tahunAnggaran}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      NPSN: {school.npsn} · {school.kota}
                    </div>
                  </div>

                  <div className="text-xs font-mono space-y-1 text-slate-800 bg-slate-50 px-3.5 py-2 border border-slate-200 rounded">
                    <div>No. Bukti : {activeVoucher.noBukti}</div>
                    <div>Kode Rek. : {activeVoucher.kodeRekening}</div>
                    <div>Triwulan  : TW {activeVoucher.triwulan}</div>
                  </div>
                </div>

                {/* Title */}
                <div className="py-5 text-center">
                  <h2 className="text-lg font-bold tracking-[0.2em] text-slate-900 underline underline-offset-4">
                    KWITANSI PEMBAYARAN
                  </h2>
                </div>

                {/* Main Voucher Body */}
                <div className="space-y-4 text-xs sm:text-sm text-slate-900">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 items-baseline">
                    <span className="sm:col-span-3 text-slate-600">Sudah Terima Dari</span>
                    <span className="sm:col-span-9 font-semibold">
                      : Bendahara BOS {school.namaSekolah}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 items-center">
                    <span className="sm:col-span-3 text-slate-600">Uang Sejumlah</span>
                    <div className="sm:col-span-9 bg-slate-100 border border-slate-300 px-3.5 py-2.5 italic font-semibold text-slate-900">
                      # {terbilangRupiah(activeVoucher.nominal)} #
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 items-baseline">
                    <span className="sm:col-span-3 text-slate-600">Untuk Pembayaran</span>
                    <span className="sm:col-span-9 leading-relaxed">
                      : {activeVoucher.rincianKwitansi || activeVoucher.uraian}
                    </span>
                  </div>
                </div>

                {/* Amount Box */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-3 bg-slate-100 border-2 border-slate-900 px-5 py-2.5">
                    <span className="text-xs font-semibold text-slate-700 uppercase">Jumlah Rp</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                      {formatRupiah(activeVoucher.nominal, false)}
                    </span>
                  </div>

                  {(activeVoucher.pph21 > 0 || activeVoucher.ppn > 0) && (
                    <div className="text-xs font-mono text-slate-600">
                      Potongan Pajak — PPh 21: {formatRupiah(activeVoucher.pph21)} · PPN:{' '}
                      {formatRupiah(activeVoucher.ppn)}
                    </div>
                  )}
                </div>

                {/* 3-Column Official Signature Block */}
                <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-800">
                  <div>
                    <p>Setuju Dibayar,</p>
                    <p className="text-slate-600">Kepala Sekolah / Madrasah</p>
                    <div className="h-14" />
                    <p className="font-bold text-slate-900 underline">{school.kepalaSekolah}</p>
                    <p className="text-[11px] font-mono text-slate-600">
                      NIP. {school.nipKepala || '-'}
                    </p>
                  </div>

                  <div>
                    <p>Lunas Dibayar, {formatTanggalIndo(activeVoucher.tanggal)}</p>
                    <p className="text-slate-600">Bendahara Dana BOS</p>
                    <div className="h-14" />
                    <p className="font-bold text-slate-900 underline">{school.bendaharaBos}</p>
                    <p className="text-[11px] font-mono text-slate-600">
                      NIP. {school.nipBendahara || '-'}
                    </p>
                  </div>

                  <div>
                    <p>
                      {school.kota}, {formatTanggalIndo(activeVoucher.tanggal)}
                    </p>
                    <p className="text-slate-600">Yang Menerima,</p>
                    <div className="h-14" />
                    <p className="font-bold text-slate-900 underline">{activeVoucher.penerima}</p>
                    <p className="text-[11px] text-slate-600">
                      {activeVoucher.jabatanPenerima || 'Penerima'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Quick Edit Fields for Active Kwitansi */}
              <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-900" />
                    Sesuaikan Detail Kwitansi & Pajak (Tersimpan Otomatis ke BKU)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nomor Bukti Kwitansi
                    </label>
                    <input
                      type="text"
                      value={activeVoucher.noBukti}
                      onChange={(e) => handleFieldChange('noBukti', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tanggal Lunas Dibayar
                    </label>
                    <input
                      type="date"
                      value={activeVoucher.tanggal}
                      onChange={(e) => handleFieldChange('tanggal', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nominal Kwitansi (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={activeVoucher.nominal}
                      onChange={(e) =>
                        handleFieldChange('nominal', Number(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-semibold tabular-nums border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nama Penerima Pembayaran
                    </label>
                    <input
                      type="text"
                      value={activeVoucher.penerima}
                      onChange={(e) => handleFieldChange('penerima', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Jabatan / Nama Penyedia
                    </label>
                    <input
                      type="text"
                      value={activeVoucher.jabatanPenerima}
                      onChange={(e) => handleFieldChange('jabatanPenerima', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Uraian Rincian Untuk Pembayaran
                    </label>
                    <input
                      type="text"
                      value={activeVoucher.rincianKwitansi}
                      onChange={(e) => handleFieldChange('rincianKwitansi', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      PPh Pasal 21/23 (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={activeVoucher.pph21}
                      onChange={(e) =>
                        handleFieldChange('pph21', Number(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      PPN (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={activeVoucher.ppn}
                      onChange={(e) =>
                        handleFieldChange('ppn', Number(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
