import React, { useMemo, useState } from 'react';
import {
  FileText,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
} from 'lucide-react';
import {
  BkuTransaction,
  BudgetItem,
  Triwulan,
  TriwulanFilter,
} from '../types/lpj';
import { formatRupiah } from '../utils/formatters';

interface BkuModuleProps {
  budgetItems: BudgetItem[];
  transactions: BkuTransaction[];
  twFilter: TriwulanFilter;
  onChangeTwFilter: (tw: TriwulanFilter) => void;
  onSaveTransaction: (tx: BkuTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenKwitansiForTx: (txId: string) => void;
  onExportBkuPdf: () => void;
}

export const BkuModule: React.FC<BkuModuleProps> = ({
  budgetItems,
  transactions,
  twFilter,
  onChangeTwFilter,
  onSaveTransaction,
  onDeleteTransaction,
  onOpenKwitansiForTx,
  onExportBkuPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [jenisFilter, setJenisFilter] = useState<'all' | 'penerimaan' | 'pengeluaran'>('all');
  const [editingTx, setEditingTx] = useState<BkuTransaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const defaultTw: Triwulan = twFilter === 'all' ? 1 : twFilter;
  const [formState, setFormState] = useState<Omit<BkuTransaction, 'id'>>({
    tanggal: `2026-0${defaultTw * 3}-20`,
    triwulan: defaultTw,
    noBukti: `BKU-TW${defaultTw}-010`,
    kodeRekening: '5.1.02.02.01.0013',
    uraian: '',
    jenis: 'pengeluaran',
    nominal: 0,
    budgetItemId: budgetItems[0]?.id || '',
    penerima: '',
    jabatanPenerima: 'Pelaksana Kegiatan',
    rincianKwitansi: '',
    pph21: 0,
    ppn: 0,
  });

  const sortedAll = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const cmp = a.tanggal.localeCompare(b.tanggal);
      if (cmp !== 0) return cmp;
      if (a.jenis === b.jenis) return 0;
      return a.jenis === 'penerimaan' ? -1 : 1;
    });
  }, [transactions]);

  const openingBalance = useMemo(() => {
    if (twFilter === 'all') return 0;
    return sortedAll
      .filter((t) => t.triwulan < twFilter)
      .reduce((acc, t) => acc + (t.jenis === 'penerimaan' ? t.nominal : -t.nominal), 0);
  }, [sortedAll, twFilter]);

  const periodLedgerRows = useMemo(() => {
    const base =
      twFilter === 'all' ? sortedAll : sortedAll.filter((t) => t.triwulan === twFilter);
    let running = openingBalance;
    return base.map((tx) => {
      running += tx.jenis === 'penerimaan' ? tx.nominal : -tx.nominal;
      return {
        ...tx,
        saldoSetelah: running,
      };
    });
  }, [sortedAll, twFilter, openingBalance]);

  const visibleRows = useMemo(() => {
    return periodLedgerRows.filter((row) => {
      if (jenisFilter !== 'all' && row.jenis !== jenisFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.uraian.toLowerCase().includes(q) ||
          row.noBukti.toLowerCase().includes(q) ||
          row.penerima.toLowerCase().includes(q) ||
          row.kodeRekening.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [periodLedgerRows, jenisFilter, searchQuery]);

  const totalMasuk = periodLedgerRows
    .filter((r) => r.jenis === 'penerimaan')
    .reduce((s, r) => s + r.nominal, 0);
  const totalKeluar = periodLedgerRows
    .filter((r) => r.jenis === 'pengeluaran')
    .reduce((s, r) => s + r.nominal, 0);
  const saldoAkhir = openingBalance + totalMasuk - totalKeluar;

  const openNewForm = () => {
    const tw: Triwulan = twFilter === 'all' ? 1 : twFilter;
    const monthStr = String(tw * 3).padStart(2, '0');
    setEditingTx(null);
    setFormState({
      tanggal: `2026-${monthStr}-25`,
      triwulan: tw,
      noBukti: `BKU-TW${tw}-${String(periodLedgerRows.length + 1).padStart(3, '0')}`,
      kodeRekening: budgetItems[0]?.kodeRekening || '5.1.02.02.01.0000',
      uraian: budgetItems[0] ? `Pembayaran ${budgetItems[0].uraian} — Triwulan ${tw}` : '',
      jenis: 'pengeluaran',
      nominal: 0,
      budgetItemId: budgetItems[0]?.id || '',
      penerima: '',
      jabatanPenerima: 'Penerima Pembayaran',
      rincianKwitansi: '',
      pph21: 0,
      ppn: 0,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (tx: BkuTransaction) => {
    setEditingTx(tx);
    setFormState({
      tanggal: tx.tanggal,
      triwulan: tx.triwulan,
      noBukti: tx.noBukti,
      kodeRekening: tx.kodeRekening,
      uraian: tx.uraian,
      jenis: tx.jenis,
      nominal: tx.nominal,
      budgetItemId: tx.budgetItemId || '',
      penerima: tx.penerima,
      jabatanPenerima: tx.jabatanPenerima,
      rincianKwitansi: tx.rincianKwitansi,
      pph21: tx.pph21,
      ppn: tx.ppn,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.uraian.trim() || formState.nominal <= 0) return;
    onSaveTransaction({
      ...formState,
      id: editingTx ? editingTx.id : `bku-custom-${Date.now()}`,
      budgetItemId: formState.jenis === 'pengeluaran' ? formState.budgetItemId : undefined,
    });
    setIsFormOpen(false);
    setEditingTx(null);
  };

  const selectedItemInfo = useMemo(() => {
    if (formState.jenis !== 'pengeluaran' || !formState.budgetItemId) return null;
    const item = budgetItems.find((b) => b.id === formState.budgetItemId);
    if (!item) return null;
    const key = `tw${formState.triwulan}` as 'tw1' | 'tw2' | 'tw3' | 'tw4';
    const paguTw = item[key];
    const usedOther = transactions
      .filter(
        (t) =>
          t.jenis === 'pengeluaran' &&
          t.budgetItemId === item.id &&
          t.triwulan === formState.triwulan &&
          t.id !== editingTx?.id
      )
      .reduce((s, t) => s + t.nominal, 0);
    return { item, paguTw, sisa: paguTw - usedOther };
  }, [formState.jenis, formState.budgetItemId, formState.triwulan, budgetItems, transactions, editingTx]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Buku Kas Umum (BKU) Dana BOS
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Pencatatan kronologis penerimaan dan pengeluaran kas beserta saldo berjalan dan tautan langsung ke Kwitansi SPJ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat Transaksi BKU
          </button>

          <button
            type="button"
            onClick={onExportBkuPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Ekspor PDF Buku Kas Umum
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-4">
          <div className="text-xs text-slate-500">Saldo Awal Periode</div>
          <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900">
            {formatRupiah(openingBalance)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Penerimaan Kas Masuk</div>
          <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-emerald-800">
            {formatRupiah(totalMasuk)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Pengeluaran Belanja BOS</div>
          <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900">
            {formatRupiah(totalKeluar)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Saldo Akhir Buku Kas</div>
          <div
            className={`mt-1 text-lg font-semibold font-mono tabular-nums ${
              saldoAkhir < 0 ? 'text-red-700' : 'text-blue-900'
            }`}
          >
            {formatRupiah(saldoAkhir)}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-blue-300 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {editingTx ? `Sunting Transaksi ${editingTx.noBukti}` : 'Catat Transaksi Buku Kas Umum'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingTx(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Jenis Transaksi</label>
              <select
                value={formState.jenis}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    jenis: e.target.value as 'penerimaan' | 'pengeluaran',
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="pengeluaran">Pengeluaran (Belanja)</option>
                <option value="penerimaan">Penerimaan (Dana Masuk)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Triwulan</label>
              <select
                value={formState.triwulan}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    triwulan: Number(e.target.value) as Triwulan,
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value={1}>Triwulan 1 (Jan–Mar)</option>
                <option value={2}>Triwulan 2 (Apr–Jun)</option>
                <option value={3}>Triwulan 3 (Jul–Sep)</option>
                <option value={4}>Triwulan 4 (Okt–Des)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Buku</label>
              <input
                type="date"
                value={formState.tanggal}
                onChange={(e) => setFormState({ ...formState, tanggal: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Bukti / Kwitansi</label>
              <input
                type="text"
                value={formState.noBukti}
                onChange={(e) => setFormState({ ...formState, noBukti: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                min={1}
                value={formState.nominal}
                onChange={(e) =>
                  setFormState({ ...formState, nominal: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs font-mono font-semibold tabular-nums border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          {formState.jenis === 'pengeluaran' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pos Anggaran Kegiatan (RKAS)
                </label>
                <select
                  value={formState.budgetItemId || ''}
                  onChange={(e) => {
                    const chosen = budgetItems.find((b) => b.id === e.target.value);
                    if (chosen) {
                      const twKey = `tw${formState.triwulan}` as 'tw1' | 'tw2' | 'tw3' | 'tw4';
                      setFormState({
                        ...formState,
                        budgetItemId: chosen.id,
                        kodeRekening: chosen.kodeRekening,
                        uraian: `Pembayaran ${chosen.uraian} — Triwulan ${formState.triwulan}`,
                        nominal: formState.nominal || chosen[twKey],
                        rincianKwitansi: chosen.keterangan
                          ? `${chosen.uraian} (${chosen.keterangan})`
                          : chosen.uraian,
                      });
                    } else {
                      setFormState({ ...formState, budgetItemId: '' });
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- Tanpa Tautan Pos Anggaran --</option>
                  {budgetItems.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.categoryName}] {b.uraian} (Pagu TW {formState.triwulan}:{' '}
                      {formatRupiah(b[`tw${formState.triwulan}` as 'tw1' | 'tw2' | 'tw3' | 'tw4'])})
                    </option>
                  ))}
                </select>
                {selectedItemInfo && (
                  <p className="mt-1 text-[11px] text-slate-600">
                    Pagu TW {formState.triwulan}:{' '}
                    <span className="font-mono font-medium">
                      {formatRupiah(selectedItemInfo.paguTw)}
                    </span>{' '}
                    · Sisa pagu tersedia:{' '}
                    <span
                      className={`font-mono font-semibold ${
                        formState.nominal > selectedItemInfo.sisa
                          ? 'text-red-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {formatRupiah(selectedItemInfo.sisa)}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Penerima Kwitansi
                  </label>
                  <input
                    type="text"
                    value={formState.penerima}
                    onChange={(e) => setFormState({ ...formState, penerima: e.target.value })}
                    placeholder="Nama rekanan / koordinator"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Jabatan / Keterangan Penerima
                  </label>
                  <input
                    type="text"
                    value={formState.jabatanPenerima}
                    onChange={(e) =>
                      setFormState({ ...formState, jabatanPenerima: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Uraian Buku Kas Umum</label>
              <input
                type="text"
                value={formState.uraian}
                onChange={(e) => setFormState({ ...formState, uraian: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kode Rekening</label>
              <input
                type="text"
                value={formState.kodeRekening}
                onChange={(e) => setFormState({ ...formState, kodeRekening: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Simpan ke Buku Kas Umum
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
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
                {tw === 'all' ? 'Semua TW' : `TW ${tw}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {(
              [
                { id: 'all', label: 'Semua Arus' },
                { id: 'penerimaan', label: 'Penerimaan' },
                { id: 'pengeluaran', label: 'Pengeluaran' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setJenisFilter(opt.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  jenisFilter === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. bukti, uraian, penerima..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
          />
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="py-3 px-3 text-center font-semibold w-10">No.</th>
                <th className="py-3 px-3 text-left font-semibold whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-3 text-left font-semibold whitespace-nowrap">No. Bukti</th>
                <th className="py-3 px-3 text-left font-semibold whitespace-nowrap">Kode Rek.</th>
                <th className="py-3 px-4 text-left font-semibold min-w-[260px]">Uraian Transaksi</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Penerimaan (Rp)</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Pengeluaran (Rp)</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Saldo (Rp)</th>
                <th className="py-3 px-3 text-center font-semibold w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {twFilter !== 'all' && jenisFilter === 'all' && !searchQuery && (
                <tr className="bg-slate-50/80 font-medium text-slate-700">
                  <td className="py-2.5 px-3 text-center">-</td>
                  <td className="py-2.5 px-3 font-mono">-</td>
                  <td className="py-2.5 px-3 font-mono">-</td>
                  <td className="py-2.5 px-3 font-mono">-</td>
                  <td className="py-2.5 px-4">Saldo Awal Pindahan Triwulan {twFilter}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {formatRupiah(openingBalance, false)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">-</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                    {formatRupiah(openingBalance, false)}
                  </td>
                  <td className="py-2.5 px-3" />
                </tr>
              )}

              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    Tidak ada transaksi BKU yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {row.tanggal}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-800 whitespace-nowrap">
                      {row.noBukti}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {row.kodeRekening}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900">{row.uraian}</div>
                      <div className="text-[11px] text-slate-500">
                        TW {row.triwulan} · {row.penerima}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-800 font-medium">
                      {row.jenis === 'penerimaan' ? formatRupiah(row.nominal, false) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-medium">
                      {row.jenis === 'pengeluaran' ? formatRupiah(row.nominal, false) : '-'}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                        row.saldoSetelah < 0 ? 'text-red-700' : 'text-slate-900'
                      }`}
                    >
                      {formatRupiah(row.saldoSetelah, false)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        {row.jenis === 'pengeluaran' && (
                          <button
                            type="button"
                            onClick={() => onOpenKwitansiForTx(row.id)}
                            title="Lihat & Cetak Kwitansi"
                            className="p-1.5 text-blue-900 hover:bg-blue-50 rounded"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditForm(row)}
                          title="Sunting Transaksi"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(row.id)}
                          title="Hapus Transaksi"
                          className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold text-slate-900">
                <td colSpan={5} className="py-3 px-4">
                  JUMLAH PERIODE ({twFilter === 'all' ? 'TAHUN PENUH' : `TRIWULAN ${twFilter}`})
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-800">
                  {formatRupiah(totalMasuk + openingBalance, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatRupiah(totalKeluar, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-blue-900">
                  {formatRupiah(saldoAkhir, false)}
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
