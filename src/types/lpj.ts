export type Triwulan = 1 | 2 | 3 | 4;
export type TriwulanFilter = 'all' | Triwulan;

export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  statusSekolah: string;
  alamat: string;
  kota: string;
  provinsi: string;
  tahunAnggaran: string;
  sumberDana: string;
  nomorSkNphd: string;
  kepalaSekolah: string;
  nipKepala: string;
  bendaharaBos: string;
  nipBendahara: string;
  tanggalLaporanTw1: string;
  tanggalLaporanTw2: string;
  tanggalLaporanTw3: string;
  tanggalLaporanTw4: string;
}

export interface BudgetItem {
  id: string;
  categoryNo: string;
  categoryName: string;
  kodeRekening: string;
  uraian: string;
  jumlah: number;
  keterangan: string;
  tw1: number;
  tw2: number;
  tw3: number;
  tw4: number;
}

export interface BkuTransaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  triwulan: Triwulan;
  noBukti: string;
  kodeRekening: string;
  uraian: string;
  jenis: 'penerimaan' | 'pengeluaran';
  nominal: number;
  budgetItemId?: string;
  penerima: string;
  jabatanPenerima: string;
  rincianKwitansi: string;
  pph21: number;
  ppn: number;
}

export interface HonorRecipient {
  id: string;
  budgetItemId: string;
  triwulan: Triwulan;
  nama: string;
  jabatan: string;
  golongan: string;
  rincianVolume: string;
  satuanNominal: number;
  jumlahVolume: number;
  jumlahBruto: number;
  tarifPphPercent: number;
  pphNominal: number;
  jumlahNetto: number;
}

export type ValidationSeverity = 'error' | 'warning' | 'valid';
export type LpjModuleKey = 'ringkasan' | 'anggaran' | 'bku' | 'kwitansi' | 'honor' | 'validasi' | 'pengaturan';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  module: 'anggaran' | 'bku' | 'kwitansi' | 'honor';
  title: string;
  detail: string;
  triwulan?: Triwulan;
  relatedId?: string;
  fixAction?: {
    label: string;
    type: 'sync_jumlah_to_tw' | 'fix_keterangan_ekskul' | 'sync_bku_from_item' | 'sync_honor_from_item' | 'remove_zero_item';
    payloadId: string;
  };
}
