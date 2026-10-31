import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  BkuTransaction,
  BudgetItem,
  HonorRecipient,
  Triwulan,
  TriwulanFilter,
} from '../types/lpj';
import { formatRupiah } from '../utils/formatters';

interface HonorModuleProps {
  budgetItems: BudgetItem[];
  transactions: BkuTransaction[];
  honorRecipients: HonorRecipient[];
  twFilter: TriwulanFilter;
  onChangeTwFilter: (tw: TriwulanFilter) => void;
  onSaveRecipient: (rec: HonorRecipient) => void;
  onDeleteRecipient: (id: string) => void;
  onExportHonorPdf: (budgetItemId: string | 'all', tw: TriwulanFilter) => void;
}

export const HonorModule: React.FC<HonorModuleProps> = ({
  budgetItems,
  transactions,
  honorRecipients,
  twFilter,
  onChangeTwFilter,
  onSaveRecipient,
  onDeleteRecipient,
  onExportHonorPdf,
}) => {
  const honorItems = useMemo(() => {
    return budgetItems.filter((item) => {
      const cat = item.categoryName.toLowerCase();
      const ur = item.uraian.toLowerCase();
      return (
        cat.includes('honor') ||
        ur.includes('honor') ||
        ur.includes('transport ekstrakulikuler') ||
        ur.includes('transport ekstrakurikuler')
      );
    });
  }, [budgetItems]);

  const [selectedItemId, setSelectedItemId] = useState<string | 'all'>('all');
  const [editingRec, setEditingRec] = useState<HonorRecipient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const defaultTw: Triwulan = twFilter === 'all' ? 1 : twFilter;
  const [formState, setFormState] = useState<Omit<HonorRecipient, 'id'>>({
    budgetItemId: honorItems[0]?.id || '',
    triwulan: defaultTw,
    nama: '',
    jabatan: 'Guru / Pelaksana',
    golongan: 'Non-ASN',
    rincianVolume: '3 Bulan',
    satuanNominal: 150_000,
    jumlahVolume: 3,
    jumlahBruto: 450_000,
    tarifPphPercent: 0,
    pphNominal: 0,
    jumlahNetto: 450_000,
  });

  const visibleRecipients = useMemo(() => {
    return honorRecipients.filter((hr) => {
      const matchItem = selectedItemId === 'all' || hr.budgetItemId === selectedItemId;
      const matchTw = twFilter === 'all' || hr.triwulan === twFilter;
      return matchItem && matchTw;
    });
  }, [honorRecipients, selectedItemId, twFilter]);

  // Calculate target BKU / Pagu total for the currently filtered Honor selection
  const targetPaguHonor = useMemo(() => {
    const relevantItems =
      selectedItemId === 'all'
        ? honorItems
        : honorItems.filter((i) => i.id === selectedItemId);

    let sum = 0;
    relevantItems.forEach((item) => {
      const tws: Triwulan[] = twFilter === 'all' ? [1, 2, 3, 4] : [twFilter];
      tws.forEach((tw) => {
        const bkuOut = transactions
          .filter((t) => t.jenis === 'pengeluaran' && t.budgetItemId === item.id && t.triwulan === tw)
          .reduce((s, t) => s + t.nominal, 0);
        const paguTw = item[`tw${tw}` as 'tw1' | 'tw2' | 'tw3' | 'tw4'];
        sum += bkuOut > 0 ? bkuOut : paguTw;
      });
    });
    return sum;
  }, [honorItems, selectedItemId, twFilter, transactions]);

  const totalBruto = visibleRecipients.reduce((s, r) => s + r.jumlahBruto, 0);
  const totalPph = visibleRecipients.reduce((s, r) => s + r.pphNominal, 0);
  const totalNetto = visibleRecipients.reduce((s, r) => s + r.jumlahNetto, 0);
  const selisihHonor = targetPaguHonor - totalBruto;

  const recalcHonorAmounts = (
    satuan: number,
    vol: number,
    pphRate: number
  ): Pick<HonorRecipient, 'jumlahBruto' | 'pphNominal' | 'jumlahNetto'> => {
    const bruto = Math.round(satuan * vol);
    const pph = Math.round((bruto * pphRate) / 100);
    return {
      jumlahBruto: bruto,
      pphNominal: pph,
      jumlahNetto: bruto - pph,
    };
  };

  const openAddForm = () => {
    const activeItem =
      selectedItemId !== 'all'
        ? honorItems.find((i) => i.id === selectedItemId) || honorItems[0]
        : honorItems[0];
    const tw: Triwulan = twFilter === 'all' ? 1 : twFilter;
    setEditingRec(null);
    setFormState({
      budgetItemId: activeItem?.id || '',
      triwulan: tw,
      nama: '',
      jabatan: 'Guru / Pelaksana Kegiatan',
      golongan: 'Non-ASN',
      rincianVolume: '3 Bulan',
      satuanNominal: 150_000,
      jumlahVolume: 3,
      jumlahBruto: 450_000,
      tarifPphPercent: 0,
      pphNominal: 0,
      jumlahNetto: 450_000,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (rec: HonorRecipient) => {
    setEditingRec(rec);
    setFormState({
      budgetItemId: rec.budgetItemId,
      triwulan: rec.triwulan,
      nama: rec.nama,
      jabatan: rec.jabatan,
      golongan: rec.golongan,
      rincianVolume: rec.rincianVolume,
      satuanNominal: rec.satuanNominal,
      jumlahVolume: rec.jumlahVolume,
      jumlahBruto: rec.jumlahBruto,
      tarifPphPercent: rec.tarifPphPercent,
      pphNominal: rec.pphNominal,
      jumlahNetto: rec.jumlahNetto,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nama.trim() || !formState.budgetItemId) return;
    onSaveRecipient({
      ...formState,
      id: editingRec ? editingRec.id : `hon-custom-${Date.now()}`,
    });
    setIsFormOpen(false);
    setEditingRec(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Daftar Penerimaan Honorarium (SPJ Honor)
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Rincian penerima honor guru, tim pengelola hibah BOS, pembina ekstrakurikuler, koreksi LJK PTS/PAS, dan penyusunan soal lengkap dengan perhitungan PPh Pasal 21.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Penerima Honor
          </button>

          <button
            type="button"
            disabled={visibleRecipients.length === 0}
            onClick={() => onExportHonorPdf(selectedItemId, twFilter)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Ekspor PDF Daftar Tanda Tangan Honor
          </button>
        </div>
      </div>

      {/* Reconciliation Strip */}
      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-4">
          <div className="text-xs text-slate-500">Target Pagu / Kwitansi BKU</div>
          <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900">
            {formatRupiah(targetPaguHonor)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Total Honor Bruto Terdaftar</div>
          <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900">
            {formatRupiah(totalBruto)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Diterima Bersih (Netto)</div>
          <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-blue-900">
            {formatRupiah(totalNetto)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Potongan PPh 21: {formatRupiah(totalPph)}
          </div>
        </div>
        <div className="p-4 flex flex-col justify-center">
          <div className="text-xs text-slate-500">Kesesuaian terhadap Kwitansi</div>
          <div className="mt-1 flex items-center gap-1.5">
            {selisihHonor === 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-sm font-semibold text-emerald-800">
                  Sinkron (Selisih Rp 0)
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="text-sm font-semibold font-mono tabular-nums text-red-700">
                  Selisih {formatRupiah(Math.abs(selisihHonor))}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Recipient Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-blue-300 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {editingRec ? `Sunting Penerima Honor: ${editingRec.nama}` : 'Tambah Baris Penerima Honorarium'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingRec(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Komponen Kegiatan Honorarium
              </label>
              <select
                value={formState.budgetItemId}
                onChange={(e) => setFormState({ ...formState, budgetItemId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                required
              >
                {honorItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.uraian} (Pagu Tahunan: {formatRupiah(item.jumlah)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Triwulan</label>
              <select
                value={formState.triwulan}
                onChange={(e) =>
                  setFormState({ ...formState, triwulan: Number(e.target.value) as Triwulan })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value={1}>Triwulan 1</option>
                <option value={2}>Triwulan 2</option>
                <option value={3}>Triwulan 3</option>
                <option value={4}>Triwulan 4</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Golongan / Tarif PPh 21
              </label>
              <select
                value={formState.tarifPphPercent}
                onChange={(e) => {
                  const rate = Number(e.target.value);
                  const golLabel =
                    rate === 15 ? 'Gol. IV (PNS)' : rate === 5 ? 'Gol. III (PNS)' : 'Non-ASN';
                  const calc = recalcHonorAmounts(
                    formState.satuanNominal,
                    formState.jumlahVolume,
                    rate
                  );
                  setFormState({
                    ...formState,
                    tarifPphPercent: rate,
                    golongan: golLabel,
                    ...calc,
                  });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value={0}>Non-ASN / PTKP (PPh 0%)</option>
                <option value={5}>ASN Golongan III (PPh 5%)</option>
                <option value={15}>ASN Golongan IV (PPh 15%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Lengkap & Gelar Penerima
              </label>
              <input
                type="text"
                value={formState.nama}
                onChange={(e) => setFormState({ ...formState, nama: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Jabatan / Mapel</label>
              <input
                type="text"
                value={formState.jabatan}
                onChange={(e) => setFormState({ ...formState, jabatan: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Keterangan Volume</label>
              <input
                type="text"
                value={formState.rincianVolume}
                onChange={(e) => setFormState({ ...formState, rincianVolume: e.target.value })}
                placeholder="3 Bulan / 828 LJK"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Jml Kali</label>
                <input
                  type="number"
                  min={1}
                  value={formState.jumlahVolume}
                  onChange={(e) => {
                    const vol = Number(e.target.value) || 0;
                    const calc = recalcHonorAmounts(
                      formState.satuanNominal,
                      vol,
                      formState.tarifPphPercent
                    );
                    setFormState({ ...formState, jumlahVolume: vol, ...calc });
                  }}
                  className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Satuan (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={formState.satuanNominal}
                  onChange={(e) => {
                    const sat = Number(e.target.value) || 0;
                    const calc = recalcHonorAmounts(
                      sat,
                      formState.jumlahVolume,
                      formState.tarifPphPercent
                    );
                    setFormState({ ...formState, satuanNominal: sat, ...calc });
                  }}
                  className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="text-xs font-mono text-slate-700">
              Bruto: <strong>{formatRupiah(formState.jumlahBruto)}</strong> · PPh 21:{' '}
              <strong>{formatRupiah(formState.pphNominal)}</strong> · Netto Diterima:{' '}
              <strong className="text-blue-900">{formatRupiah(formState.jumlahNetto)}</strong>
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Simpan Baris Penerima
            </button>
          </div>
        </form>
      )}

      {/* Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-slate-600">Pilih Jenis Honor:</label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-900"
          >
            <option value="all">Semua Jenis Honorarium ({honorItems.length} Kegiatan)</option>
            {honorItems.map((h) => (
              <option key={h.id} value={h.id}>
                {h.uraian} — {formatRupiah(h.jumlah)}
              </option>
            ))}
          </select>
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
              {tw === 'all' ? 'Semua TW' : `Triwulan ${tw}`}
            </button>
          ))}
        </div>
      </div>

      {/* Honorarium Signature Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="py-3 px-3 text-center font-semibold w-10">No.</th>
                <th className="py-3 px-4 text-left font-semibold min-w-[190px]">Nama Penerima</th>
                <th className="py-3 px-3 text-left font-semibold min-w-[180px]">Jabatan & Kegiatan</th>
                <th className="py-3 px-3 text-center font-semibold">TW</th>
                <th className="py-3 px-3 text-left font-semibold whitespace-nowrap">Volume</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Satuan (Rp)</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Jumlah Bruto</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">PPh 21</th>
                <th className="py-3 px-3 text-right font-semibold whitespace-nowrap">Diterima Netto</th>
                <th className="py-3 px-4 text-left font-semibold min-w-[150px]">Kolom TTD SPJ</th>
                <th className="py-3 px-3 text-center font-semibold w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleRecipients.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500">
                    Tidak ada daftar penerima honor pada kombinasi kegiatan dan Triwulan ini (alokasi pagu Rp 0 pada Triwulan terpilih).
                  </td>
                </tr>
              ) : (
                visibleRecipients.map((row, idx) => {
                  const itemObj = budgetItems.find((b) => b.id === row.budgetItemId);
                  const num = idx + 1;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-500">
                        {num}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-900">{row.nama}</div>
                        <div className="text-[11px] text-slate-500">{row.golongan}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800">{row.jabatan}</div>
                        <div className="text-[11px] text-slate-500">{itemObj?.uraian}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                        TW {row.triwulan}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{row.rincianVolume}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        {formatRupiah(row.satuanNominal, false)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatRupiah(row.jumlahBruto, false)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                        {row.pphNominal > 0 ? formatRupiah(row.pphNominal, false) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-blue-900">
                        {formatRupiah(row.jumlahNetto, false)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                        {num % 2 === 1 ? (
                          <span>{num}. ....................</span>
                        ) : (
                          <span className="pl-6">{num}. ....................</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(row)}
                            title="Sunting Penerima"
                            className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecipient(row.id)}
                            title="Hapus Baris"
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
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
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold text-slate-900">
                <td colSpan={6} className="py-3 px-4">
                  JUMLAH DAFTAR PENERIMAAN HONORARIUM ({visibleRecipients.length} BARIS)
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatRupiah(totalBruto, false)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {totalPph > 0 ? formatRupiah(totalPph, false) : '-'}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-blue-900">
                  {formatRupiah(totalNetto, false)}
                </td>
                <td colSpan={2} className="py-3 px-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
};
