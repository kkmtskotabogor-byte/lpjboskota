import * as XLSX from 'xlsx';
import { BkuTransaction, BudgetItem, HonorRecipient, SchoolProfile } from '../types/lpj';
import { parseIndonesianNumber } from './formatters';

export interface ExcelParseResult {
  items: BudgetItem[];
  sheetName: string;
  totalImportedPagu: number;
  warnings: string[];
}

function defaultKodeRekeningForCategory(categoryName: string, uraian: string): string {
  const cat = categoryName.toLowerCase();
  const ur = uraian.toLowerCase();
  if (cat.includes('honor') || ur.includes('honor') || ur.includes('transport')) {
    return '5.1.02.02.01.0013';
  }
  if (cat.includes('kegiatan')) {
    return '5.1.02.02.04.0036';
  }
  if (cat.includes('operasional') || ur.includes('internet') || ur.includes('listrik')) {
    return '5.1.02.02.01.0063';
  }
  if (ur.includes('laptop') || ur.includes('printer') || ur.includes('proyektor') || ur.includes('meja')) {
    return '5.2.02.10.01.0002';
  }
  return '5.1.02.01.01.0026';
}

export async function parseBudgetExcelFile(file: File): Promise<ExcelParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  let headerRowIdx = -1;
  let colMap = {
    no: 0,
    uraian: 1,
    subTotal: 2,
    jumlah: 3,
    keterangan: 4,
    tw1: 5,
    tw2: 6,
    tw3: 7,
    tw4: 8,
  };

  for (let r = 0; r < Math.min(rawRows.length, 20); r++) {
    const row = rawRows[r] || [];
    const normalized = row.map((cell) => String(cell ?? '').toLowerCase().trim());
    const uraianIdx = normalized.findIndex((c) => c.includes('uraian'));
    const tw1Idx = normalized.findIndex(
      (c) => c.includes('tri wulan 1') || c.includes('triwulan 1') || c === 'tw 1' || c === 'tw1'
    );

    if (uraianIdx !== -1) {
      headerRowIdx = r;
      const noIdx = normalized.findIndex((c) => c === 'no' || c === 'no.');
      const subIdx = normalized.findIndex((c) => c.includes('sub kegiatan') || c.includes('per sub'));
      const jmlIdx = normalized.findIndex(
        (c, idx) => idx !== subIdx && (c === 'jumlah' || c.includes('jumlah anggaran') || c.includes('pagu'))
      );
      const ketIdx = normalized.findIndex((c) => c.includes('keterangan') || c.includes('rincian'));
      const t1 = tw1Idx !== -1 ? tw1Idx : ketIdx !== -1 ? ketIdx + 1 : 5;

      colMap = {
        no: noIdx !== -1 ? noIdx : Math.max(0, uraianIdx - 1),
        uraian: uraianIdx,
        subTotal: subIdx !== -1 ? subIdx : uraianIdx + 1,
        jumlah: jmlIdx !== -1 ? jmlIdx : uraianIdx + 2,
        keterangan: ketIdx !== -1 ? ketIdx : uraianIdx + 3,
        tw1: t1,
        tw2: t1 + 1,
        tw3: t1 + 2,
        tw4: t1 + 3,
      };
      break;
    }
  }

  const startIdx = headerRowIdx !== -1 ? headerRowIdx + 1 : 1;
  let currentCategoryNo = '1';
  let currentCategoryName = 'Umum';
  const items: BudgetItem[] = [];
  const warnings: string[] = [];

  for (let r = startIdx; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    const rawNo = String(row[colMap.no] ?? '').trim().replace(/\.$/, '');
    const uraian = String(row[colMap.uraian] ?? '').trim();
    const subTotalVal = parseIndonesianNumber(row[colMap.subTotal]);
    const jumlahVal = parseIndonesianNumber(row[colMap.jumlah]);
    const keterangan = String(row[colMap.keterangan] ?? '').trim();
    const tw1 = parseIndonesianNumber(row[colMap.tw1]);
    const tw2 = parseIndonesianNumber(row[colMap.tw2]);
    const tw3 = parseIndonesianNumber(row[colMap.tw3]);
    const tw4 = parseIndonesianNumber(row[colMap.tw4]);

    if (!uraian) continue;

    const lowerUraian = uraian.toLowerCase();
    if (
      lowerUraian.startsWith('jumlah bos') ||
      lowerUraian === 'jumlah' ||
      lowerUraian === 'total' ||
      lowerUraian.startsWith('total anggaran')
    ) {
      continue;
    }

    const sumTw = tw1 + tw2 + tw3 + tw4;
    const isParentCategory =
      (rawNo !== '' && subTotalVal > 0 && jumlahVal === 0 && sumTw === 0) ||
      (rawNo !== '' && jumlahVal === 0 && sumTw === 0 && keterangan === '' && subTotalVal >= 0 &&
        ['honor', 'kegiatan', 'operasional', 'pemenuhan', 'sarana'].some((k) => lowerUraian.includes(k)));

    if (isParentCategory) {
      currentCategoryNo = rawNo || String(Number(currentCategoryNo) + 1);
      currentCategoryName = uraian;
      continue;
    }

    const finalJumlah = jumlahVal > 0 ? jumlahVal : sumTw;
    items.push({
      id: `imp-${Date.now()}-${r}`,
      categoryNo: currentCategoryNo,
      categoryName: currentCategoryName,
      kodeRekening: defaultKodeRekeningForCategory(currentCategoryName, uraian),
      uraian,
      jumlah: finalJumlah,
      keterangan: keterangan === '-' ? '' : keterangan,
      tw1,
      tw2,
      tw3,
      tw4,
    });

    if (finalJumlah !== sumTw && (finalJumlah > 0 || sumTw > 0)) {
      warnings.push(
        `Baris "${uraian}" memiliki selisih antara kolom Jumlah (${finalJumlah.toLocaleString('id-ID')}) dan total Triwulan 1–4 (${sumTw.toLocaleString('id-ID')}).`
      );
    }
  }

  if (items.length === 0) {
    throw new Error(
      'Tidak ditemukan baris rincian kegiatan pada file tersebut. Pastikan kolom mengikuti format template: No., Uraian Kegiatan, Jumlah per sub Kegiatan, Jumlah, keterangan, Tri Wulan 1–4.'
    );
  }

  const totalImportedPagu = items.reduce((sum, i) => sum + i.jumlah, 0);
  return {
    items,
    sheetName,
    totalImportedPagu,
    warnings,
  };
}

export function exportBudgetTemplateExcel(
  school: SchoolProfile,
  items: BudgetItem[],
  transactions: BkuTransaction[],
  honorRecipients: HonorRecipient[]
): void {
  const wb = XLSX.utils.book_new();

  const anggaranRows: (string | number)[][] = [
    [
      'No.',
      'Uraian Kegiatan',
      'Jumlah per sub Kegiatan',
      'Jumlah',
      'keterangan',
      'Tri Wulan 1',
      'Tri Wulan 2',
      'Tri Wulan 3',
      'Tri Wulan 4',
    ],
  ];

  const groups: { no: string; name: string; rows: BudgetItem[] }[] = [];
  items.forEach((item) => {
    const existing = groups.find((g) => g.no === item.categoryNo && g.name === item.categoryName);
    if (existing) {
      existing.rows.push(item);
    } else {
      groups.push({ no: item.categoryNo, name: item.categoryName, rows: [item] });
    }
  });

  groups.forEach((group) => {
    const subTotal = group.rows.reduce((sum, r) => sum + r.jumlah, 0);
    anggaranRows.push([`${group.no}.`, group.name, subTotal, '', '', '', '', '', '']);
    group.rows.forEach((r) => {
      anggaranRows.push([
        '',
        r.uraian,
        '',
        r.jumlah || '',
        r.keterangan || '',
        r.tw1 || '',
        r.tw2 || '',
        r.tw3 || '',
        r.tw4 || '',
      ]);
    });
  });

  const grandTotal = items.reduce((s, i) => s + i.jumlah, 0);
  const sumTw1 = items.reduce((s, i) => s + i.tw1, 0);
  const sumTw2 = items.reduce((s, i) => s + i.tw2, 0);
  const sumTw3 = items.reduce((s, i) => s + i.tw3, 0);
  const sumTw4 = items.reduce((s, i) => s + i.tw4, 0);

  anggaranRows.push(['', '', '', '', '', '', '', '', '']);
  anggaranRows.push([
    'JUMLAH BOS',
    '',
    grandTotal,
    grandTotal,
    '-',
    sumTw1,
    sumTw2,
    sumTw3,
    sumTw4,
  ]);

  const wsAnggaran = XLSX.utils.aoa_to_sheet(anggaranRows);
  wsAnggaran['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 22 },
    { wch: 16 },
    { wch: 36 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAnggaran, 'Anggaran BOS');

  const sortedTx = [...transactions].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  let saldo = 0;
  const bkuRows: (string | number)[][] = [
    [`BUKU KAS UMUM (BKU) — ${school.namaSekolah.toUpperCase()} (TA ${school.tahunAnggaran})`],
    [
      'No.',
      'Tanggal',
      'Triwulan',
      'No. Bukti',
      'Kode Rekening',
      'Uraian Transaksi',
      'Penerima',
      'Penerimaan (Rp)',
      'Pengeluaran (Rp)',
      'Saldo (Rp)',
    ],
  ];

  sortedTx.forEach((tx, idx) => {
    const masuk = tx.jenis === 'penerimaan' ? tx.nominal : 0;
    const keluar = tx.jenis === 'pengeluaran' ? tx.nominal : 0;
    saldo += masuk - keluar;
    bkuRows.push([
      idx + 1,
      tx.tanggal,
      `TW ${tx.triwulan}`,
      tx.noBukti,
      tx.kodeRekening,
      tx.uraian,
      tx.penerima,
      masuk,
      keluar,
      saldo,
    ]);
  });

  const wsBku = XLSX.utils.aoa_to_sheet(bkuRows);
  wsBku['!cols'] = [
    { wch: 5 },
    { wch: 13 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 44 },
    { wch: 30 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBku, 'Buku Kas Umum');

  const honorRows: (string | number)[][] = [
    [`DAFTAR PENERIMAAN HONORARIUM — ${school.namaSekolah.toUpperCase()}`],
    [
      'No.',
      'Triwulan',
      'Jenis Honorarium',
      'Nama Penerima',
      'Jabatan / Tugas',
      'Rincian Volume',
      'Satuan (Rp)',
      'Jumlah Bruto (Rp)',
      'PPh 21 (Rp)',
      'Jumlah Diterima Netto (Rp)',
    ],
  ];

  honorRecipients.forEach((hr, idx) => {
    const item = items.find((i) => i.id === hr.budgetItemId);
    honorRows.push([
      idx + 1,
      `TW ${hr.triwulan}`,
      item?.uraian || 'Honorarium',
      hr.nama,
      hr.jabatan,
      hr.rincianVolume,
      hr.satuanNominal,
      hr.jumlahBruto,
      hr.pphNominal,
      hr.jumlahNetto,
    ]);
  });

  const wsHonor = XLSX.utils.aoa_to_sheet(honorRows);
  wsHonor['!cols'] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 32 },
    { wch: 28 },
    { wch: 28 },
    { wch: 24 },
    { wch: 15 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsHonor, 'Daftar Penerimaan Honor');

  XLSX.writeFile(wb, `LPJ_BOS_${school.namaSekolah.replace(/\s+/g, '_')}_${school.tahunAnggaran}.xlsx`);
}
