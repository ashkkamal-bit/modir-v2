import React, { useState } from 'react';
import { Employee, Program, School, EmployeeProgram, SystemSettings } from '../types';
import { calculateOverallStats, calculateEmployeeStats } from '../utils/storage';
import { toPersianDigits, padZero } from '../utils/jalali';
import { PieChart } from './PieChart';
import {
  ArrowRight,
  Search,
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Award,
  FileSpreadsheet,
  Share2,
  UserPlus,
  AlertCircle,
  Sparkles,
  Building2,
  Briefcase,
  Star,
  Database,
  Download,
  Upload,
} from 'lucide-react';
import {
  IsfahanSkyline,
  IsfahanToranjWatermark,
  IsfahanHeritageBar,
  IsfahanArchBadge,
} from './IsfahanMotifs';

interface DashboardProps {
  employees: Employee[];
  programs: Program[];
  schools: School[];
  employeePrograms: EmployeeProgram[];
  settings: SystemSettings;
  onQuickJump: (code: string) => boolean; // returns true if found
  onNavigate: (tab: string) => void;
  onSelectEmployee: (emp: Employee) => void;
  onOpenNewEmployeeModal: () => void;
  onOpenNewProgramModal: () => void;
  onOpenAssignModal: () => void;
  onExportExcel: () => void;
  onOpenBackupModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  employees,
  programs,
  schools,
  employeePrograms,
  settings,
  onQuickJump,
  onNavigate,
  onSelectEmployee,
  onOpenNewEmployeeModal,
  onOpenNewProgramModal,
  onOpenAssignModal,
  onExportExcel,
  onOpenBackupModal,
}) => {
  const [quickCode, setQuickCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const overall = calculateOverallStats(employees, employeePrograms);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const clean = padZero(quickCode.trim());
    if (!clean || clean === '00') {
      setErrorMessage('لطفاً یک کد دو رقمی معتبر (از 01 تا 99) وارد کنید.');
      return;
    }

    const success = onQuickJump(clean);
    if (!success) {
      setErrorMessage(`همکاری با کد «${clean}» در سیستم پیدا نشد. لطفاً کد را بررسی کنید.`);
    }
  };

  // Top performing colleagues (ranked strictly by general programs factoring in coefficients 1 to 3)
  const rankedEmployees = [...employees]
    .map((emp) => {
      const stats = calculateEmployeeStats(emp.id, employeePrograms, programs);
      return { emp, stats };
    })
    .sort((a, b) => b.stats.earnedWeightedScore - a.stats.earnedWeightedScore || b.stats.progressPercent - a.stats.progressPercent)
    .slice(0, 5);

  // Role-based performance statistics breakdown
  const standardRoleCategories = [
    { id: 'مدیر', label: 'مدیران مدارس' },
    { id: 'معاون آموزشی', label: 'معاونان آموزشی' },
    { id: 'معاون پرورشی', label: 'معاونان پرورشی' },
    { id: 'دبیر', label: 'دبیران' },
    { id: 'آموزگار', label: 'آموزگاران' },
    { id: 'معاون اجرایی', label: 'معاونان اجرایی' },
    { id: 'سایر', label: 'سایر سمت‌های سازمانی' },
  ];

  const roleStats = standardRoleCategories.map((cat) => {
    const roleStaff = employees.filter((e) => {
      if (cat.id === 'سایر') {
        const coreSix = new Set(['مدیر', 'معاون آموزشی', 'معاون پرورشی', 'دبیر', 'آموزگار', 'معاون اجرایی']);
        const isStandard = coreSix.has(e.role) || e.role.startsWith('معاون پرورشی');
        return !isStandard || e.role === 'سایر';
      }
      if (cat.id === 'معاون پرورشی') {
        return e.role === 'معاون پرورشی' || e.role.includes('معاون پرورشی');
      }
      return e.role === cat.id;
    });

    const count = roleStaff.length;
    let avgProgress = 0;
    let avgOnTime = 0;
    let avgScore = 0;

    if (count > 0) {
      const totalProgress = roleStaff.reduce((sum, e) => {
        const st = calculateEmployeeStats(e.id, employeePrograms, programs);
        return sum + st.progressPercent;
      }, 0);
      const totalOnTime = roleStaff.reduce((sum, e) => {
        const st = calculateEmployeeStats(e.id, employeePrograms, programs);
        return sum + st.onTimePercent;
      }, 0);
      const totalScore = roleStaff.reduce((sum, e) => {
        const st = calculateEmployeeStats(e.id, employeePrograms, programs);
        return sum + st.earnedWeightedScore;
      }, 0);
      avgProgress = Math.round(totalProgress / count);
      avgOnTime = Math.round(totalOnTime / count);
      avgScore = Math.round(totalScore / count);
    }

    return {
      ...cat,
      count,
      avgProgress,
      avgOnTime,
      avgScore,
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome & Quick Cartable Jump Banner with Isfahan Skyline */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-blue-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Background decorative accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Isfahan Historic Skyline Silhouette */}
        <IsfahanSkyline className="w-full h-36 absolute bottom-0 left-0 right-0 text-teal-300 pointer-events-none" opacity={0.16} />

        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{settings.officeTitle} | {settings.academicYear}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <span>🏛️ نگین پرورشی اصفهان؛ نصف جهان</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <span>⭐ نظام ارزیابی با ضریب ۱ تا ۳ برای طرح‌های مهم</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3">
            سامانه ارزشیابی عملکرد نیروهای آموزش و پرورش ناحیه ۶ اصفهان
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mb-8 leading-relaxed max-w-2xl">
            سامانه جامع، حرفه‌ای و عملیاتی ثبت، ارزشیابی، تحلیل و گزارش‌گیری عملکرد نیروها و مدارس آموزش و پرورش ناحیه ۶ اصفهان
          </p>

          {/* Quick Cartable Jump Card with Isfahan Toranj Watermark */}
          <div className="bg-white/10 backdrop-blur-md p-5 sm:p-7 rounded-2xl border border-white/20 shadow-xl max-w-2xl relative overflow-hidden">
            <IsfahanToranjWatermark className="w-48 h-48 absolute -bottom-12 -left-12 text-teal-300 pointer-events-none" opacity={0.12} />

            <div className="relative z-10">
              <h3 className="text-base sm:text-lg font-bold text-teal-300 mb-2 flex items-center gap-2">
                <span>ورود سریع به کارتابل همکار با کد دو رقمی</span>
              </h3>
              <p className="text-xs text-slate-300 mb-4">
                کد اختصاصی همکار را وارد کنید تا مستقیماً کارتابل، وضعیت برنامه‌ها و نمودار عملکرد او باز شود:
              </p>

              <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={4}
                    value={quickCode}
                    onChange={(e) => {
                      setQuickCode(e.target.value.replace(/[^0-9]/g, ''));
                      setErrorMessage('');
                    }}
                    placeholder="کد دو رقمی همکار (مثلاً 27 یا 01)"
                    className="w-full text-center sm:text-right font-mono font-bold text-lg px-4 py-3 bg-white text-slate-900 rounded-xl focus:ring-4 focus:ring-teal-400 outline-hidden shadow-inner placeholder:text-slate-400 placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
                >
                  <span>ورود به کارتابل</span>
                  <ArrowRight className="w-4 h-4 transform rotate-180" />
                </button>
              </form>

              {errorMessage && (
                <div className="mt-3 p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Quick Sample Chips */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                <span className="text-[11px] text-slate-400 ml-1">دسترسی سریع به همکاران نمونه:</span>
                {employees.slice(0, 7).map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      setQuickCode(emp.code);
                      onQuickJump(emp.code);
                    }}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="text-teal-300 font-bold">{emp.code}</span>
                    <span className="text-slate-200 text-[11px]">({emp.fullName.split(' ')[0]})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Isfahan Cultural & Heritage Bar */}
      <IsfahanHeritageBar />

      {/* Quick Backup & Restore Alert Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-4 sm:p-5 rounded-3xl border border-indigo-900/60 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0 shadow-inner">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black flex items-center gap-2">
              <span>مرکز پشتیبان‌گیری و بازیابی اطلاعات سامانه</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                محافظت از اطلاعات
              </span>
            </h4>
            <p className="text-xs text-blue-200/90 mt-0.5 leading-relaxed">
              جهت امنیت اطلاعات و جلوگیری از فقدان داده‌ها، نسخه پشتیبان (JSON) سیستم را به صورت دوره‌ای دانلود کنید یا فایل قبلی را با ۱ کلیک بازیابی فرمایید.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Database className="w-4 h-4 text-blue-200" />
            <span>بازیابی و پشتیبان گرفتن</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('backup_settings')}
            className="flex items-center justify-center px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            تنظیمات کامل
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>شاخص‌های کلی عملکرد پرورشی منطقه</span>
          </h2>
          <span className="text-xs text-slate-500">
            بروزرسانی زنده بر اساس تمام تکالیف ثبت‌شده با احتساب ضرایب ۱ تا ۳
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {/* Total Staff */}
          <div
            onClick={() => onNavigate('employees')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] text-slate-400 group-hover:text-blue-600">مشاهده</span>
            </div>
            <span className="text-2xl font-black text-slate-800 block">
              {toPersianDigits(overall.totalEmployees)}
            </span>
            <span className="text-[11px] font-medium text-slate-500">کل همکاران</span>
          </div>

          {/* Total Programs */}
          <div
            onClick={() => onNavigate('programs')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span className="text-[10px] text-slate-400 group-hover:text-indigo-600">مشاهده</span>
            </div>
            <span className="text-2xl font-black text-slate-800 block">
              {toPersianDigits(programs.length)}
            </span>
            <div className="flex items-center gap-1 text-[10px] mt-0.5">
              <span className="text-blue-700 font-bold">{toPersianDigits(programs.filter(p => p.scope !== 'اختصاصی').length)} همگانی</span>
              <span className="text-slate-300">•</span>
              <span className="text-purple-700 font-bold">{toPersianDigits(programs.filter(p => p.scope === 'اختصاصی').length)} اختصاصی</span>
            </div>
          </div>

          {/* Total Assignments */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <Share2 className="w-4 h-4 text-teal-600" />
              <span className="text-[10px] text-slate-400">تکالیف</span>
            </div>
            <span className="text-2xl font-black text-slate-800 block">
              {toPersianDigits(overall.totalAssignments)}
            </span>
            <span className="text-[11px] font-medium text-slate-500">کل اجراها</span>
          </div>

          {/* Done (Green) */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold">🟢</span>
            </div>
            <span className="text-2xl font-black text-emerald-700 block">
              {toPersianDigits(overall.done)}
            </span>
            <span className="text-[11px] font-bold text-emerald-800">انجام شده</span>
          </div>

          {/* Late (Orange) */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-bold">🟠</span>
            </div>
            <span className="text-2xl font-black text-amber-700 block">
              {toPersianDigits(overall.late)}
            </span>
            <span className="text-[11px] font-bold text-amber-800">دیر انجام شده</span>
          </div>

          {/* Not Done (Red) */}
          <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
            <div className="flex items-center justify-between text-rose-700 mb-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span className="text-[10px] font-bold">🔴</span>
            </div>
            <span className="text-2xl font-black text-rose-700 block">
              {toPersianDigits(overall.notDone)}
            </span>
            <span className="text-[11px] font-bold text-rose-800">انجام نشده</span>
          </div>

          {/* Progress Percent */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs bg-gradient-to-b from-white to-emerald-50/30">
            <div className="text-[10px] font-bold text-slate-500 mb-2">📊 درصد پیشرفت</div>
            <span className="text-2xl font-black text-emerald-700 block">
              %{toPersianDigits(overall.progressPercent)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">انجام + تاخیر</span>
          </div>

          {/* On-Time Percent */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs bg-gradient-to-b from-white to-blue-50/30">
            <div className="text-[10px] font-bold text-slate-500 mb-2">⏱️ اجرای به‌موقع</div>
            <span className="text-2xl font-black text-blue-700 block">
              %{toPersianDigits(overall.onTimePercent)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">صرفاً در موعد</span>
          </div>
        </div>
      </div>

      {/* Role Breakdown & Comparative Analysis */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>تحلیل عملکرد و آمار به تفکیک سمت‌های سازمانی</span>
                <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">۷ گروه سمت</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تعداد افراد، میانگین درصد پیشرفت و میانگین امتیاز وزنی هر گروه (مدیران، معاونان آموزشی، معاونان پرورشی، دبیران، آموزگاران، معاونان اجرایی و سایر)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('ranking')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              رتبه‌بندی به تفکیک سمت ←
            </button>
            <button
              onClick={() => onNavigate('performance_report')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              گزارش مقایسه‌ای ←
            </button>
          </div>
        </div>

        {/* 7 Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {roleStats.map((r) => {
            const hasData = r.count > 0;
            return (
              <div
                key={r.id}
                onClick={() => onNavigate('employees')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  hasData
                    ? 'bg-slate-50/60 hover:bg-teal-50/40 border-slate-200 hover:border-teal-300 shadow-2xs'
                    : 'bg-slate-50/30 border-dashed border-slate-200 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                      {r.label}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      hasData ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {toPersianDigits(r.count)} نفر
                    </span>
                  </div>

                  {hasData ? (
                    <div className="space-y-2 mt-2">
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500 font-medium">میانگین پیشرفت:</span>
                          <span className="font-mono font-black text-emerald-600">%{toPersianDigits(r.avgProgress)}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${r.avgProgress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>میانگین امتیاز:</span>
                        <span className="font-mono font-bold text-amber-700">{toPersianDigits(r.avgScore)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-center text-[11px] text-slate-400">
                      داده‌ای ثبت نشده
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 text-[10px] text-slate-400 group-hover:text-teal-700 font-medium flex items-center justify-between border-t border-slate-100">
                  <span>مشاهده همکاران</span>
                  <span>←</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Charts & Rankings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Status Donut Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">نمودار وضعیت کلی اجرای برنامه‌ها</h3>
              <p className="text-xs text-slate-500">تحلیل تجمیعی تمام نیروها و مدارس منطقه</p>
            </div>
          </div>

          <div className="py-2">
            <PieChart
              done={overall.done}
              late={overall.late}
              notDone={overall.notDone}
              size={210}
              centerSubtitle="کل تکالیف محوله"
            />
          </div>

          <div className="w-full mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span>تعداد مدارس تحت پوشش: <strong>{toPersianDigits(schools.length)}</strong> آموزشگاه</span>
            <button
              onClick={() => onNavigate('schools_report')}
              className="text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
            >
              مشاهده مدارس ←
            </button>
          </div>
        </div>

        {/* Top Performing Staff List (Ranked with Program Coefficients) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>همکاران برتر با بیشترین امتیاز وزنی مکتسبه</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  رتبه‌بندی با اعمال ضرایب ۱ تا ۳ برای هر طرح
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('ranking')}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>تابلوی رتبه‌بندی همکاران</span>
                </button>
                <button
                  onClick={() => onNavigate('performance_report')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
                >
                  جدول همکاران ←
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {rankedEmployees.map(({ emp, stats }, idx) => (
                <div
                  key={emp.id}
                  onClick={() => onSelectEmployee(emp)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : idx === 2
                          ? 'bg-amber-800/10 text-amber-900'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {toPersianDigits(idx + 1)}
                    </span>

                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md group-hover:bg-emerald-600 transition-colors">
                      {emp.code}
                    </span>

                    <div>
                      <div className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {emp.fullName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {emp.schoolName} | <span className="text-slate-400">{emp.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <div className="text-xs font-black text-amber-800 font-mono">
                        {toPersianDigits(stats.earnedWeightedScore)} امتیاز با ضریب
                      </div>
                      <div className="text-[11px] text-emerald-600 font-bold">
                        %{toPersianDigits(stats.progressPercent)} پیشرفت ({toPersianDigits(stats.done)} به‌موقع)
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <button
              onClick={onOpenNewEmployeeModal}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>ثبت همکار جدید</span>
            </button>

            <button
              onClick={onOpenNewProgramModal}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>تعریف برنامه جدید</span>
            </button>

            <button
              onClick={onOpenAssignModal}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-teal-600" />
              <span>اختصاص گروهی</span>
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>خروجی اکسل</span>
            </button>

            <button
              onClick={onOpenBackupModal}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 text-blue-600" />
              <span>پشتیبان و بازیابی</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
