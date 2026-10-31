import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BkuTransaction,
  BudgetItem,
  HonorRecipient,
  SchoolProfile,
  Triwulan,
  TriwulanFilter,
} from '../types/lpj';
import {
  formatRupiah,
  formatTanggalIndo,
  getTriwulanLabel,
  terbilangRupiah,
} from './formatters';

function getReportDateForFilter(school: SchoolProfile, tw: TriwulanFilter): string {
  if (tw === 1) return formatTanggalIndo(school.tanggalLaporanTw1);
  if (tw === 2) return formatTanggalIndo(school.tanggalLaporanTw2);
  if (tw === 3) return formatTanggalIndo(school.tanggalLaporanTw3);
  return formatTanggalIndo(school.tanggalLaporanTw4);
}

function drawKopSurat(doc: jsPDF, school: SchoolProfile, startY = 14): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(school.namaSekolah.toUpperCase(), centerX, startY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `NPSN: ${school.npsn}  |  Status: ${school.statusSekolah}  |  ${school.kota}, ${school.provinsi}`,
    centerX,
    startY + 5,
    { align: 'center' }
  );
  doc.text(
    `${school.alamat}  —  Sumber Dana: ${school.sumberDana} (TA ${school.tahunAnggaran})`,
    centerX,
    startY + 9.5,
    { align: 'center' }
  );

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(14, startY + 13, pageWidth - 14, startY + 13);
  doc.setLineWidth(0.2);
  doc.line(14, startY + 14.2, pageWidth - 14, startY + 14.2);

  return startY + 21;
}

function drawSignatureBlock(
  doc: jsPDF,
  school: SchoolProfile,
  startY: number,
  tanggalSign: string
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = startY;
  if (y + 38 > pageHeight - 12) {
    doc.addPage();
    y = 20;
  }

  const leftX = 32;
  const rightX = pageWidth - 78;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);

  doc.text('Mengetahui / Menyetujui,', leftX, y);
  doc.text('Kepala Sekolah / Madrasah', leftX, y + 4.5);

  doc.text(`${school.kota}, ${tanggalSign}`, rightX, y);
  doc.text('Bendahara Dana BOS', rightX, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.text(school.kepalaSekolah, leftX, y + 25);
  doc.text(school.bendaharaBos, rightX, y + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP/NUPTK. ${school.nipKepala || '-'}`, leftX, y + 29.5);
  doc.text(`NIP/NUPTK. ${school.nipBendahara || '-'}`, rightX, y + 29.5);
}

function appendRkasSection(doc: jsPDF, school: SchoolProfile, items: BudgetItem[]): void {
  const yAfterKop = drawKopSurat(doc, school, 13);
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `REKAPITULASI RENCANA PENGGUNAAN ANGGARAN DANA BOS TAHUN ${school.tahunAnggaran}`,
    pageWidth / 2,
    yAfterKop,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Nomor SK / NPHD: ${school.nomorSkNphd}`, pageWidth / 2, yAfterKop + 4.5, {
    align: 'center',
  });

  const groups: { no: string; name: string; rows: BudgetItem[] }[] = [];
  items.forEach((item) => {
    const existing = groups.find((g) => g.no === item.categoryNo && g.name === item.categoryName);
    if (existing) existing.rows.push(item);
    else groups.push({ no: item.categoryNo, name: item.categoryName, rows: [item] });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyRows: any[] = [];
  groups.forEach((group) => {
    const subTotal = group.rows.reduce((s, r) => s + r.jumlah, 0);
    bodyRows.push([
      { content: `${group.no}.`, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
      { content: group.name, styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
      {
        content: formatRupiah(subTotal, false),
        styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240] },
      },
      { content: '', styles: { fillColor: [226, 232, 240] } },
      { content: '', styles: { fillColor: [226, 232, 240] } },
      { content: '', styles: { fillColor: [226, 232, 240] } },
      { content: '', styles: { fillColor: [226, 232, 240] } },
      { content: '', styles: { fillColor: [226, 232, 240] } },
      { content: '', styles: { fillColor: [226, 232, 240] } },
    ]);

    group.rows.forEach((r) => {
      bodyRows.push([
        '',
        r.uraian,
        '',
        r.jumlah > 0 ? formatRupiah(r.jumlah, false) : '-',
        r.keterangan || '-',
        r.tw1 > 0 ? formatRupiah(r.tw1, false) : '-',
        r.tw2 > 0 ? formatRupiah(r.tw2, false) : '-',
        r.tw3 > 0 ? formatRupiah(r.tw3, false) : '-',
        r.tw4 > 0 ? formatRupiah(r.tw4, false) : '-',
      ]);
    });
  });

  const grandTotal = items.reduce((s, i) => s + i.jumlah, 0);
  const tw1Total = items.reduce((s, i) => s + i.tw1, 0);
  const tw2Total = items.reduce((s, i) => s + i.tw2, 0);
  const tw3Total = items.reduce((s, i) => s + i.tw3, 0);
  const tw4Total = items.reduce((s, i) => s + i.tw4, 0);

  bodyRows.push([
    {
      content: 'JUMLAH BOS',
      colSpan: 2,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
    },
    {
      content: formatRupiah(grandTotal, false),
      styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
    },
    {
      content: formatRupiah(grandTotal, false),
      styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
    },
    { content: '-', styles: { halign: 'center', fillColor: [241, 245, 249] } },
    {
      content: formatRupiah(tw1Total, false),
      styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
    },
    {
      content: formatRupiah(tw2Total, false),
      styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
    },
    {
      content: formatRupiah(tw3Total, false),
      styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
    },
    {
      content: formatRupiah(tw4Total, false),
      styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
    },
  ]);

  autoTable(doc, {
    startY: yAfterKop + 8,
    head: [
      [
        'No.',
        'Uraian Kegiatan',
        'Jumlah per Sub Kegiatan (Rp)',
        'Jumlah (Rp)',
        'Keterangan',
        'Tri Wulan 1',
        'Tri Wulan 2',
        'Tri Wulan 3',
        'Tri Wulan 4',
      ],
    ],
    body: bodyRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [148, 163, 184],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 48 },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' },
      8: { cellWidth: 25, halign: 'right' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  drawSignatureBlock(doc, school, finalY + 10, getReportDateForFilter(school, 'all'));
}

export function exportRkasPdf(school: SchoolProfile, items: BudgetItem[]): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  appendRkasSection(doc, school, items);
  doc.save(`RKAS_Anggaran_BOS_${school.tahunAnggaran}.pdf`);
}

function appendBkuSection(
  doc: jsPDF,
  school: SchoolProfile,
  transactions: BkuTransaction[],
  twFilter: TriwulanFilter
): void {
  const yAfterKop = drawKopSurat(doc, school, 13);
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BUKU KAS UMUM (BKU) DANA BOS', pageWidth / 2, yAfterKop, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Periode: ${getTriwulanLabel(twFilter)}  —  Tahun Anggaran ${school.tahunAnggaran}`,
    pageWidth / 2,
    yAfterKop + 4.5,
    { align: 'center' }
  );

  const sortedAll = [...transactions].sort((a, b) => {
    const cmp = a.tanggal.localeCompare(b.tanggal);
    if (cmp !== 0) return cmp;
    if (a.jenis === b.jenis) return 0;
    return a.jenis === 'penerimaan' ? -1 : 1;
  });

  let openingBalance = 0;
  if (twFilter !== 'all') {
    sortedAll.forEach((tx) => {
      if (tx.triwulan < twFilter) {
        openingBalance += tx.jenis === 'penerimaan' ? tx.nominal : -tx.nominal;
      }
    });
  }

  const filteredTx =
    twFilter === 'all' ? sortedAll : sortedAll.filter((tx) => tx.triwulan === twFilter);

  let runningBalance = openingBalance;
  let totalIn = 0;
  let totalOut = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyRows: any[] = [];
  if (twFilter !== 'all') {
    bodyRows.push([
      '-',
      '-',
      '-',
      '-',
      { content: `Saldo Awal Triwulan ${twFilter}`, styles: { fontStyle: 'bold' } },
      formatRupiah(openingBalance, false),
      '-',
      { content: formatRupiah(openingBalance, false), styles: { fontStyle: 'bold' } },
    ]);
  }

  filteredTx.forEach((tx, idx) => {
    const masuk = tx.jenis === 'penerimaan' ? tx.nominal : 0;
    const keluar = tx.jenis === 'pengeluaran' ? tx.nominal : 0;
    totalIn += masuk;
    totalOut += keluar;
    runningBalance += masuk - keluar;

    bodyRows.push([
      idx + 1,
      tx.tanggal,
      tx.kodeRekening,
      tx.noBukti,
      tx.uraian,
      masuk > 0 ? formatRupiah(masuk, false) : '-',
      keluar > 0 ? formatRupiah(keluar, false) : '-',
      formatRupiah(runningBalance, false),
    ]);
  });

  bodyRows.push([
    {
      content: 'JUMLAH PENERIMAAN / PENGELUARAN / SALDO AKHIR',
      colSpan: 5,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
    },
    {
      content: formatRupiah(totalIn + openingBalance, false),
      styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
    },
    {
      content: formatRupiah(totalOut, false),
      styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
    },
    {
      content: formatRupiah(runningBalance, false),
      styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
    },
  ]);

  autoTable(doc, {
    startY: yAfterKop + 8,
    head: [
      [
        'No.',
        'Tanggal',
        'Kode Rekening',
        'No. Bukti',
        'Uraian Transaksi',
        'Penerimaan (Rp)',
        'Pengeluaran (Rp)',
        'Saldo (Rp)',
      ],
    ],
    body: bodyRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [148, 163, 184],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 96 },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 28, halign: 'right' },
      7: { cellWidth: 28, halign: 'right' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 130;
  const closeTextY = finalY + 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Pada hari ini Buku Kas Umum ditutup dengan keadaan saldo sebesar ${formatRupiah(runningBalance)} (${terbilangRupiah(runningBalance)}).`,
    14,
    closeTextY
  );

  drawSignatureBlock(doc, school, closeTextY + 8, getReportDateForFilter(school, twFilter));
}

export function exportBkuPdf(
  school: SchoolProfile,
  transactions: BkuTransaction[],
  twFilter: TriwulanFilter
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  appendBkuSection(doc, school, transactions, twFilter);
  const suffix = twFilter === 'all' ? 'TW1-4' : `TW${twFilter}`;
  doc.save(`BKU_Dana_BOS_${suffix}_${school.tahunAnggaran}.pdf`);
}

function drawSingleKwitansi(
  doc: jsPDF,
  school: SchoolProfile,
  tx: BkuTransaction,
  topY: number
): void {
  const x = 14;
  const w = 182;
  const h = 128;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.rect(x, topY, w, h);
  doc.setLineWidth(0.15);
  doc.rect(x + 1.2, topY + 1.2, w - 2.4, h - 2.4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(school.namaSekolah.toUpperCase(), x + 6, topY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${school.sumberDana} — Tahun Anggaran ${school.tahunAnggaran}`, x + 6, topY + 12.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`No. Bukti     : ${tx.noBukti}`, x + 122, topY + 7.5);
  doc.text(`Kode Rek.   : ${tx.kodeRekening}`, x + 122, topY + 11.8);
  doc.text(`Triwulan      : TW ${tx.triwulan}`, x + 122, topY + 16.1);

  doc.setLineWidth(0.3);
  doc.line(x + 4, topY + 19, x + w - 4, topY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('K W I T A N S I   P E M B A Y A R A N', x + w / 2, topY + 26, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(x + 62, topY + 27.5, x + 120, topY + 27.5);

  const labelX = x + 6;
  const colonX = x + 44;
  const valX = x + 47;
  doc.setFontSize(8.8);

  doc.setFont('helvetica', 'normal');
  doc.text('Sudah Terima Dari', labelX, topY + 36);
  doc.text(':', colonX, topY + 36);
  doc.setFont('helvetica', 'bold');
  doc.text(`Bendahara BOS ${school.namaSekolah}`, valX, topY + 36);

  doc.setFont('helvetica', 'normal');
  doc.text('Uang Sejumlah', labelX, topY + 45);
  doc.text(':', colonX, topY + 45);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.rect(valX, topY + 40.5, 128, 10, 'FD');
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(8.5);
  const terbilangLines = doc.splitTextToSize(`# ${terbilangRupiah(tx.nominal)} #`, 124);
  doc.text(terbilangLines, valX + 2.5, topY + 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.text('Untuk Pembayaran', labelX, topY + 57);
  doc.text(':', colonX, topY + 57);
  const pembayaranText = tx.rincianKwitansi || tx.uraian;
  const payLines = doc.splitTextToSize(pembayaranText, 127);
  doc.text(payLines, valX, topY + 57);

  doc.setFillColor(226, 232, 240);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(labelX, topY + 72, 64, 11, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Jumlah: ${formatRupiah(tx.nominal)}`, labelX + 4, topY + 79);

  if (tx.pph21 > 0 || tx.ppn > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      `Potongan Pajak — PPh 21: ${formatRupiah(tx.pph21)} | PPN: ${formatRupiah(tx.ppn)}`,
      labelX + 70,
      topY + 78.5
    );
  }

  const sigTop = topY + 89;
  const col1 = x + 8;
  const col2 = x + 68;
  const col3 = x + 128;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Setuju Dibayar,', col1, sigTop);
  doc.text('Kepala Sekolah / Madrasah', col1, sigTop + 4);

  doc.text(`Lunas Dibayar, ${formatTanggalIndo(tx.tanggal)}`, col2, sigTop);
  doc.text('Bendahara Dana BOS', col2, sigTop + 4);

  doc.text(`${school.kota}, ${formatTanggalIndo(tx.tanggal)}`, col3, sigTop);
  doc.text('Yang Menerima,', col3, sigTop + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.text(school.kepalaSekolah, col1, sigTop + 23);
  doc.text(school.bendaharaBos, col2, sigTop + 23);
  const shortPenerima =
    tx.penerima.length > 28 ? `${tx.penerima.slice(0, 26)}...` : tx.penerima;
  doc.text(shortPenerima, col3, sigTop + 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.text(`NIP. ${school.nipKepala || '-'}`, col1, sigTop + 27);
  doc.text(`NIP. ${school.nipBendahara || '-'}`, col2, sigTop + 27);
  doc.text(tx.jabatanPenerima || 'Penerima', col3, sigTop + 27);
}

export function exportKwitansiPdf(
  school: SchoolProfile,
  transactions: BkuTransaction[],
  filenameLabel = 'Semua'
): void {
  const expenses = transactions
    .filter((t) => t.jenis === 'pengeluaran')
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  if (expenses.length === 0) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  expenses.forEach((tx, idx) => {
    if (idx > 0 && idx % 2 === 0) {
      doc.addPage('a4', 'portrait');
    }
    const topY = idx % 2 === 0 ? 14 : 154;
    drawSingleKwitansi(doc, school, tx, topY);

    if (idx % 2 === 0 && idx + 1 < expenses.length) {
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(10, 148, 200, 148);
      doc.setLineDashPattern([], 0);
    }
  });

  doc.save(`Kwitansi_BOS_${filenameLabel}_${school.tahunAnggaran}.pdf`);
}

function appendHonorTablesSection(
  doc: jsPDF,
  school: SchoolProfile,
  budgetItems: BudgetItem[],
  honorRecipients: HonorRecipient[],
  filterBudgetId: string | 'all',
  twFilter: TriwulanFilter
): void {
  const filtered = honorRecipients.filter((hr) => {
    const matchItem = filterBudgetId === 'all' || hr.budgetItemId === filterBudgetId;
    const matchTw = twFilter === 'all' || hr.triwulan === twFilter;
    return matchItem && matchTw;
  });

  const groups = new Map<string, { item: BudgetItem | undefined; tw: Triwulan; rows: HonorRecipient[] }>();
  filtered.forEach((hr) => {
    const key = `${hr.budgetItemId}__${hr.triwulan}`;
    const existing = groups.get(key);
    if (existing) {
      existing.rows.push(hr);
    } else {
      groups.set(key, {
        item: budgetItems.find((b) => b.id === hr.budgetItemId),
        tw: hr.triwulan,
        rows: [hr],
      });
    }
  });

  const groupList = Array.from(groups.values()).sort((a, b) => a.tw - b.tw);
  groupList.forEach((grp, gIdx) => {
    if (gIdx > 0) {
      doc.addPage('a4', 'landscape');
    }
    const yAfterKop = drawKopSurat(doc, school, 13);
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleHonor = grp.item?.uraian || 'Honorarium Kegiatan BOS';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(
      `DAFTAR PENERIMAAN HONORARIUM — ${titleHonor.toUpperCase()}`,
      pageWidth / 2,
      yAfterKop,
      { align: 'center' }
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.text(
      `${getTriwulanLabel(grp.tw)}  |  Tahun Anggaran ${school.tahunAnggaran}  |  Kode Rekening: ${grp.item?.kodeRekening || '-'}`,
      pageWidth / 2,
      yAfterKop + 4.5,
      { align: 'center' }
    );

    const totalBruto = grp.rows.reduce((s, r) => s + r.jumlahBruto, 0);
    const totalPph = grp.rows.reduce((s, r) => s + r.pphNominal, 0);
    const totalNetto = grp.rows.reduce((s, r) => s + r.jumlahNetto, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyRows: any[] = grp.rows.map((r, idx) => {
      const noUrut = idx + 1;
      const ttdZigZag =
        noUrut % 2 === 1 ? `${noUrut}. .....................` : `            ${noUrut}. .....................`;
      return [
        noUrut,
        r.nama,
        r.jabatan,
        r.golongan || '-',
        r.rincianVolume,
        formatRupiah(r.satuanNominal, false),
        formatRupiah(r.jumlahBruto, false),
        r.pphNominal > 0 ? formatRupiah(r.pphNominal, false) : '-',
        formatRupiah(r.jumlahNetto, false),
        ttdZigZag,
      ];
    });

    bodyRows.push([
      {
        content: 'JUMLAH TOTAL PENERIMAAN HONORARIUM',
        colSpan: 6,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
      },
      {
        content: formatRupiah(totalBruto, false),
        styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
      },
      {
        content: totalPph > 0 ? formatRupiah(totalPph, false) : '-',
        styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
      },
      {
        content: formatRupiah(totalNetto, false),
        styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
      },
      { content: '', styles: { fillColor: [241, 245, 249] } },
    ]);

    autoTable(doc, {
      startY: yAfterKop + 8,
      head: [
        [
          'No.',
          'Nama Penerima',
          'Jabatan / Tugas',
          'Gol.',
          'Volume',
          'Satuan (Rp)',
          'Jumlah Bruto (Rp)',
          'PPh 21 (Rp)',
          'Diterima Netto (Rp)',
          'Tanda Tangan',
        ],
      ],
      body: bodyRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.4,
        textColor: [15, 23, 42],
        lineColor: [148, 163, 184],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        1: { cellWidth: 42 },
        2: { cellWidth: 38 },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 34 },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 20, halign: 'right' },
        8: { cellWidth: 26, halign: 'right' },
        9: { cellWidth: 37 },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY || 130;
    drawSignatureBlock(doc, school, finalY + 9, getReportDateForFilter(school, grp.tw));
  });
}

export function exportHonorPdf(
  school: SchoolProfile,
  budgetItems: BudgetItem[],
  honorRecipients: HonorRecipient[],
  filterBudgetId: string | 'all',
  twFilter: TriwulanFilter
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  appendHonorTablesSection(doc, school, budgetItems, honorRecipients, filterBudgetId, twFilter);
  const suffix = twFilter === 'all' ? 'TW1-4' : `TW${twFilter}`;
  doc.save(`Daftar_Penerimaan_Honor_${suffix}_${school.tahunAnggaran}.pdf`);
}

export function exportCompleteLpjBundlePdf(
  school: SchoolProfile,
  budgetItems: BudgetItem[],
  transactions: BkuTransaction[],
  honorRecipients: HonorRecipient[],
  twFilter: TriwulanFilter
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(1.2);
  doc.rect(12, 12, pageWidth - 24, 273);
  doc.setLineWidth(0.3);
  doc.rect(14, 14, pageWidth - 28, 269);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN PERTANGGUNGJAWABAN (LPJ)', pageWidth / 2, 42, { align: 'center' });
  doc.setFontSize(13);
  doc.text(school.sumberDana.toUpperCase(), pageWidth / 2, 50, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(
    `${getTriwulanLabel(twFilter).toUpperCase()} — TAHUN ANGGARAN ${school.tahunAnggaran}`,
    pageWidth / 2,
    58,
    { align: 'center' }
  );

  doc.setDrawColor(148, 163, 184);
  doc.line(36, 66, pageWidth - 36, 66);

  const totalPagu = budgetItems.reduce((s, i) => s + i.jumlah, 0);
  const filteredOut = transactions
    .filter((t) => t.jenis === 'pengeluaran' && (twFilter === 'all' || t.triwulan === twFilter))
    .reduce((s, t) => s + t.nominal, 0);
  const filteredIn = transactions
    .filter((t) => t.jenis === 'penerimaan' && (twFilter === 'all' || t.triwulan === twFilter))
    .reduce((s, t) => s + t.nominal, 0);

  autoTable(doc, {
    startY: 76,
    margin: { left: 26, right: 26 },
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2.5, textColor: [15, 23, 42] },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: 'bold' },
      1: { cellWidth: 5 },
      2: { cellWidth: 100 },
    },
    body: [
      ['Nama Satuan Pendidikan', ':', school.namaSekolah],
      ['NPSN', ':', school.npsn],
      ['Alamat', ':', `${school.alamat}, ${school.kota}`],
      ['Nomor SK / NPHD', ':', school.nomorSkNphd],
      ['Kepala Sekolah / Madrasah', ':', school.kepalaSekolah],
      ['Bendahara Dana BOS', ':', school.bendaharaBos],
      ['Total Pagu Tahunan BOS', ':', formatRupiah(totalPagu)],
      ['Dana Diterima Periode Ini', ':', formatRupiah(filteredIn)],
      ['Realisasi Belanja Periode Ini', ':', formatRupiah(filteredOut)],
      ['Sisa Saldo Periode Ini', ':', formatRupiah(filteredIn - filteredOut)],
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sptjmY = ((doc as any).lastAutoTable?.finalY || 165) + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)', pageWidth / 2, sptjmY, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  const sptjmParagraph = doc.splitTextToSize(
    `Saya yang bertanda tangan di bawah ini menyatakan bahwa seluruh penggunaan ${school.sumberDana} pada ${school.namaSekolah} periode ${getTriwulanLabel(twFilter)} sejumlah ${formatRupiah(filteredOut)} (${terbilangRupiah(filteredOut)}) telah dicatat dalam Buku Kas Umum, didukung bukti Kwitansi serta Daftar Penerimaan Honorarium yang sah dan lengkap sesuai ketentuan peraturan perundang-undangan.`,
    pageWidth - 52
  );
  doc.text(sptjmParagraph, 26, sptjmY + 8);

  drawSignatureBlock(doc, school, sptjmY + 34, getReportDateForFilter(school, twFilter));

  doc.addPage('a4', 'landscape');
  appendRkasSection(doc, school, budgetItems);

  doc.addPage('a4', 'landscape');
  appendBkuSection(doc, school, transactions, twFilter);

  const relevantHonor = honorRecipients.filter(
    (h) => twFilter === 'all' || h.triwulan === twFilter
  );
  if (relevantHonor.length > 0) {
    doc.addPage('a4', 'landscape');
    appendHonorTablesSection(doc, school, budgetItems, honorRecipients, 'all', twFilter);
  }

  const relevantExpenses = transactions
    .filter((t) => t.jenis === 'pengeluaran' && (twFilter === 'all' || t.triwulan === twFilter))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  relevantExpenses.forEach((tx, idx) => {
    if (idx % 2 === 0) {
      doc.addPage('a4', 'portrait');
    }
    const topY = idx % 2 === 0 ? 14 : 154;
    drawSingleKwitansi(doc, school, tx, topY);
    if (idx % 2 === 0 && idx + 1 < relevantExpenses.length) {
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(10, 148, 200, 148);
      doc.setLineDashPattern([], 0);
    }
  });

  const suffix = twFilter === 'all' ? 'Lengkap_TW1-4' : `TW${twFilter}`;
  doc.save(`Bundel_LPJ_BOS_${suffix}_${school.tahunAnggaran}.pdf`);
}
