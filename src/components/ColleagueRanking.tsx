import React, { useState, useMemo } from 'react';
import { Employee, EmployeeProgram, School, Program } from '../types';
import { calculateEmployeeStats } from '../utils/storage';
import { toPersianDigits } from '../utils/jalali';
import {
  Trophy,
  Medal,
  Award,
  Search,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Filter,
  Sparkles,
  Info,
  GraduationCap,
  Building,
  FileCode,
  Briefcase,
  Star,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { IsfahanArchBadge } from './IsfahanMotifs';

interface ColleagueRankingProps {
  employees: Employee[];
  employeePrograms: EmployeeProgram[];
  programs: Program[];
  schools: School[];
  onSelectEmployee: (emp: Employee) => void;
  onExportHtml?: () => void;
}

export type RankingSortBy = 'score' | 'totalDone' | 'onTime' | 'progressPercent';

export const ColleagueRanking: React.FC<ColleagueRankingProps> = ({
  employees,
  employeePrograms,
  programs,
  schools,
  onSelectEmployee,
  onExportHtml,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortBy, setSortBy] = useState<RankingSortBy>('score');
  const [selectedTier, setSelectedTier] = useState('all');

  const prgMap = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);

  // Compute stats and scores for each employee
  // CRITICAL: Each general program has coefficient 1, 2, or 3.
  // Done on-time = 100 * coefficient
  // Done late = 60 * coefficient
  // Exclusive (اختصاصی) programs do not add score
  const colleaguesRanked = useMemo(() => {
    return employees.map((emp) => {
      const empAssignments = employeePrograms.filter((ep) => ep.employeeId === emp.id);

      // Separate assignments: general (همگانی) vs specific (اختصاصی)
      const generalAssignments = empAssignments.filter((ep) => {
        const prg = prgMap.get(ep.programId);
        return !prg || prg.scope !== 'اختصاصی'; // defaults to 'همگانی'
      });

      const specificAssignments = empAssignments.filter((ep) => {
        const prg = prgMap.get(ep.programId);
        return prg?.scope === 'اختصاصی';
      });

      const gTotal = generalAssignments.length;
      const gDone = generalAssignments.filter((a) => a.status === 'done').length;
      const gLate = generalAssignments.filter((a) => a.status === 'late').length;
      const gNotDone = generalAssignments.filter((a) => a.status === 'not_done').length;
      const gProgressPercent = gTotal > 0 ? Math.round(((gDone + gLate) / gTotal) * 100) : 0;
      const gOnTimePercent = gTotal > 0 ? Math.round((gDone / gTotal) * 100) : 0;

      // Calculate weighted score factoring in program coefficients (1 to 3)
      let weightedPossible = 0;
      let earnedScore = 0;
      let totalCoefficients = 0;

      for (const a of generalAssignments) {
        const prg = prgMap.get(a.programId);
        const coeff = (prg?.coefficient && [1, 2, 3].includes(prg.coefficient)) ? prg.coefficient : 1;
        totalCoefficients += coeff;
        weightedPossible += coeff * 100;

        if (a.status === 'done') {
          earnedScore += coeff * 100;
        } else if (a.status === 'late') {
          earnedScore += coeff * 60;
        }
      }

      const weightedProgressPercent =
        weightedPossible > 0 ? Number(((earnedScore / weightedPossible) * 100).toFixed(1)) : 0;

      const stats = {
        total: gTotal,
        done: gDone,
        late: gLate,
        notDone: gNotDone,
        progressPercent: gProgressPercent,
        onTimePercent: gOnTimePercent,
        totalCoefficients,
        weightedPossible,
        earnedWeightedScore: earnedScore,
        weightedProgressPercent,
      };

      const score = earnedScore;
      const totalCompleted = stats.done + stats.late;

      // Assign Tier based on weighted score and progress
      let tier: 'ممتاز' | 'بسیار خوب' | 'خوب' | 'نیازمند پیگیری';
      let tierColor: string;
      if (score >= 600 || (stats.total > 0 && stats.progressPercent >= 85)) {
        tier = 'ممتاز';
        tierColor = 'bg-amber-100 text-amber-800 border-amber-300';
      } else if (score >= 350 || (stats.total > 0 && stats.progressPercent >= 65)) {
        tier = 'بسیار خوب';
        tierColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      } else if (score >= 150 || (stats.total > 0 && stats.progressPercent >= 40)) {
        tier = 'خوب';
        tierColor = 'bg-blue-100 text-blue-800 border-blue-300';
      } else {
        tier = 'نیازمند پیگیری';
        tierColor = 'bg-rose-100 text-rose-800 border-rose-300';
      }

      return {
        emp,
        stats,
        score,
        totalCompleted,
        totalCoefficients,
        specificCount: specificAssignments.length,
        specificDone: specificAssignments.filter((a) => a.status === 'done' || a.status === 'late').length,
        tier,
        tierColor,
      };
    });
  }, [employees, employeePrograms, prgMap]);

  // Filtered and Sorted list
  const filteredAndSorted = useMemo(() => {
    return colleaguesRanked
      .filter((item) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const match =
            item.emp.fullName.toLowerCase().includes(q) ||
            item.emp.code.includes(q) ||
            item.emp.schoolName.toLowerCase().includes(q) ||
            item.emp.role.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Grade filter
        if (selectedGrade !== 'all' && item.emp.grade !== selectedGrade) {
          return false;
        }

        // School filter
        if (selectedSchool !== 'all' && item.emp.schoolId !== selectedSchool) {
          return false;
        }

        // Role filter
        if (selectedRole !== 'all') {
          if (selectedRole === 'سایر') {
            const coreSix = new Set(['مدیر', 'معاون آموزشی', 'معاون پرورشی', 'دبیر', 'آموزگار', 'معاون اجرایی']);
            const isStandard = coreSix.has(item.emp.role) || item.emp.role.startsWith('معاون پرورشی');
            if (isStandard && item.emp.role !== 'سایر') return false;
          } else if (selectedRole === 'معاون پرورشی') {
            if (item.emp.role !== 'معاون پرورشی' && !item.emp.role.includes('معاون پرورشی')) return false;
          } else if (item.emp.role !== selectedRole) {
            return false;
          }
        }

        // Tier filter
        if (selectedTier !== 'all' && item.tier !== selectedTier) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          if (b.score !== a.score) return b.score - a.score;
          if (b.totalCompleted !== a.totalCompleted) return b.totalCompleted - a.totalCompleted;
          return b.stats.onTimePercent - a.stats.onTimePercent;
        }
        if (sortBy === 'totalDone') {
          if (b.totalCompleted !== a.totalCompleted) return b.totalCompleted - a.totalCompleted;
          if (b.stats.done !== a.stats.done) return b.stats.done - a.stats.done;
          return b.score - a.score;
        }
        if (sortBy === 'onTime') {
          if (b.stats.done !== a.stats.done) return b.stats.done - a.stats.done;
          return b.stats.onTimePercent - a.stats.onTimePercent;
        }
        if (sortBy === 'progressPercent') {
          if (b.stats.progressPercent !== a.stats.progressPercent)
            return b.stats.progressPercent - a.stats.progressPercent;
          return b.score - a.score;
        }
        return 0;
      });
  }, [colleaguesRanked, searchQuery, selectedGrade, selectedSchool, selectedRole, selectedTier, sortBy]);

  // Overall statistics for banner
  const overallStats = useMemo(() => {
    const totalStaff = colleaguesRanked.length;
    const totalScore = colleaguesRanked.reduce((acc, c) => acc + c.score, 0);
    const avgScore = totalStaff > 0 ? Math.round(totalScore / totalStaff) : 0;
    const totalActivitiesDone = colleaguesRanked.reduce((acc, c) => acc + c.totalCompleted, 0);
    const totalActivitiesAssigned = colleaguesRanked.reduce((acc, c) => acc + c.stats.total, 0);
    const overallProgress =
      totalActivitiesAssigned > 0
        ? Math.round((totalActivitiesDone / totalActivitiesAssigned) * 100)
        : 0;

    const topColleague = filteredAndSorted.length > 0 ? filteredAndSorted[0] : null;

    return {
      totalStaff,
      avgScore,
      totalActivitiesDone,
      overallProgress,
      topColleague,
    };
  }, [colleaguesRanked, filteredAndSorted]);

  // Export ranking table to Excel
  const handleExportRankingExcel = () => {
    const wb = XLSX.utils.book_new();
    const headers = [
      'رتبه',
      'کد همکار',
      'نام و نام خانوادگی',
      'آموزشگاه',
      'مقطع تحصیلی',
      'سمت',
      'طرح‌های همگانی',
      'مجموع ضرایب طرح‌ها',
      'طرح‌های اختصاصی',
      'انجام شده به‌موقع',
      'دیر انجام شده',
      'انجام نشده',
      'درصد پیشرفت همگانی',
      'درصد اجرای به‌موقع',
      'امتیاز نهایی با ضریب (۱ تا ۳)',
      'سطح عملکرد',
    ];

    const dataRows = filteredAndSorted.map((item, index) => [
      index + 1,
      item.emp.code,
      item.emp.fullName,
      item.emp.schoolName,
      item.emp.grade,
      item.emp.role,
      item.stats.total,
      item.totalCoefficients,
      item.specificCount,
      item.stats.done,
      item.stats.late,
      item.stats.notDone,
      `${item.stats.progressPercent}%`,
      `${item.stats.onTimePercent}%`,
      item.score,
      item.tier,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 10 },
      { wch: 24 },
      { wch: 30 },
      { wch: 22 },
      { wch: 24 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 24 },
      { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'رتبه‌بندی همکاران');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `رتبه_بندی_همکاران_پرورشی_با_ضرایب_${dateStr}.xlsx`);
  };

  // Top 3 for podium
  const topThree = filteredAndSorted.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              <span>رتبه‌بندی و تابلوی افتخار همکاران پرورشی (محاسبه با ضریب طرح‌ها)</span>
            </h2>
            <IsfahanArchBadge title="ناحیه ۶ اصفهان" subtitle="مفاخر پرورشی" />
          </div>
          <p className="text-xs text-slate-500">
            امتیازبندی هوشمند با اعمال ضریب ۱ تا ۳ برای هر طرح پرورشی جهت اهمیت دادن به طرح‌های مهم
          </p>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>چاپ تابلوی رتبه‌بندی</span>
          </button>
          {onExportHtml && (
            <button
              onClick={onExportHtml}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              title="دریافت گزارش رتبه‌بندی و پرونده در قالب تک‌فایل HTML"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>خروجی HTML</span>
            </button>
          )}
          <button
            onClick={handleExportRankingExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>خروجی اکسل رتبه‌بندی</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Top Performer Card */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 p-5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-amber-800">پیشتاز رتبه‌بندی منطقه</span>
            <div className="text-base font-black text-slate-900 truncate">
              {overallStats.topColleague
                ? overallStats.topColleague.emp.fullName
                : '---'}
            </div>
            <div className="text-[11px] text-amber-900/80">
              {overallStats.topColleague
                ? `${toPersianDigits(overallStats.topColleague.score)} امتیاز وزنی | کد ${overallStats.topColleague.emp.code}`
                : 'بدون داده'}
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500">میانگین امتیاز وزنی منطقه</span>
            <div className="text-2xl font-black text-slate-800 font-mono">
              {toPersianDigits(overallStats.avgScore)}
            </div>
            <div className="text-[11px] text-slate-400">با اعمال ضرایب ۱ تا ۳ طرح‌ها</div>
          </div>
        </div>

        {/* Total Activities Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500">فعالیت‌های اجرا شده</span>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {toPersianDigits(overallStats.totalActivitiesDone)}
            </div>
            <div className="text-[11px] text-slate-400">مجموع برنامه‌های انجام‌شده</div>
          </div>
        </div>

        {/* Overall Progress Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500">نرخ پیشرفت کل منطقه</span>
            <div className="text-2xl font-black text-teal-700 font-mono">
              %{toPersianDigits(overallStats.overallProgress)}
            </div>
            <div className="text-[11px] text-slate-400">نسبت تحقق به کل تکالیف</div>
          </div>
        </div>
      </div>

      {/* Podium - Top 3 Performers */}
      {topThree.length >= 3 && (
        <div className="bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>سکوی افتخار و پیشتازان پرورشی با احتساب ضرایب</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">سه رتبه برتر با بیشترین امتیاز وزنی مکتسبه</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto items-end pt-4">
            {/* Rank 2 (Silver) */}
            <div className="order-2 md:order-1 bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 flex items-center justify-center font-black text-xl shadow-lg mb-3 border-2 border-white/40">
                🥈
              </div>
              <span className="text-xs font-bold text-slate-400 mb-1">رتبه دوم منطقه</span>
              <h4 className="font-black text-base text-white">{topThree[1].emp.fullName}</h4>
              <span className="text-xs text-slate-400 mb-3">{topThree[1].emp.schoolName}</span>
              <div className="bg-slate-700/60 px-3 py-1.5 rounded-xl text-center w-full mb-3">
                <span className="text-xs text-slate-300">امتیاز وزنی: </span>
                <span className="text-base font-black text-amber-400 font-mono">
                  {toPersianDigits(topThree[1].score)}
                </span>
              </div>
              <div className="flex items-center justify-between w-full text-[11px] text-slate-400 border-t border-slate-700/80 pt-2 mb-3">
                <span>فعالیت‌های انجام شده:</span>
                <strong className="text-white font-mono">{toPersianDigits(topThree[1].totalCompleted)} طرح</strong>
              </div>
              <button
                onClick={() => onSelectEmployee(topThree[1].emp)}
                className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>مشاهده کارتابل (کد {topThree[1].emp.code})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rank 1 (Gold - Taller) */}
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/80 via-slate-800 to-slate-800 rounded-2xl p-6 border-2 border-amber-500/70 flex flex-col items-center text-center shadow-2xl relative md:-mt-6 transition-transform hover:-translate-y-1">
              <div className="absolute -top-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-3 py-0.5 rounded-full text-[11px] font-black shadow-md flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>رتبه اول منطقه</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-900 flex items-center justify-center font-black text-3xl shadow-xl mb-3 mt-1 border-2 border-yellow-100">
                🥇
              </div>
              <h4 className="font-black text-lg text-white">{topThree[0].emp.fullName}</h4>
              <span className="text-xs text-amber-200/80 mb-3">{topThree[0].emp.schoolName}</span>
              <div className="bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-xl text-center w-full mb-3">
                <span className="text-xs text-amber-200">امتیاز وزنی طلایی: </span>
                <span className="text-xl font-black text-amber-300 font-mono">
                  {toPersianDigits(topThree[0].score)}
                </span>
              </div>
              <div className="flex items-center justify-between w-full text-xs text-slate-300 border-t border-slate-700/80 pt-2 mb-3">
                <span>پیشرفت کامل:</span>
                <strong className="text-emerald-400 font-mono">%{toPersianDigits(topThree[0].stats.progressPercent)}</strong>
              </div>
              <button
                onClick={() => onSelectEmployee(topThree[0].emp)}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>ورود به کارتابل همکار ممتاز (کد {topThree[0].emp.code})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="order-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white flex items-center justify-center font-black text-xl shadow-lg mb-3 border-2 border-amber-300/40">
                🥉
              </div>
              <span className="text-xs font-bold text-slate-400 mb-1">رتبه سوم منطقه</span>
              <h4 className="font-black text-base text-white">{topThree[2].emp.fullName}</h4>
              <span className="text-xs text-slate-400 mb-3">{topThree[2].emp.schoolName}</span>
              <div className="bg-slate-700/60 px-3 py-1.5 rounded-xl text-center w-full mb-3">
                <span className="text-xs text-slate-300">امتیاز وزنی: </span>
                <span className="text-base font-black text-amber-400 font-mono">
                  {toPersianDigits(topThree[2].score)}
                </span>
              </div>
              <div className="flex items-center justify-between w-full text-[11px] text-slate-400 border-t border-slate-700/80 pt-2 mb-3">
                <span>فعالیت‌های انجام شده:</span>
                <strong className="text-white font-mono">{toPersianDigits(topThree[2].totalCompleted)} طرح</strong>
              </div>
              <button
                onClick={() => onSelectEmployee(topThree[2].emp)}
                className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>مشاهده کارتابل (کد {topThree[2].emp.code})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی همکار بر اساس نام، کد دو رقمی یا آموزشگاه..."
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0">مرتب‌سازی بر اساس:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as RankingSortBy)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
            >
              <option value="score">🏆 بیشترین امتیاز وزنی (با ضرایب ۱ تا ۳)</option>
              <option value="totalDone">✅ بیشترین تعداد فعالیت‌های انجام شده</option>
              <option value="onTime">🟢 بیشترین اجرای به‌موقع</option>
              <option value="progressPercent">📈 بالاترین درصد پیشرفت</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Grade filter */}
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-hidden"
            >
              <option value="all">تمامی مقاطع تحصیلی</option>
              <option value="ابتدایی دوره اول">ابتدایی دوره اول</option>
              <option value="ابتدایی دوره دوم">ابتدایی دوره دوم</option>
              <option value="متوسطه اول">متوسطه اول</option>
              <option value="متوسطه دوم نظری">متوسطه دوم نظری</option>
              <option value="هنرستان فنی و حرفه‌ای و کاردانش">هنرستان فنی و حرفه‌ای</option>
              <option value="مجتمع آموزشی و پرورشی">مجتمع آموزشی</option>
            </select>
          </div>

          {/* School filter */}
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-hidden max-w-xs truncate"
            >
              <option value="all">تمامی آموزشگاه‌ها</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-hidden"
            >
              <option value="all">تمامی سمت‌ها</option>
              <option value="مدیر">۱. مدیر</option>
              <option value="معاون آموزشی">۲. معاون آموزشی</option>
              <option value="معاون پرورشی">۳. معاون پرورشی</option>
              <option value="دبیر">۴. دبیر</option>
              <option value="آموزگار">۵. آموزگار</option>
              <option value="معاون اجرایی">۶. معاون اجرایی</option>
              <option value="سایر">۷. سایر سمت‌ها</option>
            </select>
          </div>

          {/* Tier filter */}
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-hidden"
            >
              <option value="all">تمامی سطوح ارزیابی</option>
              <option value="ممتاز">🌟 رتبه ممتاز</option>
              <option value="بسیار خوب">⭐ رتبه بسیار خوب</option>
              <option value="خوب">🔹 رتبه خوب</option>
              <option value="نیازمند پیگیری">⚠️ نیازمند پیگیری</option>
            </select>
          </div>

          <div className="mr-auto text-xs text-slate-500 font-medium">
            تعداد همکاران در این رتبه‌بندی: <strong>{toPersianDigits(filteredAndSorted.length)}</strong> نفر
          </div>
        </div>
      </div>

      {/* Policy banner explaining coefficient scoring */}
      <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-950 shadow-xs">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-bold text-amber-900">نحوه محاسبه امتیاز با ضرایب ۱ تا ۳ طرح‌ها: </span>
          <span>
            به منظور اهمیت دادن به طرح‌های کلیدی و اولویت‌دار، به هر طرح ضریب ۱ تا ۳ تعلق گرفته است. اجرای به‌موقع هر طرح معادل <strong>۱۰۰ × ضریب طرح</strong> و اجرای با تأخیر معادل <strong>۶۰ × ضریب طرح</strong> امتیاز دارد (طرح‌های ضریب ۳: ۳۰۰ یا ۱۸۰ امتیاز، طرح‌های ضریب ۲: ۲۰۰ یا ۱۲۰ امتیاز، و طرح‌های ضریب ۱: ۱۰۰ یا ۶۰ امتیاز).
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-16 text-center">رتبه</th>
                <th className="p-3.5 w-20 text-center">کد کارتابل</th>
                <th className="p-3.5">نام و مشخصات همکار</th>
                <th className="p-3.5">آموزشگاه و مقطع</th>
                <th className="p-3.5 text-center text-blue-800">طرح‌های همگانی</th>
                <th className="p-3.5 text-center text-amber-800">مجموع ضرایب</th>
                <th className="p-3.5 text-center text-purple-800">طرح‌های اختصاصی</th>
                <th className="p-3.5 text-center text-emerald-800">🟢 به‌موقع</th>
                <th className="p-3.5 text-center text-amber-800">🟠 دیرکرد</th>
                <th className="p-3.5 text-center text-rose-800">🔴 انجام نشده</th>
                <th className="p-3.5 text-center w-28">درصد پیشرفت</th>
                <th className="p-3.5 text-center">سطح عملکرد</th>
                <th className="p-3.5 text-center bg-amber-50/50 w-28">امتیاز نهایی با ضریب</th>
                <th className="p-3.5 text-center no-print">کارتابل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-12 text-center text-slate-400">
                    همکاری با معیارهای فیلتر یا جستجوی مورد نظر یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((item, idx) => {
                  const rank = idx + 1;
                  const isTopOne = rank === 1;
                  const isTopTwo = rank === 2;
                  const isTopThree = rank === 3;

                  return (
                    <tr
                      key={item.emp.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTopOne ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="p-3.5 text-center">
                        {isTopOne ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-black text-xs shadow-xs">
                            🥇 ۱
                          </span>
                        ) : isTopTwo ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs shadow-xs">
                            🥈 ۲
                          </span>
                        ) : isTopThree ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs shadow-xs">
                            🥉 ۳
                          </span>
                        ) : (
                          <span className="font-bold text-slate-500 font-mono text-xs">
                            {toPersianDigits(rank)}
                          </span>
                        )}
                      </td>

                      {/* 2-Digit Code */}
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-lg font-mono font-bold text-xs border border-slate-200">
                          {item.emp.code}
                        </span>
                      </td>

                      {/* Name & Role */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">{item.emp.fullName}</div>
                        <div className="text-[11px] text-slate-500">{item.emp.role}</div>
                      </td>

                      {/* School & Grade */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{item.emp.schoolName}</div>
                        <div className="text-[11px] text-slate-400">{item.emp.grade}</div>
                      </td>

                      {/* Total General Assigned */}
                      <td className="p-3.5 text-center font-bold text-blue-700 bg-blue-50/20">
                        {toPersianDigits(item.stats.total)}
                      </td>

                      {/* Sum of Coefficients */}
                      <td className="p-3.5 text-center font-bold text-amber-800 bg-amber-50/20">
                        <span className="inline-flex items-center gap-0.5">
                          <span>{toPersianDigits(item.totalCoefficients)}</span>
                          <span className="text-[10px] text-amber-600">ضریب</span>
                        </span>
                      </td>

                      {/* Specific Programs (No Score) */}
                      <td className="p-3.5 text-center">
                        {item.specificCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold text-[11px]" title={`${item.specificDone} انجام شده از ${item.specificCount} طرح اختصاصی (بدون تاثیر در امتیاز)`}>
                            ⭐ {toPersianDigits(item.specificCount)}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">۰</span>
                        )}
                      </td>

                      {/* Done on time */}
                      <td className="p-3.5 text-center font-bold text-emerald-600 bg-emerald-50/30">
                        {toPersianDigits(item.stats.done)}
                      </td>

                      {/* Done late */}
                      <td className="p-3.5 text-center font-bold text-amber-600 bg-amber-50/30">
                        {toPersianDigits(item.stats.late)}
                      </td>

                      {/* Not done */}
                      <td className="p-3.5 text-center font-bold text-rose-600 bg-rose-50/30">
                        {toPersianDigits(item.stats.notDone)}
                      </td>

                      {/* Progress Bar & Percentage */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-bold text-slate-700 text-xs">
                            %{toPersianDigits(item.stats.progressPercent)}
                          </span>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.stats.progressPercent >= 75
                                  ? 'bg-emerald-500'
                                  : item.stats.progressPercent >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${item.stats.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.tierColor}`}
                        >
                          {item.tier}
                        </span>
                      </td>

                      {/* Total Score with Coefficients */}
                      <td className="p-3.5 text-center bg-amber-50/50">
                        <div className="font-mono font-black text-amber-900 text-sm">
                          {toPersianDigits(item.score)}
                        </div>
                        <span className="text-[10px] text-amber-700 font-bold">با ضریب ۱ تا ۳</span>
                      </td>

                      {/* Cartable Action */}
                      <td className="p-3.5 text-center no-print">
                        <button
                          type="button"
                          onClick={() => onSelectEmployee(item.emp)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="ورود به کارتابل این همکار"
                        >
                          <span>کارتابل</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ranking Formula Explanation Card */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2 no-print">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>فرمول و شیوه محاسبه امتیازات و رتبه‌بندی بر اساس ضریب برنامه‌ها:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pr-2">
          <li>
            <strong className="text-emerald-700">اجرای به‌موقع طرح (🟢):</strong> هر فعالیت اجرا شده پیش از سررسید مهلت مقرر، دارای <strong>۱۰۰ × ضریب طرح</strong> امتیاز است (ضریب ۱: ۱۰۰ امتیاز | ضریب ۲: ۲۰۰ امتیاز | ضریب ۳: ۳۰۰ امتیاز).
          </li>
          <li>
            <strong className="text-amber-700">اجرای با تأخیر (🟠):</strong> فعالیت‌هایی که پس از موعد مقرر نهایی شده‌اند، دارای <strong>۶۰ × ضریب طرح</strong> امتیاز هستند (ضریب ۱: ۶۰ امتیاز | ضریب ۲: ۱۲۰ امتیاز | ضریب ۳: ۱۸۰ امتیاز).
          </li>
          <li>
            <strong className="text-rose-700">فعالیت‌های انجام نشده (🔴):</strong> فاقد امتیاز (۰) هستند.
          </li>
          <li>
            در صورت تساوی امتیاز، اولویت با همکاری است که <strong>تعداد کل فعالیت‌های تکمیل‌شده</strong> و <strong>درصد اجرای به‌موقع</strong> بالاتری دارد.
          </li>
        </ul>
      </div>
    </div>
  );
};
