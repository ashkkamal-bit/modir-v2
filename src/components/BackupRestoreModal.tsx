import React, { useState, useRef } from 'react';
import { AppDatabase } from '../types';
import {
  exportDatabaseAsJson,
  importDatabaseFromJson,
  resetDatabaseToDefault,
} from '../utils/storage';
import { getCurrentJalaliDate, toPersianDigits } from '../utils/jalali';
import {
  X,
  Download,
  Upload,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileCode,
  HardDriveDownload,
  FileText,
  Shield,
  Layers,
  Users,
  Building2,
  BookOpen,
} from 'lucide-react';
import { exportCompleteStandaloneApp } from '../utils/standaloneAppExport';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: AppDatabase;
  onUpdateDatabase: (newDb: AppDatabase) => void;
  onNavigateToSettings?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  db,
  onUpdateDatabase,
  onNavigateToSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [previewData, setPreviewData] = useState<{
    db: AppDatabase;
    staffCount: number;
    programsCount: number;
    schoolsCount: number;
    recordsCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    try {
      exportDatabaseAsJson(db);
      setSuccessMsg('فایل پشتیبان کامل سیستم (با پسوند JSON) با موفقیت دانلود شد.');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg('خطا در دانلود فایل پشتیبان: ' + err.message);
    }
  };

  const handleCopyJson = () => {
    try {
      const jsonStr = JSON.stringify(db, null, 2);
      navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setSuccessMsg('متن کامل پشتیبان در کلیپ‌بورد کپی شد.');
      setTimeout(() => {
        setCopied(false);
        setSuccessMsg('');
      }, 4000);
    } catch (e) {
      setErrorMsg('امکان کپی متن وجود ندارد.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    setPreviewData(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = importDatabaseFromJson(text);
        setPreviewData({
          db: parsed,
          staffCount: parsed.employees?.length || 0,
          programsCount: parsed.programs?.length || 0,
          schoolsCount: parsed.schools?.length || 0,
          recordsCount: parsed.employeePrograms?.length || 0,
        });
      } catch (err: any) {
        setErrorMsg('فایل انتخاب‌شده نامعتبر است: ' + (err.message || 'فرمت JSON صحیح نیست'));
      }
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (val: string) => {
    setPastedJson(val);
    setErrorMsg('');
    setPreviewData(null);
    if (!val.trim()) return;

    try {
      const parsed = importDatabaseFromJson(val.trim());
      setPreviewData({
        db: parsed,
        staffCount: parsed.employees?.length || 0,
        programsCount: parsed.programs?.length || 0,
        schoolsCount: parsed.schools?.length || 0,
        recordsCount: parsed.employeePrograms?.length || 0,
      });
    } catch (err: any) {
      // Don't show loud error while typing, just clear preview
      setPreviewData(null);
    }
  };

  const handleConfirmRestore = () => {
    if (!previewData) return;
    try {
      onUpdateDatabase(previewData.db);
      setSuccessMsg(
        `بازیابی اطلاعات با موفقیت انجام شد: ${previewData.staffCount} همکار، ${previewData.schoolsCount} آموزشگاه، ${previewData.programsCount} طرح و ${previewData.recordsCount} وضعیت اجرا.`
      );
      setErrorMsg('');
      setPreviewData(null);
      setPastedJson('');
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg('خطا در اعمال اطلاعات: ' + err.message);
    }
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'آیا از بارگذاری مجدد اطلاعات نمونه اولیه اطمینان دارید؟ تمام تغییرات اخیر بازنشانی خواهند شد.'
      )
    ) {
      const resetDb = resetDatabaseToDefault();
      onUpdateDatabase(resetDb);
      setSuccessMsg('اطلاعات پیش‌فرض اولیه سامانه با موفقیت بارگذاری شد.');
      setErrorMsg('');
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <span>مرکز پشتیبان‌گیری و بازیابی اطلاعات</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">
                  Backup & Restore
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                ذخیره امن، انتقال داده‌ها بین رایانه‌ها و بازیابی کامل پایگاه‌داده
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('backup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>۱. تهیه پشتیبان (دانلود Backup)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('restore');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>۲. بازیابی اطلاعات (Restore Backup)</span>
          </button>
        </div>

        {/* Status Messages */}
        <div className="px-6 pt-3">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'backup' ? (
            /* BACKUP TAB */
            <div className="space-y-5">
              {/* Current DB summary */}
              <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-teal-700" />
                    وضعیت پایگاه‌داده آماده پشتیبان‌گیری
                  </span>
                  <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                    تاریخ: {toPersianDigits(getCurrentJalaliDate())}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-teal-200/60 text-center text-xs">
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="block font-black text-slate-800 text-sm">
                      {toPersianDigits(db.employees.length)}
                    </span>
                    <span className="text-[10px] text-slate-500">همکار</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="block font-black text-slate-800 text-sm">
                      {toPersianDigits(db.schools.length)}
                    </span>
                    <span className="text-[10px] text-slate-500">آموزشگاه</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="block font-black text-slate-800 text-sm">
                      {toPersianDigits(db.programs.length)}
                    </span>
                    <span className="text-[10px] text-slate-500">طرح و برنامه</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="block font-black text-slate-800 text-sm">
                      {toPersianDigits(db.employeePrograms.length)}
                    </span>
                    <span className="text-[10px] text-slate-500">رکورد وضعیت</span>
                  </div>
                </div>
              </div>

              {/* Main Backup Action Button */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  دانلود فایل پشتیبان استاندارد (JSON)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  فایلی با فرمت JSON شامل ۱۰۰٪ داده‌ها، مشخصات همکاران، طرح‌ها و ضرایب ۱ تا ۳، وضعیت ثبت عملکرد و تنظیمات اداری سیستم شما ذخیره خواهد شد.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>دانلود فایل پشتیبان (Backup)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="flex items-center justify-center gap-1.5 py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="کپی متن کامل JSON در کلیپ‌بورد"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'کپی شد!' : 'کپی متن'}</span>
                  </button>
                </div>
              </div>

              {/* Standalone HTML Export */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 mb-1">
                    <FileCode className="w-4 h-4 text-indigo-700" />
                    پشتیبان مستقل به صورت نرم‌افزار کامل آفلاین (HTML)
                  </h4>
                  <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                    یک نسخه کامل از کل نرم‌افزار با تمام داده‌ها در یک فایل مجزا قابل اجرا روی هر رایانه‌ای بدون اینترنت.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportCompleteStandaloneApp(db)}
                  className="shrink-0 flex items-center gap-1 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود HTML آفلاین</span>
                </button>
              </div>
            </div>
          ) : (
            /* RESTORE TAB */
            <div className="space-y-5">
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-blue-950 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  روش اول: انتخاب فایل پشتیبان (JSON)
                </h4>
                <p className="text-xs text-blue-900/80 leading-relaxed">
                  فایل پشتیبانی که قبلاً از سیستم دریافت کرده‌اید را انتخاب فرمایید:
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>انتخاب فایل پشتیبان (.json) از سیستم</span>
                </button>
              </div>

              {/* Paste JSON Option */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  روش دوم: جای‌گذاری (Paste) متن مستقیم JSON
                </h4>
                <p className="text-[11px] text-slate-500">
                  اگر محتوای فایل را در کلیپ‌بورد کپی کرده‌اید، اینجا جای‌گذاری فرمایید:
                </p>
                <textarea
                  rows={3}
                  value={pastedJson}
                  onChange={(e) => handlePasteChange(e.target.value)}
                  dir="ltr"
                  placeholder='{"employees": [...], "programs": [...], "schools": [...]}'
                  className="w-full font-mono text-[11px] p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Preview & Confirmation Box */}
              {previewData && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      فایل پشتیبان با موفقیت شناسایی و اعتبارسنجی شد:
                    </span>
                    <span className="text-[11px] bg-emerald-200/70 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                      آماده بازیابی
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="block font-black text-slate-800 text-sm">
                        {toPersianDigits(previewData.staffCount)}
                      </span>
                      <span className="text-[10px] text-slate-500">همکار</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="block font-black text-slate-800 text-sm">
                        {toPersianDigits(previewData.schoolsCount)}
                      </span>
                      <span className="text-[10px] text-slate-500">آموزشگاه</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="block font-black text-slate-800 text-sm">
                        {toPersianDigits(previewData.programsCount)}
                      </span>
                      <span className="text-[10px] text-slate-500">طرح و برنامه</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="block font-black text-slate-800 text-sm">
                        {toPersianDigits(previewData.recordsCount)}
                      </span>
                      <span className="text-[10px] text-slate-500">وضعیت تکالیف</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأیید نهایی و جایگزینی اطلاعات سیستم</span>
                  </button>
                </div>
              )}

              {/* Reset to Default */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">آیا مایلید اطلاعات اولیه بارگذاری شود؟</span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>بارگذاری مجدد نمونه اولیه (Demo)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          {onNavigateToSettings ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToSettings();
              }}
              className="text-teal-700 hover:text-teal-800 font-bold hover:underline cursor-pointer"
            >
              رفتن به صفحه کامل تنظیمات و سربرگ اداری ←
            </button>
          ) : (
            <span className="text-slate-400">سامانه ارزشیابی ناحیه ۶ اصفهان</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
