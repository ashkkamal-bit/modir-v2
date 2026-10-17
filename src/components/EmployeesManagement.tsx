import React, { useState, useMemo } from 'react';
import { Employee, School, EducationalGrade, StaffRole } from '../types';
import { toPersianDigits } from '../utils/jalali';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Phone,
  Building,
  GraduationCap,
  Filter,
  X,
  RotateCcw,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  Briefcase,
  Hash,
} from 'lucide-react';

interface EmployeesManagementProps {
  employees: Employee[];
  schools: School[];
  onSelectEmployee: (emp: Employee) => void;
  onOpenNewModal: () => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
}

const GRADES_LIST: { id: string; label: string }[] = [
  { id: 'all', label: 'تمام مقاطع تحصیلی' },
  { id: 'ابتدایی دوره اول', label: 'ابتدایی دوره اول' },
  { id: 'ابتدایی دوره دوم', label: 'ابتدایی دوره دوم' },
  { id: 'متوسطه اول', label: 'متوسطه اول' },
  { id: 'متوسطه دوم نظری', label: 'متوسطه دوم نظری' },
  { id: 'هنرستان فنی و حرفه‌ای و کاردانش', label: 'هنرستان فنی و حرفه‌ای' },
  { id: 'مجتمع آموزشی و پرورشی', label: 'مجتمع آموزشی و پرورشی' },
];

const ROLES_LIST: { id: string; label: string }[] = [
  { id: 'all', label: 'تمام سمت‌ها' },
  { id: 'مدیر', label: '۱. مدیر' },
  { id: 'معاون آموزشی', label: '۲. معاون آموزشی' },
  { id: 'معاون پرورشی', label: '۳. معاون پرورشی' },
  { id: 'دبیر', label: '۴. دبیر' },
  { id: 'آموزگار', label: '۵. آموزگار' },
  { id: 'معاون اجرایی', label: '۶. معاون اجرایی' },
  { id: 'سایر', label: '۷. سایر سمت‌ها' },
];

function normalizeText(str?: string | null): string {
  if (!str) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let res = String(str).toLowerCase().trim();

  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i));
    res = res.replaceAll(arabicDigits[i], String(i));
  }

  res = res
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ة]/g, 'ه')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ');

  return res;
}

export const EmployeesManagement: React.FC<EmployeesManagementProps> = ({
  employees,
  schools,
  onSelectEmployee,
  onOpenNewModal,
  onEditEmployee,
  onDeleteEmployee,
}) => {
  const [generalSearch, setGeneralSearch] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'school'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const uniqueSchoolNames = useMemo(() => {
    const names = new Set<string>();
    schools.forEach((s) => s.name && names.add(s.name.trim()));
    employees.forEach((e) => e.schoolName && names.add(e.schoolName.trim()));
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [schools, employees]);

  const hasActiveFilters = useMemo(() => {
    return (
      generalSearch.trim() !== '' ||
      nameFilter.trim() !== '' ||
      codeFilter.trim() !== '' ||
      schoolFilter !== 'all' ||
      schoolSearchQuery.trim() !== '' ||
      gradeFilter !== 'all' ||
      roleFilter !== 'all'
    );
  }, [generalSearch, nameFilter, codeFilter, schoolFilter, schoolSearchQuery, gradeFilter, roleFilter]);

  const handleClearAllFilters = () => {
    setGeneralSearch('');
    setNameFilter('');
    setCodeFilter('');
    setSchoolFilter('all');
    setSchoolSearchQuery('');
    setGradeFilter('all');
    setRoleFilter('all');
  };

  const filteredEmployees = useMemo(() => {
    const normGeneral = normalizeText(generalSearch);
    const normName = normalizeText(nameFilter);
    const normCode = normalizeText(codeFilter);
    const normSchoolSearch = normalizeText(schoolSearchQuery);

    return employees.filter((emp) => {
      const empNormName = normalizeText(emp.fullName);
      const empNormCode = normalizeText(emp.code);
      const empNormPersonnel = normalizeText(emp.personnelCode || '');
      const empNormSchool = normalizeText(emp.schoolName);
      const empNormRole = normalizeText(emp.role);
      const empNormPhone = normalizeText(emp.phone);

      if (normGeneral) {
        const matchesGeneral =
          empNormName.includes(normGeneral) ||
          empNormCode.includes(normGeneral) ||
          empNormPersonnel.includes(normGeneral) ||
          empNormSchool.includes(normGeneral) ||
          empNormRole.includes(normGeneral) ||
          empNormPhone.includes(normGeneral);

        if (!matchesGeneral) return false;
      }

      if (normName && !empNormName.includes(normName)) {
        return false;
      }

      if (normCode) {
        const matchesCode =
          empNormCode.includes(normCode) ||
          empNormPersonnel.includes(normCode) ||
          normalizeText(toPersianDigits(emp.code)).includes(normCode);
        if (!matchesCode) return false;
      }

      if (schoolFilter !== 'all' && emp.schoolName !== schoolFilter) {
        return false;
      }

      if (normSchoolSearch && !empNormSchool.includes(normSchoolSearch)) {
        return false;
      }

      if (gradeFilter !== 'all' && emp.grade !== gradeFilter) {
        return false;
      }

      if (roleFilter !== 'all') {
        if (roleFilter === 'سایر') {
          const coreSix = new Set(['مدیر', 'معاون آموزشی', 'معاون پرورشی', 'دبیر', 'آموزگار', 'معاون اجرایی']);
          const isStandardRole = coreSix.has(emp.role) || emp.role.startsWith('معاون پرورشی');
          if (isStandardRole && emp.role !== 'سایر') return false;
        } else if (roleFilter === 'معاون پرورشی') {
          if (emp.role !== 'معاون پرورشی' && !emp.role.includes('معاون پرورشی')) return false;
        } else if (emp.role !== roleFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    employees,
    generalSearch,
    nameFilter,
    codeFilter,
    schoolFilter,
    schoolSearchQuery,
    gradeFilter,
    roleFilter,
  ]);

  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'code') {
        const codeA = parseInt(a.code, 10) || 0;
        const codeB = parseInt(b.code, 10) || 0;
        cmp = codeA - codeB;
      } else if (sortBy === 'name') {
        cmp = a.fullName.localeCompare(b.fullName, 'fa');
      } else if (sortBy === 'school') {
        cmp = a.schoolName.localeCompare(b.schoolName, 'fa');
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredEmployees, sortBy, sortOrder]);

  const toggleSort = (newSortBy: 'code' | 'name' | 'school') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg">
              ناحیه ۶ اصفهان
            </span>
            <span className="text-xs text-slate-500 font-medium">پرونده پرسنلی همکاران</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>مدیریت اطلاعات و پرونده همکاران پرورشی</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سامانه جستجوی هوشمند، فیلتر ترکیبی بر اساس نام، کد پرسنلی یا نام آموزشگاه و دسترسی سریع به کارتابل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>ثبت همکار جدید با کد اختصاصی</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-emerald-600 absolute right-3.5 top-3" />
            <input
              type="text"
              value={generalSearch}
              onChange={(e) => setGeneralSearch(e.target.value)}
              placeholder="جستجوی همه‌جانبه سریع (نام، کد پرسنلی، نام مدرسه، شماره تماس)..."
              className="w-full pr-10 pl-9 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all shadow-2xs font-medium"
            />
            {generalSearch && (
              <button
                onClick={() => setGeneralSearch('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
                title="پاک کردن"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                showAdvancedFilters
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>فیلترهای تفکیک‌شده هوشمند</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>

            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="نمایش کارتی"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="نمایش جدولی فشرده"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                title="پاک‌سازی تمام فیلترها"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">حذف فیلترها</span>
              </button>
            )}
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="p-4 bg-white border-b border-slate-100 space-y-3 animate-fade-in">
            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-emerald-600" />
              <span>فیلتر دقیق بر اساس مشخصات پرونده همکار:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-600" />
                  <span>نام یا نام خانوادگی:</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="مثال: کریمی، رضایی..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                  />
                  {nameFilter && (
                    <button
                      onClick={() => setNameFilter('')}
                      className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-emerald-600" />
                  <span>کد پرسنلی / ۲ رقمی:</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={codeFilter}
                    onChange={(e) => setCodeFilter(e.target.value)}
                    placeholder="مثال: 01، 27..."
                    dir="ltr"
                    className="w-full text-xs text-center font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                  />
                  {codeFilter && (
                    <button
                      onClick={() => setCodeFilter('')}
                      className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Building className="w-3 h-3 text-emerald-600" />
                  <span>نام آموزشگاه / مدرسه:</span>
                </label>
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden truncate"
                >
                  <option value="all">همه آموزشگاه‌ها ({uniqueSchoolNames.length} مدرسه)</option>
                  {uniqueSchoolNames.map((sName) => (
                    <option key={sName} value={sName}>
                      {sName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-emerald-600" />
                  <span>مقطع تحصیلی:</span>
                </label>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden truncate"
                >
                  {GRADES_LIST.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-emerald-600" />
                  <span>سمت سازمانی:</span>
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden truncate"
                >
                  {ROLES_LIST.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-3 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-medium">فیلترهای فعال:</span>

            {!hasActiveFilters && (
              <span className="text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                نمایش کامل (بدون فیلتر)
              </span>
            )}

            {nameFilter && (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-bold">
                نام: {nameFilter}
                <button onClick={() => setNameFilter('')} className="hover:text-emerald-950 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {codeFilter && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-lg font-bold font-mono">
                کد: {codeFilter}
                <button onClick={() => setCodeFilter('')} className="hover:text-blue-950 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {schoolFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-lg font-bold">
                آموزشگاه: {schoolFilter}
                <button onClick={() => setSchoolFilter('all')} className="hover:text-purple-950 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {generalSearch && (
              <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 px-2 py-0.5 rounded-lg font-bold">
                جستجو: «{generalSearch}»
                <button onClick={() => setGeneralSearch('')} className="hover:text-slate-950 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-600 font-medium">
              تعداد نتایج: <strong className="text-emerald-700 font-bold font-mono">{toPersianDigits(sortedEmployees.length)}</strong> از <strong className="text-slate-800 font-bold font-mono">{toPersianDigits(employees.length)}</strong> نفر
            </span>
          </div>
        </div>
      </div>

      {sortedEmployees.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              هیچ همکاری با معیارهای جستجو و فیلترهای انتخابی یافت نشد
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              لطفاً نام همکار، کد پرسنلی یا نام آموزشگاه وارد شده را بررسی کنید یا فیلترها را ریست نمایید.
            </p>
          </div>
          <button
            onClick={handleClearAllFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>پاک کردن فیلترها و نمایش تمام همکاران</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sm bg-slate-900 group-hover:bg-emerald-600 text-white px-3 py-1 rounded-xl transition-colors shadow-xs">
                      کد {emp.code}
                    </span>
                    {emp.personnelCode && emp.personnelCode !== emp.code && (
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200" title="کد پرسنلی">
                        پرسنلی: {emp.personnelCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditEmployee(emp)}
                      title="ویرایش مشخصات"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEmployee(emp.id)}
                      title="حذف همکار"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {emp.fullName}
                </h3>
                <p className="text-xs text-emerald-800 font-semibold mt-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-emerald-600" />
                  <span>{emp.role}</span>
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate" title={emp.schoolName}>
                      {emp.schoolName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">{emp.grade}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-1.5 font-mono text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span dir="ltr">{emp.phone}</span>
                    </div>
                  )}
                </div>

                {emp.notes && (
                  <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {emp.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectEmployee(emp)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <span>ورود به کارتابل همکار</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th
                    onClick={() => toggleSort('code')}
                    className="p-3 w-28 text-center cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>کد پرسنلی</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('name')}
                    className="p-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>نام و نام خانوادگی</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3">عنوان شغلی / سمت</th>
                  <th
                    onClick={() => toggleSort('school')}
                    className="p-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>آموزشگاه محل خدمت</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3">مقطع تحصیلی</th>
                  <th className="p-3 text-center w-28">شماره تماس</th>
                  <th className="p-3 text-center w-36">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedEmployees.map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-bold">
                      {toPersianDigits(idx + 1)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-lg text-xs">
                        {emp.code}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800 text-sm">{emp.fullName}</div>
                      {emp.notes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{emp.notes}</div>
                      )}
                    </td>
                    <td className="p-3 text-emerald-800 font-semibold">{emp.role}</td>
                    <td className="p-3 font-medium text-slate-700">{emp.schoolName}</td>
                    <td className="p-3 text-slate-500">{emp.grade}</td>
                    <td className="p-3 text-center font-mono text-slate-600" dir="ltr">
                      {emp.phone || '---'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectEmployee(emp)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          title="ورود به کارتابل همکار"
                        >
                          کارتابل
                        </button>
                        <button
                          onClick={() => onEditEmployee(emp)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEmployee(emp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
