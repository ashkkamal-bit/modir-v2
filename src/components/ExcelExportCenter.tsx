import React, { useState } from 'react';
import { AppDatabase } from '../types';
import { exportFullExcelReport } from '../utils/excelExport';
import { exportFullHtmlReport, openHtmlReportInNewTab } from '../utils/htmlExport';
import { exportCompleteStandaloneApp } from '../utils/standaloneAppExport';
import { toPersianDigits } from '../utils/jalali';
import {
  FileSpreadsheet,
  Download,
  CheckCircle,
  Layers,
  FileCode,
  Eye,
  Laptop,
  Trophy,
} from 'lucide-react';

interface ExcelExportCenterProps {
  db: AppDatabase;
}

export const ExcelExportCenter: React.FC<ExcelExportCenterProps> = ({ db }) => {
  const [downloadingApp, setDownloadingApp] = useState(false);

  const handleDownloadExcel = () => {
    exportFullExcelReport(db);
  };

  const handleDownloadHtml = () => {
    exportFullHtmlReport(db);
  };

  const handleOpenHtmlPreview = () => {
    openHtmlReportInNewTab(db);
  };

  const handleDownloadOfflineApp = async () => {
    try {
      setDownloadingApp(true);
      await exportCompleteStandaloneApp(db);
    } catch (e) {
      console.error(e);
      alert('خطا در صدور نسخه کامل نرم‌افزار.');
    } finally {
      setDownloadingApp(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              🏛️ {db.settings?.officeTitle || 'اداره آموزش و پرورش ناحیه ۶ اصفهان'}
            </span>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              💻 برنامه‌نویس: <strong className="text-emerald-700">{db.settings?.developerName || 'علیرضا شریعتی'}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileCode className="w-6 h-6 text-emerald-600" />
            <span>مرکز صدور و دریافت خروجی‌های رسمی (HTML و Excel با ضرایب ۱ تا ۳)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            صدور فایل گزارش جامع در قالب HTML استاندارد و فایل چندکاربرگه اکسل (XLSX) با ۸ شیت تخصصی و نسخه کامل نرم‌افزار
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary HTML Download */}
          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            title="دانلود گزارش کامل تحلیلی و رتبه‌بندی به صورت فایل HTML"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>دانلود خروجی HTML</span>
          </button>

          {/* Primary Excel Download */}
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            title="دانلود فایل ۸ شیت اداری اکسل"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* HTML Report Showcase Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-emerald-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <FileCode className="w-3.5 h-3.5" />
            <span>خروجی ویژه و مستقل HTML</span>
          </div>
          <h3 className="text-lg font-black text-white">
            پرونده جامع ارزیابی، رتبه‌بندی و عملکرد در قالب تک‌فایل HTML با ضرایب ۱ تا ۳
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            این فایل یک گزارش رسمی خودکفا شامل شاخص‌های کلی منطقه، تابلوی رتبه‌بندی همکاران با سکوی مدال‌ها بر اساس ضرایب ۱ تا ۳ طرح‌ها، گزارش تجمیعی مدارس، طرح‌ها و جدول تمام تکالیف است که بدون نیاز به اینترنت با هر مرورگری باز می‌شود و آماده چاپ استاندارد A4 و ذخیره به عنوان PDF اداری است.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={handleDownloadHtml}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فوری گزارش HTML</span>
          </button>
          <button
            onClick={handleOpenHtmlPreview}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-emerald-300" />
            <span>مشاهده زنده در تب جدید</span>
          </button>
          <button
            onClick={handleDownloadOfflineApp}
            disabled={downloadingApp}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 shadow-md"
            title="دانلود نسخه کامل مستقل نرم‌افزار با تمام داده‌های زنده"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>{downloadingApp ? 'در حال صدور نسخه کامل...' : 'دانلود نسخه کامل نرم‌افزار (HTML)'}</span>
          </button>
        </div>
      </div>

      {/* Excel Sheets Breakdown */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>محتوای ۸ کاربرگ (Sheet) فایل اکسل رسمی آموزش و پرورش ناحیه ۶:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sheet 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
                <Layers className="w-4 h-4" />
                <span>Sheet 1 — ریز عملکرد و مستندات</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                شامل تمام رکوردهای تکالیف با نام همکار، کد ۲ رقمی، آموزشگاه، مقطع، سمت، عنوان طرح، ضریب امتیازی (۱ تا ۳)، امتیاز کسب‌شده با ضریب، تاریخ مهلت، تاریخ اجرا و مستندات.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>تعداد رکوردهای این شیت:</span>
              <strong className="font-mono text-slate-800">{toPersianDigits(db.employeePrograms.length)} سطر</strong>
            </div>
          </div>

          {/* Sheet 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">
                <Layers className="w-4 h-4" />
                <span>Sheet 2 — خلاصه عملکرد همکاران</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                جدول مدیریتی عملکرد هر همکار به همراه کد دو رقمی، تعداد کل برنامه‌ها، مجموع ضرایب طرح‌ها، تفکیک انجام شده، دیر انجام شده، انجام نشده، درصد پیشرفت و امتیاز نهایی با ضریب.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>تعداد ردیف‌های این شیت:</span>
              <strong className="font-mono text-slate-800">{toPersianDigits(db.employees.length)} همکار</strong>
            </div>
          </div>

          {/* Sheet 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-2">
                <Layers className="w-4 h-4" />
                <span>Sheet 3 — گزارش برنامه‌ها و ضرایب</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                خلاصه آماری هر طرح پرورشی، کد برنامه، عنوان، ضریب طرح (۱ تا ۳)، ارزش به‌موقع و با تاخیر، محور تربیتی، تعداد مشمولین، موفق‌ها، تاخیرها و درصد کلی تحقق.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>تعداد ردیف‌های این شیت:</span>
              <strong className="font-mono text-slate-800">{toPersianDigits(db.programs.length)} برنامه</strong>
            </div>
          </div>

          {/* Sheet 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm mb-2">
                <Layers className="w-4 h-4" />
                <span>Sheet 4 — گزارش و امتیازبندی آموزشگاه‌ها</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                تحلیل عملکرد تجمیعی مدارس، تعداد نیروهای هر واحد، مجموع تکالیف، امتیاز وزنی مکتسبه آموزشگاه با ضرایب طرح‌ها، میانگین امتیاز هر نیرو و درصد پیشرفت.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>تعداد ردیف‌های این شیت:</span>
              <strong className="font-mono text-slate-800">{toPersianDigits(db.schools.length)} آموزشگاه</strong>
            </div>
          </div>

          {/* Sheet 5 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between md:col-span-2">
            <div>
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>Sheet 5 — تابلوی رسمی رتبه‌بندی همکاران با ضرایب ۱ تا ۳</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                رتبه‌بندی جامع و شفاف تمام نیروها بر اساس ضرایب ۱ تا ۳ هر طرح (به‌موقع: ۱۰۰ × ضریب، دیرکرد: ۶۰ × ضریب)، درصد پیشرفت و تعیین سطح عملکرد (ممتاز، بسیار خوب، خوب، نیازمند پیگیری).
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>تعداد همکاران رتبه‌بندی شده:</span>
              <strong className="font-mono text-slate-800">{toPersianDigits(db.employees.length)} همکار</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions card */}
      <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">نکات کاربردی برای کارشناس محترم اداره:</p>
          <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
            <li>ضرایب ۱ تا ۳ برای هر طرح به صورت خودکار در محاسبات اکسل و رتبه‌بندی نهایی ضرب شده‌اند.</li>
            <li>فایل‌های HTML بدون هیچ برنامه اضافی و فقط با دو بار کلیک در هر رایانه یا موبایلی قابل مشاهده هستند.</li>
            <li>برای چاپ یا ساخت PDF رسمی، فایل HTML را باز کرده و کلیدهای <kbd className="font-mono bg-emerald-200/80 px-1 py-0.5 rounded text-[11px]">Ctrl + P</kbd> را بفشارید.</li>
            <li>فایل اکسل (.xlsx) با نرم‌افزارهای Microsoft Excel، LibreOffice و Google Sheets کاملاً سازگار است.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
