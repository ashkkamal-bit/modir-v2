import React, { useState } from 'react';
import { Program, Employee, EmployeeProgram, ExecutionStatus } from '../types';
import { calculateProgramStats } from '../utils/storage';
import { toPersianDigits } from '../utils/jalali';
import { PieChart } from './PieChart';
import { StatusBadge } from './StatusBadge';
import { BookOpen, Printer, FileSpreadsheet, Users, Share2, Plus, Award, Star } from 'lucide-react';

interface ProgramPerformanceReportProps {
  programs: Program[];
  employees: Employee[];
  employeePrograms: EmployeeProgram[];
  onOpenNewProgramModal: () => void;
  onOpenAssignModal: (preselectedProgramId?: string) => void;
  onSelectEmployee: (emp: Employee) => void;
  onExportExcel: () => void;
  onUpdateStatus: (updated: Partial<EmployeeProgram> & { id: string }) => void;
}

export const ProgramPerformanceReport: React.FC<ProgramPerformanceReportProps> = ({
  programs,
  employees,
  employeePrograms,
  onOpenNewProgramModal,
  onOpenAssignModal,
  onSelectEmployee,
  onExportExcel,
  onUpdateStatus,
}) => {
  const [selectedProgramId, setSelectedProgramId] = useState<string>(programs[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const selectedProgram = programs.find((p) => p.id === selectedProgramId) || programs[0];
  const pStats = selectedProgram
    ? calculateProgramStats(selectedProgram.id, employeePrograms)
    : { totalAssigned: 0, done: 0, late: 0, notDone: 0, progressPercent: 0, onTimePercent: 0 };

  const coeff = selectedProgram?.coefficient || 1;

  // Assignments for this program
  const assignments = selectedProgram
    ? employeePrograms.filter((ep) => ep.programId === selectedProgram.id)
    : [];

  const empMap = new Map(employees.map((e) => [e.id, e]));

  const filteredAssignments = assignments.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>تحلیل و گزارش عملکرد به تفکیک برنامه و طرح</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده وضعیت اجرای هر طرح در سطح تمام مدارس و همکاران با اعمال ضریب امتیازی
          </p>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>چاپ گزارش</span>
          </button>
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>خروجی Excel</span>
          </button>
          <button
            onClick={onOpenNewProgramModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف برنامه جدید</span>
          </button>
        </div>
      </div>

      {/* Program Selector Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <label className="block text-xs font-bold text-slate-700 mb-2">
          طرح یا برنامه مورد نظر را انتخاب نمایید:
        </label>
        <select
          value={selectedProgramId}
          onChange={(e) => setSelectedProgramId(e.target.value)}
          className="w-full text-base font-bold p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.code}] {p.title} - ({p.axis}) | ضریب امتیازی: {toPersianDigits(p.coefficient || 1)}
            </option>
          ))}
        </select>
      </div>

      {selectedProgram && (
        <div className="space-y-6">
          {/* Program Overview & Stats Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Info Card */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg">
                      محور: {selectedProgram.axis}
                    </span>
                    <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>ضریب امتیازی: {toPersianDigits(coeff)}</span>
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate-500 font-bold">
                    کد: {selectedProgram.code}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedProgram.title}</h3>
                {selectedProgram.description && (
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {selectedProgram.description}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block">تاریخ شروع:</span>
                    <strong className="font-mono">{selectedProgram.startDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">مهلت نهایی:</span>
                    <strong className="font-mono text-rose-600">{selectedProgram.deadline}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ارزش به‌موقع / با تاخیر:</span>
                    <strong className="text-amber-800 font-mono">
                      {toPersianDigits(coeff * 100)} / {toPersianDigits(coeff * 60)} امتیاز
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تعداد افراد مشمول:</span>
                    <strong className="text-slate-800">
                      {toPersianDigits(pStats.totalAssigned)} همکار
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onOpenAssignModal(selectedProgram.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>اختصاص این برنامه به همکاران دیگر</span>
                </button>
                <div className="text-xs text-slate-500">
                  درصد تحقق برنامه: <strong className="text-emerald-700 text-sm">%{toPersianDigits(pStats.progressPercent)}</strong>
                </div>
              </div>
            </div>

            {/* Pie Chart Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
              <PieChart
                done={pStats.done}
                late={pStats.late}
                notDone={pStats.notDone}
                size={180}
                centerSubtitle="همکاران مشمول"
                title="نمودار وضعیت اجرای این طرح"
              />
            </div>
          </div>

          {/* Detailed List of Colleagues Assigned */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-bold text-slate-800 text-sm">
                لیست همکاران مشمول طرح «{selectedProgram.title}» ({toPersianDigits(assignments.length)} نفر)
              </h4>

              <div className="flex items-center gap-2 text-xs no-print">
                <span>فیلتر وضعیت:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-hidden"
                >
                  <option value="all">همه</option>
                  <option value="done">فقط انجام شده</option>
                  <option value="late">فقط دیر انجام شده</option>
                  <option value="not_done">فقط انجام نشده</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 w-20 text-center">کد همکار</th>
                    <th className="p-3">نام و نام خانوادگی</th>
                    <th className="p-3">آموزشگاه محل خدمت</th>
                    <th className="p-3 text-center">تاریخ اجرای طرح</th>
                    <th className="p-3 text-center">تاریخ ارسال مستندات</th>
                    <th className="p-3 text-center">محل ارسال</th>
                    <th className="p-3 text-center">وضعیت</th>
                    <th className="p-3 text-center">امتیاز کسب‌شده</th>
                    <th className="p-3">توضیحات و مستندات</th>
                    <th className="p-3 text-center no-print">ورود به کارتابل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        موردی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((a, idx) => {
                      const emp = empMap.get(a.employeeId);
                      if (!emp) return null;

                      const execDate = a.executionDate || a.actualDate;
                      const subDate = a.submissionDate || a.docSubmissionDate;
                      const platform = a.submissionPlatform || a.documentationPlatform;

                      const earnedScore =
                        a.status === 'done' ? coeff * 100 : a.status === 'late' ? coeff * 60 : 0;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-bold">
                            {toPersianDigits(idx + 1)}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono font-bold px-2 py-0.5 bg-slate-800 text-white rounded-md text-xs">
                              {emp.code}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              onClick={() => onSelectEmployee(emp)}
                              className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer text-sm"
                            >
                              {emp.fullName}
                            </span>
                            <span className="text-[11px] text-slate-400 block">{emp.role}</span>
                          </td>
                          <td className="p-3 text-slate-700">{emp.schoolName}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700">
                            {execDate || <span className="text-slate-300 font-normal">---</span>}
                          </td>
                          <td className="p-3 text-center font-mono font-medium text-slate-600">
                            {subDate || <span className="text-slate-300 font-normal">---</span>}
                          </td>
                          <td className="p-3 text-center">
                            {platform ? (
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                platform === 'ایتا' ? 'bg-amber-100 text-amber-800' :
                                platform === 'شاد' ? 'bg-sky-100 text-sky-800' :
                                platform === 'اتوماسیون' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {platform}
                              </span>
                            ) : (
                              <span className="text-slate-300">---</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <StatusBadge status={a.status} size="sm" />
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-amber-800">
                            {earnedScore > 0 ? `+${toPersianDigits(earnedScore)}` : '۰'}
                          </td>
                          <td className="p-3 text-slate-600">
                            {a.notes || a.documentationNotes ? (
                              <div>
                                {a.notes && <div>{a.notes}</div>}
                                {a.documentationNotes && (
                                  <div className="text-[10px] text-teal-700 bg-teal-50 px-1 py-0.5 rounded inline-block mt-0.5">
                                    {a.documentationNotes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">بدون یادداشت</span>
                            )}
                          </td>
                          <td className="p-3 text-center no-print">
                            <button
                              type="button"
                              onClick={() => onSelectEmployee(emp)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              کارتابل
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
        </div>
      )}
    </div>
  );
};
