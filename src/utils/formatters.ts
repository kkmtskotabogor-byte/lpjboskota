export function formatRupiah(value: number, withPrefix = true): string {
  const rounded = Math.round(value || 0);
  const isNegative = rounded < 0;
  const formatted = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (!withPrefix) {
    return isNegative ? `-${formatted}` : formatted;
  }
  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function parseIndonesianNumber(raw: unknown): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? Math.round(raw) : 0;
  }
  if (raw === null || raw === undefined) return 0;
  const str = String(raw).trim();
  if (!str || str === '-' || str === '—') return 0;
  // Remove currency prefixes and spaces
  const cleaned = str.replace(/rp\.?\s*/gi, '').trim();
  // If format uses dots as thousand separators and comma for decimal (e.g. 14.076.000 or 4.620.600,00)
  if (/^-?[\d.]+(,\d+)?$/.test(cleaned)) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }
  // If format uses commas as thousand separators (e.g. 14,076,000.00)
  if (/^-?[\d,]+(\.\d+)?$/.test(cleaned)) {
    const normalized = cleaned.replace(/,/g, '');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }
  const digitsOnly = cleaned.replace(/[^\d-]/g, '');
  const parsed = parseInt(digitsOnly, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

const SATUAN = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas',
];

function terbilangCore(n: number): string {
  const num = Math.floor(Math.abs(n));
  if (num < 12) return SATUAN[num];
  if (num < 20) return `${terbilangCore(num - 10)} Belas`.trim();
  if (num < 100) {
    const puluh = Math.floor(num / 10);
    const sisa = num % 10;
    return `${terbilangCore(puluh)} Puluh ${terbilangCore(sisa)}`.trim();
  }
  if (num < 200) return `Seratus ${terbilangCore(num - 100)}`.trim();
  if (num < 1000) {
    const ratus = Math.floor(num / 100);
    const sisa = num % 100;
    return `${terbilangCore(ratus)} Ratus ${terbilangCore(sisa)}`.trim();
  }
  if (num < 2000) return `Seribu ${terbilangCore(num - 1000)}`.trim();
  if (num < 1_000_000) {
    const ribu = Math.floor(num / 1000);
    const sisa = num % 1000;
    return `${terbilangCore(ribu)} Ribu ${terbilangCore(sisa)}`.trim();
  }
  if (num < 1_000_000_000) {
    const juta = Math.floor(num / 1_000_000);
    const sisa = num % 1_000_000;
    return `${terbilangCore(juta)} Juta ${terbilangCore(sisa)}`.trim();
  }
  if (num < 1_000_000_000_000) {
    const miliar = Math.floor(num / 1_000_000_000);
    const sisa = num % 1_000_000_000;
    return `${terbilangCore(miliar)} Miliar ${terbilangCore(sisa)}`.trim();
  }
  const triliun = Math.floor(num / 1_000_000_000_000);
  const sisa = num % 1_000_000_000_000;
  return `${terbilangCore(triliun)} Triliun ${terbilangCore(sisa)}`.trim();
}

export function terbilangRupiah(nominal: number): string {
  const rounded = Math.round(nominal || 0);
  if (rounded === 0) return 'Nol Rupiah';
  const prefix = rounded < 0 ? 'Minus ' : '';
  return `${prefix}${terbilangCore(Math.abs(rounded)).replace(/\s+/g, ' ')} Rupiah`;
}

const BULAN_INDO = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatTanggalIndo(isoDate: string): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || Number.isNaN(day)) {
    return isoDate;
  }
  return `${day} ${BULAN_INDO[monthIdx]} ${year}`;
}

export function getTriwulanLabel(tw: 'all' | 1 | 2 | 3 | 4): string {
  if (tw === 'all') return 'Tahun Anggaran Penuh (TW 1–4)';
  const ranges: Record<1 | 2 | 3 | 4, string> = {
    1: 'Triwulan 1 (Januari – Maret)',
    2: 'Triwulan 2 (April – Juni)',
    3: 'Triwulan 3 (Juli – September)',
    4: 'Triwulan 4 (Oktober – Desember)',
  };
  return ranges[tw];
}
