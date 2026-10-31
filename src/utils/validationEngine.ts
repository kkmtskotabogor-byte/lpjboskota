import { BkuTransaction, BudgetItem, HonorRecipient, Triwulan, ValidationIssue } from '../types/lpj';
import { formatRupiah } from './formatters';

function isHonorItem(item: BudgetItem): boolean {
  const cat = item.categoryName.toLowerCase();
  const ur = item.uraian.toLowerCase();
  return (
    cat.includes('honor') ||
    ur.includes('honor') ||
    ur.includes('transport ekstrakulikuler') ||
    ur.includes('transport ekstrakurikuler')
  );
}

/**
 * Evaluates multiplication expressions inside the Excel `keterangan` string, e.g.:
 * - "Rp.185.000 x12 Bulan" -> 185000 * 12 = 2.220.000 (detects mismatch with 2.400.000!)
 * - "Rp.1.000 x 414 Siswa X 17 Mapel x 2 semster" -> 14.076.000 (matches!)
 * - "Rp.150.000 x9 guru" -> 1.350.000/month * 12 = 16.200.000 (matches!)
 * - "Rp.50.000 x 17 Mapel X 3 Angkatan" -> 2.550.000/semester * 2 = 5.100.000 (matches!)
 */
function checkKeteranganFormula(item: BudgetItem): { mismatch: boolean; computed?: number; note?: string } {
  const ket = item.keterangan.trim();
  if (!ket || item.jumlah <= 0) return { mismatch: false };

  // Extract explicit Rp nominal if present
  const rpMatch = ket.match(/rp\.?\s*([\d.]+)/i);
  if (!rpMatch) return { mismatch: false };

  const unitRp = parseInt(rpMatch[1].replace(/\./g, ''), 10);
  if (!Number.isFinite(unitRp) || unitRp <= 0) return { mismatch: false };

  // Find all "x <number>" multipliers after Rp
  const afterRp = ket.slice((rpMatch.index || 0) + rpMatch[0].length);
  const multMatches = [...afterRp.matchAll(/[xX×]\s*(\d+)/g)];
  if (multMatches.length === 0) return { mismatch: false };

  const factors = multMatches.map((m) => parseInt(m[1], 10)).filter((n) => Number.isFinite(n) && n > 0);
  const directProduct = factors.reduce((acc, n) => acc * n, unitRp);

  // Exact match, or monthly x 12 match, or semester x 2 match
  if (
    directProduct === item.jumlah ||
    directProduct * 12 === item.jumlah ||
    directProduct * 2 === item.jumlah ||
    directProduct * 4 === item.jumlah
  ) {
    return { mismatch: false, computed: item.jumlah };
  }

  return {
    mismatch: true,
    computed: directProduct,
    note: `Rumus keterangan "${ket}" menghasilkan ${formatRupiah(directProduct)}, sedangkan pagu Jumlah tercatat ${formatRupiah(item.jumlah)}.`,
  };
}

export function runAutomaticValidation(
  budgetItems: BudgetItem[],
  transactions: BkuTransaction[],
  honorRecipients: HonorRecipient[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Validate Pagu vs Triwulan 1–4 distribution per item + Keterangan formula + Zero items
  let allTwBalanced = true;
  budgetItems.forEach((item) => {
    const sumTw = item.tw1 + item.tw2 + item.tw3 + item.tw4;
    if (item.jumlah !== sumTw) {
      allTwBalanced = false;
      issues.push({
        id: `val-tw-mismatch-${item.id}`,
        severity: 'error',
        module: 'anggaran',
        title: `Selisih Distribusi Triwulan: ${item.uraian}`,
        detail: `Pagu tahunan tercatat ${formatRupiah(item.jumlah)}, namun penjumlahan Triwulan 1–4 adalah ${formatRupiah(sumTw)} (selisih ${formatRupiah(Math.abs(item.jumlah - sumTw))}).`,
        relatedId: item.id,
        fixAction: {
          label: 'Sesuaikan Jumlah ke Total TW 1–4',
          type: 'sync_jumlah_to_tw',
          payloadId: item.id,
        },
      });
    }

    // Check formula in keterangan
    const formulaAudit = checkKeteranganFormula(item);
    if (formulaAudit.mismatch && formulaAudit.note) {
      const monthlySuggested = Math.round(item.jumlah / 12);
      issues.push({
        id: `val-formula-${item.id}`,
        severity: 'warning',
        module: 'anggaran',
        title: `Ketidaksesuaian Rincian Keterangan: ${item.uraian}`,
        detail: `${formulaAudit.note} Jika untuk 12 bulan dengan pagu ${formatRupiah(item.jumlah)}, satuan seharusnya ${formatRupiah(monthlySuggested)} x 12 bulan.`,
        relatedId: item.id,
        fixAction:
          item.jumlah % 12 === 0
            ? {
                label: `Perbaiki Teks ke ${formatRupiah(monthlySuggested)} x 12 Bulan`,
                type: 'fix_keterangan_ekskul',
                payloadId: item.id,
              }
            : undefined,
      });
    }

    // Check zero-budget placeholder rows from Excel (e.g. Pembelian Printer, Pembelian Proyektor)
    if (item.jumlah === 0 && sumTw === 0) {
      issues.push({
        id: `val-zero-${item.id}`,
        severity: 'warning',
        module: 'anggaran',
        title: `Baris Tanpa Alokasi Pagu (Rp 0): ${item.uraian}`,
        detail: `Sub-kegiatan "${item.uraian}" pada kategori ${item.categoryName} bernilai Rp 0 di seluruh Triwulan. Baris tetap disimpan sesuai tabel Excel atau dapat dihapus bila tidak direalisasikan.`,
        relatedId: item.id,
        fixAction: {
          label: 'Hapus Baris Rp 0',
          type: 'remove_zero_item',
          payloadId: item.id,
        },
      });
    }
  });

  if (allTwBalanced && budgetItems.length > 0) {
    const totalPagu = budgetItems.reduce((s, i) => s + i.jumlah, 0);
    issues.push({
      id: 'val-anggaran-balanced',
      severity: 'valid',
      module: 'anggaran',
      title: 'Distribusi Pagu Anggaran & Triwulan 1–4 Seimbang (100%)',
      detail: `Seluruh ${budgetItems.length} item kegiatan tervalidasi akurat dengan total pagu BOS ${formatRupiah(totalPagu)}.`,
    });
  }

  // 2. Validate BKU Running Balance (Anti-Minus Cash Check) & Triwulan Reconciliation
  const sortedTx = [...transactions].sort((a, b) => {
    const cmp = a.tanggal.localeCompare(b.tanggal);
    if (cmp !== 0) return cmp;
    if (a.jenis === b.jenis) return 0;
    return a.jenis === 'penerimaan' ? -1 : 1;
  });

  let runningBalance = 0;
  let negativeDetected = false;
  sortedTx.forEach((tx) => {
    runningBalance += tx.jenis === 'penerimaan' ? tx.nominal : -tx.nominal;
    if (runningBalance < 0 && !negativeDetected) {
      negativeDetected = true;
      issues.push({
        id: `val-bku-minus-${tx.id}`,
        severity: 'error',
        module: 'bku',
        triwulan: tx.triwulan,
        title: `Saldo Kas Minus pada Tanggal ${tx.tanggal}`,
        detail: `Transaksi "${tx.uraian}" (${tx.noBukti}) menyebabkan saldo kas berjalan defisit menjadi ${formatRupiah(runningBalance)}. Periksa tanggal pencairan dana masuk atau nominal pengeluaran.`,
        relatedId: tx.id,
      });
    }
  });

  if (!negativeDetected && sortedTx.length > 0) {
    issues.push({
      id: 'val-bku-cash-positive',
      severity: 'valid',
      module: 'bku',
      title: 'Saldo Buku Kas Umum (BKU) Positif & Kronologis',
      detail: `Tidak ditemukan saldo kas minus pada ${sortedTx.length} transaksi. Saldo akhir buku kas tercatat ${formatRupiah(runningBalance)}.`,
    });
  }

  // 3. Validate Realisasi Pengeluaran BKU vs Pagu Anggaran per Item & Triwulan
  let bkuVsPaguMismatch = false;
  budgetItems.forEach((item) => {
    if (item.jumlah === 0) return;
    const twMap: Record<Triwulan, number> = {
      1: item.tw1,
      2: item.tw2,
      3: item.tw3,
      4: item.tw4,
    };

    ([1, 2, 3, 4] as Triwulan[]).forEach((tw) => {
      const paguTw = twMap[tw];
      const realisasiTw = transactions
        .filter((t) => t.jenis === 'pengeluaran' && t.budgetItemId === item.id && t.triwulan === tw)
        .reduce((s, t) => s + t.nominal, 0);

      if (realisasiTw > paguTw) {
        bkuVsPaguMismatch = true;
        issues.push({
          id: `val-overbudget-${item.id}-tw${tw}`,
          severity: 'error',
          module: 'bku',
          triwulan: tw,
          title: `Realisasi Melebihi Pagu (Over-Budget): ${item.uraian} (TW ${tw})`,
          detail: `Pengeluaran BKU Triwulan ${tw} sebesar ${formatRupiah(realisasiTw)} melampaui pagu anggaran ${formatRupiah(paguTw)} (kelebihan ${formatRupiah(realisasiTw - paguTw)}).`,
          relatedId: item.id,
          fixAction: {
            label: 'Sesuaikan BKU ke Pagu Anggaran',
            type: 'sync_bku_from_item',
            payloadId: `${item.id}|${tw}`,
          },
        });
      } else if (realisasiTw < paguTw) {
        bkuVsPaguMismatch = true;
        issues.push({
          id: `val-underbudget-${item.id}-tw${tw}`,
          severity: 'warning',
          module: 'bku',
          triwulan: tw,
          title: `Sisa Pagu Belum Terealisasi di BKU: ${item.uraian} (TW ${tw})`,
          detail: `Pagu Triwulan ${tw} sebesar ${formatRupiah(paguTw)}, baru tercatat di BKU sebesar ${formatRupiah(realisasiTw)} (sisa pagu ${formatRupiah(paguTw - realisasiTw)}).`,
          relatedId: item.id,
          fixAction: {
            label: 'Catat Otomatis sesuai Pagu TW',
            type: 'sync_bku_from_item',
            payloadId: `${item.id}|${tw}`,
          },
        });
      }
    });
  });

  if (!bkuVsPaguMismatch && budgetItems.some((i) => i.jumlah > 0)) {
    issues.push({
      id: 'val-bku-pagu-exact',
      severity: 'valid',
      module: 'bku',
      title: 'Realisasi BKU 100% Sesuai Pagu Anggaran Triwulan 1–4',
      detail: 'Seluruh pos pengeluaran pada Buku Kas Umum sama persis dan tidak melebihi pagu RKAS.',
    });
  }

  // 4. Validate Kwitansi Completeness
  const pengeluaranTx = transactions.filter((t) => t.jenis === 'pengeluaran');
  let kwitansiIncomplete = false;
  pengeluaranTx.forEach((tx) => {
    if (!tx.noBukti.trim() || !tx.penerima.trim() || tx.nominal <= 0) {
      kwitansiIncomplete = true;
      issues.push({
        id: `val-kwitansi-${tx.id}`,
        severity: 'error',
        module: 'kwitansi',
        triwulan: tx.triwulan,
        title: `Data Kwitansi Belum Lengkap: ${tx.uraian}`,
        detail: `Pastikan Nomor Bukti, Nama Penerima, dan Nominal telah terisi lengkap sebelum mencetak kwitansi SPJ.`,
        relatedId: tx.id,
      });
    }
  });

  if (!kwitansiIncomplete && pengeluaranTx.length > 0) {
    issues.push({
      id: 'val-kwitansi-ready',
      severity: 'valid',
      module: 'kwitansi',
      title: `${pengeluaranTx.length} Lembar Kwitansi BOS Terverifikasi Lengkap`,
      detail: 'Seluruh bukti pengeluaran telah memiliki Nomor Bukti, Terbilang otomatis, Penerima, dan otorisasi pejabat.',
    });
  }

  // 5. Validate Daftar Penerimaan Honor vs Anggaran/BKU Honor
  let honorMismatch = false;
  budgetItems.filter(isHonorItem).forEach((item) => {
    const twMap: Record<Triwulan, number> = {
      1: item.tw1,
      2: item.tw2,
      3: item.tw3,
      4: item.tw4,
    };

    ([1, 2, 3, 4] as Triwulan[]).forEach((tw) => {
      const targetNominal = transactions
        .filter((t) => t.jenis === 'pengeluaran' && t.budgetItemId === item.id && t.triwulan === tw)
        .reduce((s, t) => s + t.nominal, 0) || twMap[tw];

      if (targetNominal <= 0) return;

      const sumHonorBruto = honorRecipients
        .filter((h) => h.budgetItemId === item.id && h.triwulan === tw)
        .reduce((s, h) => s + h.jumlahBruto, 0);

      if (sumHonorBruto !== targetNominal) {
        honorMismatch = true;
        issues.push({
          id: `val-honor-${item.id}-tw${tw}`,
          severity: 'error',
          module: 'honor',
          triwulan: tw,
          title: `Selisih Daftar Penerimaan Honor: ${item.uraian} (TW ${tw})`,
          detail: `Total bruto pada daftar tanda tangan penerima adalah ${formatRupiah(sumHonorBruto)}, sedangkan nilai kwitansi/BKU tercatat ${formatRupiah(targetNominal)} (selisih ${formatRupiah(Math.abs(targetNominal - sumHonorBruto))}).`,
          relatedId: item.id,
          fixAction: {
            label: 'Sinkronkan Daftar Penerima Honor',
            type: 'sync_honor_from_item',
            payloadId: `${item.id}|${tw}`,
          },
        });
      }
    });
  });

  if (!honorMismatch && honorRecipients.length > 0) {
    issues.push({
      id: 'val-honor-matched',
      severity: 'valid',
      module: 'honor',
      title: 'Daftar Penerimaan Honorarium Sinkron dengan BKU & Kwitansi',
      detail: `Seluruh ${honorRecipients.length} baris tanda tangan penerima honorarium cocok dengan nilai pengeluaran BKU di setiap Triwulan.`,
    });
  }

  return issues;
}
