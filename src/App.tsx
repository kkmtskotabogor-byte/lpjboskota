import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  Receipt,
  Users,
  X,
} from 'lucide-react';
import {
  BkuTransaction,
  BudgetItem,
  HonorRecipient,
  LpjModuleKey,
  SchoolProfile,
  Triwulan,
  TriwulanFilter,
  ValidationIssue,
} from './types/lpj';
import {
  generateBkuAndHonorFromBudget,
  INITIAL_BUDGET_ITEMS,
  INITIAL_GENERATED,
  INITIAL_SCHOOL_PROFILE,
} from './data/initialLpjData';
import { runAutomaticValidation } from './utils/validationEngine';
import {
  exportBkuPdf,
  exportCompleteLpjBundlePdf,
  exportHonorPdf,
  exportKwitansiPdf,
  exportRkasPdf,
} from './utils/pdfExporter';
import { exportBudgetTemplateExcel } from './utils/excelService';
import { formatRupiah } from './utils/formatters';
import { RingkasanDashboard } from './components/RingkasanDashboard';
import { AnggaranModule } from './components/AnggaranModule';
import { BkuModule } from './components/BkuModule';
import { KwitansiModule } from './components/KwitansiModule';
import { HonorModule } from './components/HonorModule';
import {
  PengaturanSekolahModule,
  ValidasiModule,
} from './components/ValidasiAndSettings';

const STORAGE_KEY = 'silpj_bos_workspace_v1';

interface StoredWorkspace {
  school: SchoolProfile;
  budgetItems: BudgetItem[];
  transactions: BkuTransaction[];
  honorRecipients: HonorRecipient[];
}

function loadInitialWorkspace(): StoredWorkspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredWorkspace;
      if (parsed && Array.isArray(parsed.budgetItems) && parsed.school) {
        return parsed;
      }
    }
  } catch {
    // Fallback to default dataset
  }
  return {
    school: INITIAL_SCHOOL_PROFILE,
    budgetItems: INITIAL_BUDGET_ITEMS,
    transactions: INITIAL_GENERATED.transactions,
    honorRecipients: INITIAL_GENERATED.honorRecipients,
  };
}

const MODULE_LABELS: Record<LpjModuleKey, string> = {
  ringkasan: 'Ringkasan LPJ',
  anggaran: 'Anggaran & Excel',
  bku: 'Buku Kas Umum',
  kwitansi: 'Kwitansi BOS',
  honor: 'Daftar Honor',
  validasi: 'Validasi Otomatis',
  pengaturan: 'Identitas Sekolah',
};

export default function App() {
  const [workspace, setWorkspace] = useState<StoredWorkspace>(loadInitialWorkspace);
  const [activeModule, setActiveModule] = useState<LpjModuleKey>('ringkasan');
  const [twFilter, setTwFilter] = useState<TriwulanFilter>('all');
  const [selectedKwitansiTxId, setSelectedKwitansiTxId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Ignore storage quota issues
    }
  }, [workspace]);

  const validationIssues = useMemo(
    () =>
      runAutomaticValidation(
        workspace.budgetItems,
        workspace.transactions,
        workspace.honorRecipients
      ),
    [workspace.budgetItems, workspace.transactions, workspace.honorRecipients]
  );

  const errorCount = validationIssues.filter((v) => v.severity === 'error').length;
  const warningCount = validationIssues.filter((v) => v.severity === 'warning').length;

  const handleUpdateBudgetItems = (
    items: BudgetItem[],
    autoSyncBkuAndHonor = false
  ) => {
    if (autoSyncBkuAndHonor) {
      const regenerated = generateBkuAndHonorFromBudget(
        items,
        workspace.school.tahunAnggaran
      );
      setWorkspace((prev) => ({
        ...prev,
        budgetItems: items,
        transactions: regenerated.transactions,
        honorRecipients: regenerated.honorRecipients,
      }));
    } else {
      setWorkspace((prev) => ({
        ...prev,
        budgetItems: items,
      }));
    }
  };

  const handleRequestSyncAll = () => {
    setConfirmModal({
      title: 'Sinkronkan Ulang BKU, Kwitansi & Daftar Honor?',
      description:
        'Tindakan ini akan menyusun ulang transaksi Buku Kas Umum, Kwitansi, dan Daftar Penerimaan Honorarium agar 100% sesuai dengan tabel Anggaran BOS Triwulan 1–4 saat ini.',
      confirmLabel: 'Ya, Sinkronkan Sekarang',
      onConfirm: () => {
        const regenerated = generateBkuAndHonorFromBudget(
          workspace.budgetItems,
          workspace.school.tahunAnggaran
        );
        setWorkspace((prev) => ({
          ...prev,
          transactions: regenerated.transactions,
          honorRecipients: regenerated.honorRecipients,
        }));
        setConfirmModal(null);
      },
    });
  };

  const handleResetDefault = () => {
    setConfirmModal({
      title: 'Kembalikan ke Data Awal Excel?',
      description:
        'Seluruh perubahan pada Anggaran, Buku Kas Umum, Kwitansi, dan Daftar Penerimaan Honor akan dikembalikan sesuai data anggaran awal (Total Pagu Rp 113.250.000).',
      confirmLabel: 'Kembalikan Data Awal',
      onConfirm: () => {
        const fresh = generateBkuAndHonorFromBudget(INITIAL_BUDGET_ITEMS, '2026');
        setWorkspace({
          school: INITIAL_SCHOOL_PROFILE,
          budgetItems: INITIAL_BUDGET_ITEMS,
          transactions: fresh.transactions,
          honorRecipients: fresh.honorRecipients,
        });
        setConfirmModal(null);
      },
    });
  };

  const handleSaveTransaction = (tx: BkuTransaction) => {
    setWorkspace((prev) => {
      const exists = prev.transactions.some((t) => t.id === tx.id);
      const nextTx = exists
        ? prev.transactions.map((t) => (t.id === tx.id ? tx : t))
        : [...prev.transactions, tx];
      return {
        ...prev,
        transactions: nextTx,
      };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleSaveHonorRecipient = (rec: HonorRecipient) => {
    setWorkspace((prev) => {
      const exists = prev.honorRecipients.some((h) => h.id === rec.id);
      const nextHonor = exists
        ? prev.honorRecipients.map((h) => (h.id === rec.id ? rec : h))
        : [...prev.honorRecipients, rec];
      return {
        ...prev,
        honorRecipients: nextHonor,
      };
    });
  };

  const handleDeleteHonorRecipient = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      honorRecipients: prev.honorRecipients.filter((h) => h.id !== id),
    }));
  };

  const handleApplyValidationFix = (issue: ValidationIssue) => {
    if (!issue.fixAction) return;
    const { type, payloadId } = issue.fixAction;

    if (type === 'sync_jumlah_to_tw') {
      setWorkspace((prev) => ({
        ...prev,
        budgetItems: prev.budgetItems.map((b) =>
          b.id === payloadId
            ? { ...b, jumlah: b.tw1 + b.tw2 + b.tw3 + b.tw4 }
            : b
        ),
      }));
    } else if (type === 'fix_keterangan_ekskul') {
      setWorkspace((prev) => ({
        ...prev,
        budgetItems: prev.budgetItems.map((b) => {
          if (b.id !== payloadId) return b;
          const monthly = Math.round(b.jumlah / 12);
          return {
            ...b,
            keterangan: `${formatRupiah(monthly)} x 12 Bulan`,
          };
        }),
      }));
    } else if (type === 'remove_zero_item') {
      setWorkspace((prev) => ({
        ...prev,
        budgetItems: prev.budgetItems.filter((b) => b.id !== payloadId),
      }));
    } else if (type === 'sync_bku_from_item') {
      const [itemId, twStr] = payloadId.split('|');
      const tw = Number(twStr) as Triwulan;
      const item = workspace.budgetItems.find((b) => b.id === itemId);
      if (!item) return;
      const targetNominal = item[`tw${tw}` as 'tw1' | 'tw2' | 'tw3' | 'tw4'];
      const regeneratedSingle = generateBkuAndHonorFromBudget(
        [item],
        workspace.school.tahunAnggaran
      );
      const replacementTx = regeneratedSingle.transactions.find(
        (t) => t.jenis === 'pengeluaran' && t.triwulan === tw
      );

      setWorkspace((prev) => {
        const filteredOut = prev.transactions.filter(
          (t) => !(t.jenis === 'pengeluaran' && t.budgetItemId === itemId && t.triwulan === tw)
        );
        if (targetNominal > 0 && replacementTx) {
          filteredOut.push(replacementTx);
        }
        return { ...prev, transactions: filteredOut };
      });
    } else if (type === 'sync_honor_from_item') {
      const [itemId, twStr] = payloadId.split('|');
      const tw = Number(twStr) as Triwulan;
      const item = workspace.budgetItems.find((b) => b.id === itemId);
      if (!item) return;
      const regeneratedSingle = generateBkuAndHonorFromBudget(
        [item],
        workspace.school.tahunAnggaran
      );
      const freshHonorRows = regeneratedSingle.honorRecipients.filter(
        (h) => h.budgetItemId === itemId && h.triwulan === tw
      );

      setWorkspace((prev) => ({
        ...prev,
        honorRecipients: [
          ...prev.honorRecipients.filter(
            (h) => !(h.budgetItemId === itemId && h.triwulan === tw)
          ),
          ...freshHonorRows,
        ],
      }));
    }
  };

  const navItems: {
    id: LpjModuleKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    meta?: string;
  }[] = [
    { id: 'ringkasan', label: 'Ringkasan LPJ', icon: LayoutDashboard },
    { id: 'anggaran', label: 'Anggaran & Excel', icon: FileSpreadsheet },
    { id: 'bku', label: 'Buku Kas Umum', icon: BookOpen },
    { id: 'kwitansi', label: 'Kwitansi BOS', icon: Receipt },
    { id: 'honor', label: 'Daftar Honorarium', icon: Users },
    {
      id: 'validasi',
      label: 'Validasi Otomatis',
      icon: ClipboardCheck,
      meta:
        errorCount > 0
          ? `${errorCount} selisih`
          : warningCount > 0
          ? `${warningCount} catatan`
          : '100%',
    },
    { id: 'pengaturan', label: 'Identitas Sekolah', icon: Building2 },
  ];

  const totalBudget = workspace.budgetItems.reduce((s, i) => s + i.jumlah, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar strictly obeying 3-Zone Contract: [Brand] — [4-5 Single-Line Nav Links] — [1 Primary CTA] */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md"
            aria-label="Buka navigasi modul"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a
            href="#ringkasan"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('ringkasan');
            }}
            className="text-base font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            SiLPJ BOS
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          {(
            [
              { id: 'ringkasan', label: 'Ringkasan' },
              { id: 'anggaran', label: 'Anggaran' },
              { id: 'bku', label: 'Kas Umum' },
              { id: 'kwitansi', label: 'Kwitansi' },
              { id: 'honor', label: 'Daftar Honor' },
            ] as { id: LpjModuleKey; label: string }[]
          ).map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => setActiveModule(link.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                activeModule === link.id
                  ? 'text-blue-900 font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() =>
              exportCompleteLpjBundlePdf(
                workspace.school,
                workspace.budgetItems,
                workspace.transactions,
                workspace.honorRecipients,
                twFilter
              )
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor Bundel PDF
          </button>
        </div>
      </header>

      {/* Workspace Body: Sidebar + Main Viewport */}
      <div className="flex-1 flex relative">
        {/* Sidebar Navigation */}
        <aside
          className={`${
            mobileMenuOpen ? 'fixed inset-y-0 left-0 z-40 pt-16' : 'hidden'
          } lg:static lg:block w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between`}
        >
          <div className="p-4 space-y-6">
            <div className="px-2 pb-4 border-b border-slate-100">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {workspace.school.namaSekolah}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                TA {workspace.school.tahunAnggaran} · {workspace.school.kota}
              </div>
              <div className="mt-2 text-xs font-mono tabular-nums font-semibold text-blue-950">
                Pagu {formatRupiah(totalBudget)}
              </div>
            </div>

            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveModule(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.meta && (
                      <span
                        className={`text-[11px] font-mono tabular-nums ${
                          active
                            ? 'text-slate-300'
                            : errorCount > 0
                            ? 'text-red-700 font-semibold'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.meta}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="font-medium text-slate-700">Bendahara BOS</div>
            <div className="truncate">{workspace.school.bendaharaBos}</div>
            <div className="font-mono text-[10px]">
              Modul Aktif: {MODULE_LABELS[activeModule]}
            </div>
          </div>
        </aside>

        {/* Mobile Scrim */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1320px] mx-auto w-full">
          {activeModule === 'ringkasan' && (
            <RingkasanDashboard
              school={workspace.school}
              budgetItems={workspace.budgetItems}
              transactions={workspace.transactions}
              honorRecipients={workspace.honorRecipients}
              validationIssues={validationIssues}
              twFilter={twFilter}
              onChangeTwFilter={setTwFilter}
              onNavigate={setActiveModule}
              onExportBundlePdf={() =>
                exportCompleteLpjBundlePdf(
                  workspace.school,
                  workspace.budgetItems,
                  workspace.transactions,
                  workspace.honorRecipients,
                  twFilter
                )
              }
              onExportRkasPdf={() =>
                exportRkasPdf(workspace.school, workspace.budgetItems)
              }
              onExportBkuPdf={() =>
                exportBkuPdf(workspace.school, workspace.transactions, twFilter)
              }
              onExportKwitansiPdf={() =>
                exportKwitansiPdf(
                  workspace.school,
                  workspace.transactions.filter(
                    (t) => twFilter === 'all' || t.triwulan === twFilter
                  ),
                  twFilter === 'all' ? 'TW1-4' : `TW${twFilter}`
                )
              }
              onExportHonorPdf={() =>
                exportHonorPdf(
                  workspace.school,
                  workspace.budgetItems,
                  workspace.honorRecipients,
                  'all',
                  twFilter
                )
              }
              onExportExcel={() =>
                exportBudgetTemplateExcel(
                  workspace.school,
                  workspace.budgetItems,
                  workspace.transactions,
                  workspace.honorRecipients
                )
              }
            />
          )}

          {activeModule === 'anggaran' && (
            <AnggaranModule
              budgetItems={workspace.budgetItems}
              onUpdateItems={handleUpdateBudgetItems}
              onSyncBkuAndHonor={handleRequestSyncAll}
              onExportRkasPdf={() =>
                exportRkasPdf(workspace.school, workspace.budgetItems)
              }
              onExportTemplateExcel={() =>
                exportBudgetTemplateExcel(
                  workspace.school,
                  workspace.budgetItems,
                  workspace.transactions,
                  workspace.honorRecipients
                )
              }
            />
          )}

          {activeModule === 'bku' && (
            <BkuModule
              budgetItems={workspace.budgetItems}
              transactions={workspace.transactions}
              twFilter={twFilter}
              onChangeTwFilter={setTwFilter}
              onSaveTransaction={handleSaveTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenKwitansiForTx={(txId) => {
                setSelectedKwitansiTxId(txId);
                setActiveModule('kwitansi');
              }}
              onExportBkuPdf={() =>
                exportBkuPdf(workspace.school, workspace.transactions, twFilter)
              }
            />
          )}

          {activeModule === 'kwitansi' && (
            <KwitansiModule
              school={workspace.school}
              transactions={workspace.transactions}
              selectedTxId={selectedKwitansiTxId}
              twFilter={twFilter}
              onChangeTwFilter={setTwFilter}
              onSelectTx={setSelectedKwitansiTxId}
              onSaveTransaction={handleSaveTransaction}
              onExportSingleKwitansiPdf={(tx) =>
                exportKwitansiPdf(workspace.school, [tx], tx.noBukti)
              }
              onExportBatchKwitansiPdf={(list, label) =>
                exportKwitansiPdf(workspace.school, list, label)
              }
            />
          )}

          {activeModule === 'honor' && (
            <HonorModule
              budgetItems={workspace.budgetItems}
              transactions={workspace.transactions}
              honorRecipients={workspace.honorRecipients}
              twFilter={twFilter}
              onChangeTwFilter={setTwFilter}
              onSaveRecipient={handleSaveHonorRecipient}
              onDeleteRecipient={handleDeleteHonorRecipient}
              onExportHonorPdf={(budgetItemId, tw) =>
                exportHonorPdf(
                  workspace.school,
                  workspace.budgetItems,
                  workspace.honorRecipients,
                  budgetItemId,
                  tw
                )
              }
            />
          )}

          {activeModule === 'validasi' && (
            <ValidasiModule
              issues={validationIssues}
              onApplyFix={handleApplyValidationFix}
              onNavigate={setActiveModule}
            />
          )}

          {activeModule === 'pengaturan' && (
            <PengaturanSekolahModule
              school={workspace.school}
              onUpdateSchool={(next) =>
                setWorkspace((prev) => ({ ...prev, school: next }))
              }
              onResetAllDefault={handleResetDefault}
            />
          )}
        </main>
      </div>

      {/* Accessible Confirmation Dialog (Zero window.alert / window.confirm) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-lg">
            <h3 className="text-base font-semibold text-slate-900">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmModal.description}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors"
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
