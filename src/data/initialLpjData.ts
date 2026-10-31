import { BkuTransaction, BudgetItem, HonorRecipient, SchoolProfile, Triwulan } from '../types/lpj';

export const INITIAL_SCHOOL_PROFILE: SchoolProfile = {
  namaSekolah: 'MTs Cendekia Kota Bogor',
  npsn: '20278419',
  statusSekolah: 'Swasta Terakreditasi A',
  alamat: 'Jl. Pajajaran Indah No. 18, Kecamatan Bogor Timur',
  kota: 'Kota Bogor',
  provinsi: 'Jawa Barat',
  tahunAnggaran: '2026',
  sumberDana: 'Hibah BOS Kota / Dana BOS Reguler',
  nomorSkNphd: '421.3/NPHD-BOS/DISDIK/2026',
  kepalaSekolah: 'Drs. H. Ahmad Fauzi, M.Pd.',
  nipKepala: '19710412 199803 1 004',
  bendaharaBos: 'Siti Nurhaliza, S.E.',
  nipBendahara: '19860821 201411 2 002',
  tanggalLaporanTw1: '2026-03-31',
  tanggalLaporanTw2: '2026-06-30',
  tanggalLaporanTw3: '2026-09-30',
  tanggalLaporanTw4: '2026-12-29',
};

/**
 * Exact 17 budget items transcribed from the uploaded Excel screenshot (/public/assets/aistudio/image_719496df.png):
 * 1. Honor = Rp 60.852.000
 * 2. Kegiatan = Rp 12.850.000
 * 3. Operasional Sekolah = Rp 3.600.000
 * 4. pemenuhan sarana prasarana = Rp 35.948.000
 * JUMLAH BOS = Rp 113.250.000
 * TW1 = 25.883.600 | TW2 = 29.274.200 | TW3 = 36.083.600 | TW4 = 22.008.600
 */
export const INITIAL_BUDGET_ITEMS: BudgetItem[] = [
  // 1. Honor (60.852.000)
  {
    id: 'item-honor-guru',
    categoryNo: '1',
    categoryName: 'Honor',
    kodeRekening: '5.1.02.02.01.0013',
    uraian: 'Honor Guru',
    jumlah: 16_200_000,
    keterangan: 'Rp.150.000 x9 guru',
    tw1: 4_050_000,
    tw2: 4_050_000,
    tw3: 4_050_000,
    tw4: 4_050_000,
  },
  {
    id: 'item-honor-pengelola',
    categoryNo: '1',
    categoryName: 'Honor',
    kodeRekening: '5.1.02.02.01.0004',
    uraian: 'Honor Pengelola Hibah Bos Kota',
    jumlah: 6_600_000,
    keterangan: 'Tim Pengelola Hibah BOS (3 personil x 12 bulan)',
    tw1: 1_650_000,
    tw2: 1_650_000,
    tw3: 1_650_000,
    tw4: 1_650_000,
  },
  {
    id: 'item-transport-pramuka',
    categoryNo: '1',
    categoryName: 'Honor',
    kodeRekening: '5.1.02.02.01.0029',
    uraian: 'Transport Ekstrakulikuler Pramuka',
    jumlah: 2_400_000,
    keterangan: 'Rp.185.000 x12 Bulan',
    tw1: 600_000,
    tw2: 600_000,
    tw3: 600_000,
    tw4: 600_000,
  },
  {
    id: 'item-transport-futsal',
    categoryNo: '1',
    categoryName: 'Honor',
    kodeRekening: '5.1.02.02.01.0029',
    uraian: 'Transport Ekstrakulikuler futsal',
    jumlah: 2_400_000,
    keterangan: 'Rp.185.000 x12 Bulan',
    tw1: 600_000,
    tw2: 600_000,
    tw3: 600_000,
    tw4: 600_000,
  },
  {
    id: 'item-koreksi-pas',
    categoryNo: '1',
    categoryName: 'Honor',
    kodeRekening: '5.1.02.02.01.0014',
    uraian: 'Honor Koreksi LJK PAS Smt 1, 2',
    jumlah: 14_076_000,
    keterangan: 'Rp.1.000 x 414 Siswa X 17 Mapel x 2 semster',
    tw1: 0,
    tw2: 7_038_000,
    tw3: 0,
    tw4: 7_038_000,
  },
  {
    id: 'item-koreksi-pts',
    categoryNo: '1',
    categoryName: 'Honor',
    kodeRekening: '5.1.02.02.01.0014',
    uraian: 'Honor Koreksi LJK PTS SMT 1,2',
    jumlah: 14_076_000,
    keterangan: 'Rp.1.000 x 414 Siswa X 17 Mapel x 2 semster',
    tw1: 7_038_000,
    tw2: 0,
    tw3: 7_038_000,
    tw4: 0,
  },
  {
    id: 'item-soal-pas',
    categoryNo: '1',
    categoryName: 'Honor',
    kodeRekening: '5.1.02.02.01.0015',
    uraian: 'Honor pembuatan soal PAS SMT 1,2',
    jumlah: 5_100_000,
    keterangan: 'Rp.50.000 x 17 Mapel X 3 Angkatan',
    tw1: 0,
    tw2: 2_550_000,
    tw3: 0,
    tw4: 2_550_000,
  },

  // 2. Kegiatan (12.850.000)
  {
    id: 'item-kegiatan-sanlat',
    categoryNo: '2',
    categoryName: 'Kegiatan',
    kodeRekening: '5.1.02.02.04.0036',
    uraian: 'kegiatan sanlat dan buka bersama',
    jumlah: 6_425_000,
    keterangan: 'sewa tenda + Sound sistem',
    tw1: 6_425_000,
    tw2: 0,
    tw3: 0,
    tw4: 0,
  },
  {
    id: 'item-kegiatan-maulid',
    categoryNo: '2',
    categoryName: 'Kegiatan',
    kodeRekening: '5.1.02.02.04.0036',
    uraian: 'kegiatan Maulid Nabi',
    jumlah: 6_425_000,
    keterangan: 'sewa tenda + Sound sistem',
    tw1: 0,
    tw2: 0,
    tw3: 6_425_000,
    tw4: 0,
  },

  // 3. Operasional Sekolah (3.600.000)
  {
    id: 'item-internet',
    categoryNo: '3',
    categoryName: 'Operasional Sekolah',
    kodeRekening: '5.1.02.02.01.0063',
    uraian: 'Langganan Internet',
    jumlah: 3_600_000,
    keterangan: 'Tagihan internet sekolah Rp 300.000 x 12 bulan',
    tw1: 900_000,
    tw2: 900_000,
    tw3: 900_000,
    tw4: 900_000,
  },

  // 4. pemenuhan sarana prasarana (35.948.000)
  {
    id: 'item-fc-pas',
    categoryNo: '4',
    categoryName: 'pemenuhan sarana prasarana',
    kodeRekening: '5.1.02.01.01.0026',
    uraian: 'foto copy soal PAS',
    jumlah: 9_241_200,
    keterangan: '17 mapel x 2 lembar x 453 siswa',
    tw1: 0,
    tw2: 4_620_600,
    tw3: 0,
    tw4: 4_620_600,
  },
  {
    id: 'item-fc-pts',
    categoryNo: '4',
    categoryName: 'pemenuhan sarana prasarana',
    kodeRekening: '5.1.02.01.01.0026',
    uraian: 'Fotocopy Soal PTS',
    jumlah: 9_241_200,
    keterangan: '17 mapel x 2 lembar x 453 siswa',
    tw1: 4_620_600,
    tw2: 0,
    tw3: 4_620_600,
    tw4: 0,
  },
  {
    id: 'item-printer',
    categoryNo: '4',
    categoryName: 'pemenuhan sarana prasarana',
    kodeRekening: '5.2.02.10.01.0002',
    uraian: 'Pembelian Printer',
    jumlah: 0,
    keterangan: '',
    tw1: 0,
    tw2: 0,
    tw3: 0,
    tw4: 0,
  },
  {
    id: 'item-laptop',
    categoryNo: '4',
    categoryName: 'pemenuhan sarana prasarana',
    kodeRekening: '5.2.02.10.01.0002',
    uraian: 'Pembelian Laptop',
    jumlah: 7_265_600,
    keterangan: 'Pengadaan 1 unit Laptop Operasional ANBK/Kurikulum',
    tw1: 0,
    tw2: 7_265_600,
    tw3: 0,
    tw4: 0,
  },
  {
    id: 'item-proyektor',
    categoryNo: '4',
    categoryName: 'pemenuhan sarana prasarana',
    kodeRekening: '5.2.02.10.02.0005',
    uraian: 'Pembelian Proyektor',
    jumlah: 0,
    keterangan: '',
    tw1: 0,
    tw2: 0,
    tw3: 0,
    tw4: 0,
  },
  {
    id: 'item-meja-kantor',
    categoryNo: '4',
    categoryName: 'pemenuhan sarana prasarana',
    kodeRekening: '5.2.02.05.02.0001',
    uraian: 'Pembelian Meja Kantor',
    jumlah: 10_200_000,
    keterangan: 'Pengadaan meja kerja ruang guru & tata usaha',
    tw1: 0,
    tw2: 0,
    tw3: 10_200_000,
    tw4: 0,
  },
];

const GURU_HONOR_NAMES = [
  { nama: 'Dra. Hj. Siti Aminah', jabatan: 'Guru Matematika', golongan: 'Non-ASN' },
  { nama: 'Muhammad Ridwan, S.Pd.', jabatan: 'Guru Bahasa Indonesia', golongan: 'Non-ASN' },
  { nama: 'Nurul Hidayah, S.Pd.I.', jabatan: 'Guru PAI / Fiqih', golongan: 'Non-ASN' },
  { nama: 'Dedi Kurniawan, S.Pd.', jabatan: 'Guru Bahasa Inggris', golongan: 'Non-ASN' },
  { nama: 'Rina Marlina, S.Si.', jabatan: 'Guru IPA Terpadu', golongan: 'Non-ASN' },
  { nama: 'Agus Salim, S.Pd.', jabatan: 'Guru IPS Terpadu', golongan: 'Non-ASN' },
  { nama: 'Fitriani Zahra, S.Pd.', jabatan: 'Guru PKn', golongan: 'Non-ASN' },
  { nama: 'Hendra Gunawan, S.Kom.', jabatan: 'Guru Informatika', golongan: 'Non-ASN' },
  { nama: 'Lukman Hakim, S.Ag.', jabatan: 'Guru Bahasa Arab', golongan: 'Non-ASN' },
];

const PENGELOLA_BOS_TEAM = [
  { nama: 'Drs. H. Ahmad Fauzi, M.Pd.', jabatan: 'Penanggung Jawab Hibah BOS', satuan: 225_000 },
  { nama: 'Siti Nurhaliza, S.E.', jabatan: 'Bendahara Hibah BOS Kota', satuan: 200_000 },
  { nama: 'Rizky Pratama, A.Md.', jabatan: 'Operator Data & Pelaporan BOS', satuan: 125_000 },
];

function isHonorCategory(item: BudgetItem): boolean {
  const cat = item.categoryName.toLowerCase();
  const ur = item.uraian.toLowerCase();
  return (
    cat.includes('honor') ||
    ur.includes('honor') ||
    ur.includes('transport ekstrakulikuler') ||
    ur.includes('transport ekstrakurikuler')
  );
}

function defaultRecipientForItem(item: BudgetItem): { penerima: string; jabatan: string } {
  const ur = item.uraian.toLowerCase();
  if (ur.includes('honor guru')) {
    return { penerima: 'Guru Honorer (9 Orang Terlampir)', jabatan: 'Koordinator Pendidik' };
  }
  if (ur.includes('pengelola')) {
    return { penerima: 'Tim Pengelola Hibah BOS Kota (Terlampir)', jabatan: 'Bendahara Pengelola' };
  }
  if (ur.includes('pramuka')) {
    return { penerima: 'Andi Saputra, S.Pd.', jabatan: 'Pembina Ekstrakurikuler Pramuka' };
  }
  if (ur.includes('futsal')) {
    return { penerima: 'Bayu Pamungkas, S.Or.', jabatan: 'Pelatih Ekstrakurikuler Futsal' };
  }
  if (ur.includes('koreksi')) {
    return { penerima: 'Panitia & Korektor Ujian (17 Mapel Terlampir)', jabatan: 'Ketua Panitia Evaluasi' };
  }
  if (ur.includes('pembuatan soal')) {
    return { penerima: 'Tim Penyusun Naskah Soal (17 Mapel Terlampir)', jabatan: 'Koordinator Kurikulum' };
  }
  if (ur.includes('sanlat') || ur.includes('maulid')) {
    return { penerima: 'CV Berkah Mandiri Event & Sound', jabatan: 'Penyedia Jasa Sewa Tenda & Sound' };
  }
  if (ur.includes('internet')) {
    return { penerima: 'PT Telkom Indonesia (IndiBiz Sekolah)', jabatan: 'Penyedia Layanan Internet' };
  }
  if (ur.includes('foto copy') || ur.includes('fotocopy')) {
    return { penerima: 'Percetakan & Fotocopy Mitra Utama Bogor', jabatan: 'Rekanan Penggandaan Naskah' };
  }
  if (ur.includes('laptop') || ur.includes('printer') || ur.includes('proyektor')) {
    return { penerima: 'PT Bhinneka Mentari Dimensi (SIPLah)', jabatan: 'Penyedia Perangkat TIK Sekolah' };
  }
  if (ur.includes('meja')) {
    return { penerima: 'UD Karya Jati Mebelindo Bogor', jabatan: 'Penyedia Sarana Meubelair' };
  }
  return { penerima: 'Rekanan / Penerima Manfaat BOS', jabatan: 'Pelaksana Kegiatan' };
}

export function generateBkuAndHonorFromBudget(
  items: BudgetItem[],
  tahunAnggaran = '2026'
): { transactions: BkuTransaction[]; honorRecipients: HonorRecipient[] } {
  const transactions: BkuTransaction[] = [];
  const honorRecipients: HonorRecipient[] = [];

  const twConfig: Record<
    Triwulan,
    {
      receiptDate: string;
      spendMonth: string;
      key: 'tw1' | 'tw2' | 'tw3' | 'tw4';
      bulanLabel: string;
    }
  > = {
    1: {
      receiptDate: `${tahunAnggaran}-01-15`,
      spendMonth: `${tahunAnggaran}-03`,
      key: 'tw1',
      bulanLabel: 'Januari–Maret',
    },
    2: {
      receiptDate: `${tahunAnggaran}-04-14`,
      spendMonth: `${tahunAnggaran}-06`,
      key: 'tw2',
      bulanLabel: 'April–Juni',
    },
    3: {
      receiptDate: `${tahunAnggaran}-07-15`,
      spendMonth: `${tahunAnggaran}-09`,
      key: 'tw3',
      bulanLabel: 'Juli–September',
    },
    4: {
      receiptDate: `${tahunAnggaran}-10-15`,
      spendMonth: `${tahunAnggaran}-12`,
      key: 'tw4',
      bulanLabel: 'Oktober–Desember',
    },
  };

  ([1, 2, 3, 4] as Triwulan[]).forEach((tw) => {
    const cfg = twConfig[tw];
    const totalTwPenerimaan = items.reduce((acc, item) => acc + (item[cfg.key] || 0), 0);

    if (totalTwPenerimaan > 0) {
      transactions.push({
        id: `bku-in-tw${tw}`,
        tanggal: cfg.receiptDate,
        triwulan: tw,
        noBukti: `BNK-TW${tw}-001`,
        kodeRekening: '4.1.04.16.01.0001',
        uraian: `Penerimaan Pencairan Dana BOS / Hibah BOS Kota Triwulan ${tw} (${cfg.bulanLabel} ${tahunAnggaran})`,
        jenis: 'penerimaan',
        nominal: totalTwPenerimaan,
        penerima: 'Rekening Giro BOS Satuan Pendidikan',
        jabatanPenerima: 'Bendahara BOS',
        rincianKwitansi: `Pencairan Tahap/Triwulan ${tw} Tahun Anggaran ${tahunAnggaran}`,
        pph21: 0,
        ppn: 0,
      });
    }

    let voucherSeq = 1;
    items.forEach((item) => {
      const amount = item[cfg.key] || 0;
      if (amount <= 0) return;

      const dayNum = Math.min(28, 5 + voucherSeq * 2);
      const dayStr = String(dayNum).padStart(2, '0');
      const voucherCode = `BKU-TW${tw}-${String(voucherSeq).padStart(3, '0')}`;
      const rec = defaultRecipientForItem(item);

      transactions.push({
        id: `bku-out-${item.id}-tw${tw}`,
        tanggal: `${cfg.spendMonth}-${dayStr}`,
        triwulan: tw,
        noBukti: voucherCode,
        kodeRekening: item.kodeRekening || '5.1.02.02.01.0000',
        uraian: `Pembayaran ${item.uraian} — Triwulan ${tw}`,
        jenis: 'pengeluaran',
        nominal: amount,
        budgetItemId: item.id,
        penerima: rec.penerima,
        jabatanPenerima: rec.jabatan,
        rincianKwitansi: item.keterangan
          ? `${item.uraian} (${item.keterangan}) periode ${cfg.bulanLabel} ${tahunAnggaran}`
          : `${item.uraian} periode ${cfg.bulanLabel} ${tahunAnggaran}`,
        pph21: 0,
        ppn: 0,
      });

      voucherSeq += 1;

      // Populate structured Honor Recipient Rows if item belongs to Honorarium
      if (isHonorCategory(item)) {
        const ur = item.uraian.toLowerCase();
        if (ur.includes('honor guru') && amount === 4_050_000) {
          GURU_HONOR_NAMES.forEach((guru, idx) => {
            honorRecipients.push({
              id: `hon-${item.id}-tw${tw}-${idx + 1}`,
              budgetItemId: item.id,
              triwulan: tw,
              nama: guru.nama,
              jabatan: guru.jabatan,
              golongan: guru.golongan,
              rincianVolume: `3 Bulan (${cfg.bulanLabel})`,
              satuanNominal: 150_000,
              jumlahVolume: 3,
              jumlahBruto: 450_000,
              tarifPphPercent: 0,
              pphNominal: 0,
              jumlahNetto: 450_000,
            });
          });
        } else if (ur.includes('pengelola') && amount === 1_650_000) {
          PENGELOLA_BOS_TEAM.forEach((p, idx) => {
            const bruto = p.satuan * 3;
            honorRecipients.push({
              id: `hon-${item.id}-tw${tw}-${idx + 1}`,
              budgetItemId: item.id,
              triwulan: tw,
              nama: p.nama,
              jabatan: p.jabatan,
              golongan: 'Tim BOS',
              rincianVolume: `3 Bulan (${cfg.bulanLabel})`,
              satuanNominal: p.satuan,
              jumlahVolume: 3,
              jumlahBruto: bruto,
              tarifPphPercent: 0,
              pphNominal: 0,
              jumlahNetto: bruto,
            });
          });
        } else if (ur.includes('pramuka')) {
          const perBulan = Math.round(amount / 3);
          honorRecipients.push({
            id: `hon-${item.id}-tw${tw}-1`,
            budgetItemId: item.id,
            triwulan: tw,
            nama: 'Andi Saputra, S.Pd.',
            jabatan: 'Pembina Ekstrakurikuler Pramuka',
            golongan: 'Non-ASN',
            rincianVolume: `3 Bulan (${cfg.bulanLabel})`,
            satuanNominal: perBulan,
            jumlahVolume: 3,
            jumlahBruto: amount,
            tarifPphPercent: 0,
            pphNominal: 0,
            jumlahNetto: amount,
          });
        } else if (ur.includes('futsal')) {
          const perBulan = Math.round(amount / 3);
          honorRecipients.push({
            id: `hon-${item.id}-tw${tw}-1`,
            budgetItemId: item.id,
            triwulan: tw,
            nama: 'Bayu Pamungkas, S.Or.',
            jabatan: 'Pelatih Ekstrakurikuler Futsal',
            golongan: 'Non-ASN',
            rincianVolume: `3 Bulan (${cfg.bulanLabel})`,
            satuanNominal: perBulan,
            jumlahVolume: 3,
            jumlahBruto: amount,
            tarifPphPercent: 0,
            pphNominal: 0,
            jumlahNetto: amount,
          });
        } else if (ur.includes('koreksi') && amount === 7_038_000) {
          // 17 Mapel x 414 Siswa = 7.038 LJK @ Rp 1.000 = Rp 7.038.000 distributed across 9 teachers (8 teachers x 2 mapel = 828 LJK, 1 teacher x 1 mapel = 414 LJK)
          GURU_HONOR_NAMES.forEach((guru, idx) => {
            const mapelCount = idx < 8 ? 2 : 1;
            const ljkCount = 414 * mapelCount;
            const bruto = ljkCount * 1_000;
            honorRecipients.push({
              id: `hon-${item.id}-tw${tw}-${idx + 1}`,
              budgetItemId: item.id,
              triwulan: tw,
              nama: guru.nama,
              jabatan: `${guru.jabatan} (${mapelCount} Mapel)`,
              golongan: guru.golongan,
              rincianVolume: `${ljkCount} LJK (${mapelCount} Mapel x 414 Siswa)`,
              satuanNominal: 1_000,
              jumlahVolume: ljkCount,
              jumlahBruto: bruto,
              tarifPphPercent: 0,
              pphNominal: 0,
              jumlahNetto: bruto,
            });
          });
        } else if (ur.includes('pembuatan soal') && amount === 2_550_000) {
          // 17 Mapel x 3 Angkatan = 51 Paket Naskah @ Rp 50.000 = Rp 2.550.000 distributed across 9 teachers (8 teachers x 6 naskah, 1 teacher x 3 naskah = 51 naskah)
          GURU_HONOR_NAMES.forEach((guru, idx) => {
            const mapelCount = idx < 8 ? 2 : 1;
            const naskahCount = mapelCount * 3;
            const bruto = naskahCount * 50_000;
            honorRecipients.push({
              id: `hon-${item.id}-tw${tw}-${idx + 1}`,
              budgetItemId: item.id,
              triwulan: tw,
              nama: guru.nama,
              jabatan: `Penyusun Soal (${mapelCount} Mapel x 3 Tingkat)`,
              golongan: guru.golongan,
              rincianVolume: `${naskahCount} Naskah Soal`,
              satuanNominal: 50_000,
              jumlahVolume: naskahCount,
              jumlahBruto: bruto,
              tarifPphPercent: 0,
              pphNominal: 0,
              jumlahNetto: bruto,
            });
          });
        } else {
          // Generic fallback for any custom uploaded Excel honor row
          honorRecipients.push({
            id: `hon-${item.id}-tw${tw}-1`,
            budgetItemId: item.id,
            triwulan: tw,
            nama: rec.penerima,
            jabatan: rec.jabatan,
            golongan: 'Non-ASN',
            rincianVolume: `1 Paket (${cfg.bulanLabel})`,
            satuanNominal: amount,
            jumlahVolume: 1,
            jumlahBruto: amount,
            tarifPphPercent: 0,
            pphNominal: 0,
            jumlahNetto: amount,
          });
        }
      }
    });
  });

  return { transactions, honorRecipients };
}

export const INITIAL_GENERATED = generateBkuAndHonorFromBudget(INITIAL_BUDGET_ITEMS, '2026');
