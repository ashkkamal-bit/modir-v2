import React, { useState, useRef } from 'react';
import { AppDatabase, SystemSettings } from '../types';
import { exportDatabaseAsJson, importDatabaseFromJson, resetDatabaseToDefault } from '../utils/storage';
import { getCurrentJalaliDate, toPersianDigits } from '../utils/jalali';
import { exportCompleteStandaloneApp, openCompleteStandaloneAppInNewTab } from '../utils/standaloneAppExport';
import {
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Save,
  Trash2,
  AlertTriangle,
  Building,
  CheckCircle,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { OfflineHtmlModal } from './OfflineHtmlModal';

interface BackupSettingsProps {
  db: AppDatabase;
  onUpdateDatabase: (newDb: AppDatabase) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
}

export const BackupSettings: React.FC<BackupSettingsProps> = ({
  db,
  onUpdateDatabase,
  onUpdateSettings,
}) => {
  const [settings, setSettings] = useState<SystemSettings>(db.settings);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [jsonPasteText, setJsonPasteText] = useState('');
  const [extractedSummary, setExtractedSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settings);
    setSuccessMessage('تنظیمات سربرگ و مشخصات اداره با موفقیت ذخیره شد.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleDownloadBackup = () => {
    exportDatabaseAsJson(db);
    setSuccessMessage('فایل پشتیبان کامل (JSON) با موفقیت در رایانه شما ذخیره شد.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const restored = importDatabaseFromJson(text);
        onUpdateDatabase(restored);
        setSettings(restored.settings);
        setExtractedSummary(
          `مشخصات با موفقیت استخراج شد: ${restored.employees.length} همکار، ${restored.programs.length} طرح پرورشی، ${restored.schools.length} آموزشگاه و ${restored.employeePrograms.length} وضعیت اجرایی.`
        );
        setSuccessMessage('اطلاعات با موفقیت از فایل پشتیبان JSON استخراج و بازیابی شد.');
        setErrorMessage('');
      } catch (err: any) {
        setErrorMessage(err.message || 'خطا در بازیابی فایل پشتیبان.');
        setSuccessMessage('');
      }
    };
    reader.readAsText(file);
  };

  const handlePasteJsonExtract = () => {
    if (!jsonPasteText.trim()) {
      setErrorMessage('لطفاً ابتدا متن فایل JSON را در کادر زیر جای‌گذاری (Paste) فرمایید.');
      return;
    }
    try {
      const restored = importDatabaseFromJson(jsonPasteText.trim());
      onUpdateDatabase(restored);
      setSettings(restored.settings);
      setExtractedSummary(
        `مشخصات با موفقیت استخراج شد: ${restored.employees.length} همکار، ${restored.programs.length} طرح پرورشی، ${restored.schools.length} آموزشگاه و ${restored.employeePrograms.length} وضعیت اجرایی.`
      );
      setSuccessMessage('مشخصات همکاران و طرح‌های اجرایی با موفقیت از متن JSON استخراج و در سامانه بارگذاری شد.');
      setErrorMessage('');
      setJsonPasteText('');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در استخراج مشخصات از متن JSON.');
      setSuccessMessage('');
    }
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'آیا از بارگذاری مجدد اطلاعات نمونه اولیه اطمینان دارید؟ تغییرات اخیر شما با داده‌های پیش‌فرض جایگزین خواهد شد.',
      )
    ) {
      const resetDb = resetDatabaseToDefault();
      onUpdateDatabase(resetDb);
      setSettings(resetDb.settings);
      setSuccessMessage('اطلاعات به حالت نمونه اولیه برگردانده شد.');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        'هشدار جدی: آیا مطمئن هستید که می‌خواهید تمام اطلاعات را برای شروع سال تحصیلی جدید پاک کنید؟ لطفاً قبل از آن فایل پشتیبان تهیه کنید.',
      )
    ) {
      const emptyDb: AppDatabase = {
        employees: [],
        schools: [],
        programs: [],
        employeePrograms: [],
        settings: {
          ...db.settings,
          academicYear: 'سال تحصیلی ۱۴۰۴-۱۴۰۵',
        },
        version: 1,
      };
      onUpdateDatabase(emptyDb);
      setSettings(emptyDb.settings);
      setSuccessMessage('تمامی جداول با موفقیت پاک‌سازی شدند.');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Messages */}
      {extractedSummary && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-5 h-5 shrink-0 text-teal-600" />
          <span className="font-bold">{extractedSummary}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Backup & Restore Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>پشتیبان‌گیری (Backup) و بازیابی اطلاعات (Restore)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            اطلاعات شما در مرورگر ذخیره است. برای جلوگیری از فقدان اطلاعات، همیشه پس از تغییرات مهم، فایل پشتیبان دانلود کنید.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Download Backup */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>تهیه نسخه پشتیبان (دانلود Backup)</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                تمامی مشخصات همکاران، آموزشگاه‌ها، طرح‌ها و ضرایب، وضعیت اجراها و درصدها در قالب یک فایل مطمئن JSON دانلود و روی سیستم شما ذخیره می‌شود.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل پشتیبان سیستم</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>بازیابی اطلاعات از فایل پشتیبان (Restore)</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                اگر مرورگر را پاک کرده‌اید یا قصد انتقال اطلاعات به رایانه دیگری در اداره را دارید، فایل پشتیبان قبلی را انتخاب و بارگذاری کنید.
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>انتخاب فایل پشتیبان جهت بازیابی</span>
              </button>
            </div>
          </div>

          {/* Download Standalone HTML */}
          <div className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2 mb-2">
                <FileCode className="w-4 h-4 text-emerald-700" />
                <span>نسخه کامل و مستقل نرم‌افزار (آفلاین)</span>
              </h3>
              <p className="text-xs text-emerald-900/80 leading-relaxed mb-4">
                خروجی تک‌فایلی نرم‌افزار شامل ۱۰۰٪ اطلاعات زنده (کلیه همکاران، طرح‌ها و ضرایب، مدارس و کارتابل‌ها) بدون نیاز به اینترنت.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => exportCompleteStandaloneApp(db)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود نسخه کامل نرم‌افزار (HTML)</span>
              </button>
              <button
                type="button"
                onClick={() => openCompleteStandaloneAppInNewTab(db)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>اجرای مستقیم نسخه کامل در تب جدید</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHtmlModal(true)}
                className="w-full text-center text-[11px] text-emerald-700 hover:underline pt-1 cursor-pointer font-bold"
              >
                مشاهده گزینه‌های بیشتر خروجی HTML
              </button>
            </div>
          </div>
        </div>

        {/* Direct JSON Paste & Extraction Card */}
        <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-200 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>استخراج مستقیم مشخصات همکاران و طرح‌ها از متن یا فایل JSON</span>
            </h3>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-md font-medium">
              پشتیبانی از نسخه‌های پشتیبان ناحیه ۶
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            می‌توانید محتوای فایل پشتیبان JSON را در کادر زیر کپی و الصاق (Paste) نمایید، تا کلیه مشخصات همکاران، آموزشگاه‌ها و وضعیت اجرای طرح‌ها همراه با تاریخ‌ها، ضرایب و بستر ارسال مستندات فوراً استخراج گردند:
          </p>
          <textarea
            rows={4}
            value={jsonPasteText}
            onChange={(e) => setJsonPasteText(e.target.value)}
            dir="ltr"
            placeholder='{"employees": [...], "programs": [...], "employeePrograms": [...]}'
            className="w-full font-mono text-xs p-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePasteJsonExtract}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4 text-indigo-200" />
              <span>استخراج و ذخیره اطلاعات از متن JSON</span>
            </button>
          </div>
        </div>

        {/* Defaults & Reset buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>بارگذاری مجدد داده‌های نمونه اولیه (Demo Data)</span>
          </button>

          <button
            type="button"
            onClick={handleClearAllData}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>پاک‌سازی کامل اطلاعات برای سال تحصیلی جدید</span>
          </button>
        </div>
      </div>

      {/* System & Letterhead Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            <span>تنظیمات سربرگ و اطلاعات اداری آموزش و پرورش</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            این اطلاعات در بالای کارتابل‌ها، سربرگ چاپ گزارش‌ها و خروجی‌های اداری درج می‌شوند.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نام اداره آموزش و پرورش شهرستان / منطقه:
              </label>
              <input
                type="text"
                value={settings.officeTitle}
                onChange={(e) => setSettings({ ...settings, officeTitle: e.target.value })}
                placeholder="مثال: اداره آموزش و پرورش ناحیه ۶ اصفهان"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان واحد یا کارشناسی مسئول:
              </label>
              <input
                type="text"
                value={settings.departmentTitle}
                onChange={(e) => setSettings({ ...settings, departmentTitle: e.target.value })}
                placeholder="مثال: کارشناسی امور پرورشی و فرهنگی"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نام کارشناس پرورشی اداره:
              </label>
              <input
                type="text"
                value={settings.officerName}
                onChange={(e) => setSettings({ ...settings, officerName: e.target.value })}
                placeholder="مثال: کارشناس مسئول امور پرورشی"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سال تحصیلی جاری:</label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                placeholder="سال تحصیلی ۱۴۰۳-۱۴۰۴"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طراح و توسعه‌دهنده سیستم:</label>
              <input
                type="text"
                value={settings.developerName || 'علیرضا شریعتی'}
                onChange={(e) => setSettings({ ...settings, developerName: e.target.value })}
                placeholder="علیرضا شریعتی"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden text-xs font-bold text-emerald-800"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره مشخصات سربرگ</span>
            </button>
          </div>
        </form>
      </div>

      {/* Offline HTML Modal */}
      <OfflineHtmlModal
        isOpen={showHtmlModal}
        onClose={() => setShowHtmlModal(false)}
        db={db}
      />
    </div>
  );
};
