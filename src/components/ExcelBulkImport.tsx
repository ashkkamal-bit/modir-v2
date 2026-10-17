import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  AppDatabase,
  Employee,
  Program,
  EmployeeProgram,
  ExecutionStatus,
  STANDARD_ROLES,
  StandardStaffRole,
} from '../types';
import { normalizePersianText } from '../utils/storage';
import { toPersianDigits, getCurrentJalaliDate, updateJalaliDateToCurrentYear } from '../utils/jalali';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Download,
  Check,
  X,
  RefreshCw,
  Layers,
  ArrowRight,
  UserCheck,
  UserX,
  FileQuestion,
  Info,
} from 'lucide-react';

interface ExcelBulkImportProps {
  db: AppDatabase;
  onUpdateDatabase: (newDb: AppDatabase) => void;
  onNavigateToTab?: (tab: string) => void;
}

interface ParsedRow {
  rowIdx: number;
  schoolCode: string;
  schoolName: string;
  personnelCode: string;
  employeeCode: string;
  fullName: string;
  role: string;
  programTitle: string;
  programCode: string;
  statusText: string;
  executionDate: string;
  notes: string;
  // Resolved matching
  matchedEmployee?: Employee;
  matchedProgram?: Program;
  resolvedStatus: ExecutionStatus;
  statusMatchReason: string;
  isDuplicate: boolean;
  isAmbiguous: boolean;
  matchType: 'personnel_code' | 'emp_code' | 'name' | 'unmatched';
}

export const ExcelBulkImport: React.FC<ExcelBulkImportProps> = ({
  db,
  onUpdateDatabase,
  onNavigateToTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<any[][]>([]);

  const [importMode, setImportMode] = useState<'completed_only' | 'full_scope'>('completed_only');
  const [targetProgramId, setTargetProgramId] = useState<string>(
    db.programs[0]?.id || '',
  );

  const [columnMap, setColumnMap] = useState<{
    personnelCode: string;
    employeeCode: string;
    fullName: string;
    schoolCode: string;
    schoolName: string;
    role: string;
    programTitle: string;
    status: string;
    date: string;
    notes: string;
  }>({
    personnelCode: '',
    employeeCode: '',
    fullName: '',
    schoolCode: '',
    schoolName: '',
    role: '',
    programTitle: '',
    status: '',
    date: '',
    notes: '',
  });

  const [updateRolesFromExcel, setUpdateRolesFromExcel] = useState(true);
  const [autoMarkUnlistedAsNotDone, setAutoMarkUnlistedAsNotDone] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    totalRows: number;
    matchedCount: number;
    updatedAssignmentsCount: number;
    createdAssignmentsCount: number;
    updatedRolesCount: number;
    unmatchedCount: number;
    duplicatesCount: number;
    message: string;
  } | null>(null);

  const autoDetectColumns = (headers: string[]) => {
    const map = {
      personnelCode: '',
      employeeCode: '',
      fullName: '',
      schoolCode: '',
      schoolName: '',
      role: '',
      programTitle: '',
      status: '',
      date: '',
      notes: '',
    };

    headers.forEach((h) => {
      const norm = normalizePersianText(h);
      if (norm.includes('پرسنلی') || norm.includes('شناسه') || norm.includes('کد ملی') || norm.includes('id')) {
        map.personnelCode = h;
      } else if ((norm.includes('کد') && norm.includes('همکار')) || norm === 'کد' || norm.includes('کد دو رقمی')) {
        map.employeeCode = h;
      } else if (norm.includes('نام') && (norm.includes('خانوادگی') || norm.includes('همکار') || norm.includes('فرد') || norm === 'نام')) {
        map.fullName = h;
      } else if (norm.includes('کد') && (norm.includes('مدرسه') || norm.includes('آموزشگاه'))) {
        map.schoolCode = h;
      } else if (norm.includes('نام') && (norm.includes('مدرسه') || norm.includes('آموزشگاه'))) {
        map.schoolName = h;
      } else if (norm.includes('سمت') || norm.includes('پست') || norm.includes('نقش') || norm.includes('شغل')) {
        map.role = h;
      } else if (norm.includes('طرح') || norm.includes('برنامه') || norm.includes('فعالیت') || norm.includes('عنوان')) {
        map.programTitle = h;
      } else if (norm.includes('وضعیت') || norm.includes('نتیجه') || norm.includes('اجرا')) {
        map.status = h;
      } else if (norm.includes('تاریخ') || norm.includes('مهلت') || norm.includes('زمان')) {
        map.date = h;
      } else if (norm.includes('توضیح') || norm.includes('یادداشت') || norm.includes('مستند')) {
        map.notes = h;
      }
    });

    return map;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setExecutionResult(null);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);

        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0];
          setSelectedSheet(firstSheet);
          processSheet(wb, firstSheet);
        }
      } catch (err: any) {
        alert('خطا در خواندن فایل اکسل: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const processSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (json.length === 0) {
      alert('کاربرگ انتخابی خالی است.');
      return;
    }

    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(json.length, 5); i++) {
      if (json[i].some((cell) => cell !== '')) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = json[headerRowIdx].map((c: any) => String(c || '').trim());
    const dataRows = json.slice(headerRowIdx + 1).filter((r) => r.some((c: any) => c !== ''));

    setRawHeaders(headers);
    setRawDataRows(dataRows);

    const detected = autoDetectColumns(headers);
    setColumnMap(detected);
  };

  const handleSheetChange = (newSheet: string) => {
    setSelectedSheet(newSheet);
    if (workbook) {
      processSheet(workbook, newSheet);
    }
  };

  const analyzeAndPreview = () => {
    if (rawDataRows.length === 0) return;
    setIsProcessing(true);

    const normEmployees = db.employees.map((e) => ({
      ...e,
      normName: normalizePersianText(e.fullName),
      normCode: String(e.code || '').trim(),
      normPersonnel: normalizePersianText(e.personnelCode || ''),
    }));

    const normPrograms = db.programs.map((p) => ({
      ...p,
      normTitle: normalizePersianText(p.title),
      normCode: normalizePersianText(p.code),
    }));

    const rows: ParsedRow[] = [];
    const seenKeys = new Set<string>();

    rawDataRows.forEach((rawRow, idx) => {
      const getVal = (colName: string) => {
        if (!colName) return '';
        const colIdx = rawHeaders.indexOf(colName);
        return colIdx !== -1 ? String(rawRow[colIdx] || '').trim() : '';
      };

      const pCode = getVal(columnMap.personnelCode);
      const eCode = getVal(columnMap.employeeCode);
      const name = getVal(columnMap.fullName);
      const sCode = getVal(columnMap.schoolCode);
      const sName = getVal(columnMap.schoolName);
      const role = getVal(columnMap.role);
      const prgTitle = getVal(columnMap.programTitle);
      const statusText = getVal(columnMap.status);
      const date = getVal(columnMap.date);
      const notes = getVal(columnMap.notes);

      if (!pCode && !eCode && !name) {
        return;
      }

      let matchedEmp: Employee | undefined = undefined;
      let matchType: 'personnel_code' | 'emp_code' | 'name' | 'unmatched' = 'unmatched';

      if (pCode) {
        const normP = normalizePersianText(pCode);
        matchedEmp = normEmployees.find(
          (e) => e.normPersonnel === normP || e.normPersonnel.endsWith(normP),
        );
        if (matchedEmp) matchType = 'personnel_code';
      }

      if (!matchedEmp && eCode) {
        const padded = eCode.length === 1 ? '0' + eCode : eCode;
        matchedEmp = normEmployees.find((e) => e.normCode === padded || e.normCode === eCode);
        if (matchedEmp) matchType = 'emp_code';
      }

      if (!matchedEmp && name) {
        const normInputName = normalizePersianText(name);
        const exactMatches = normEmployees.filter((e) => e.normName === normInputName);
        if (exactMatches.length === 1) {
          matchedEmp = exactMatches[0];
          matchType = 'name';
        } else if (exactMatches.length > 1) {
          if (sName) {
            const normSch = normalizePersianText(sName);
            matchedEmp = exactMatches.find((e) => normalizePersianText(e.schoolName).includes(normSch));
            if (matchedEmp) matchType = 'name';
          }
          if (!matchedEmp) {
            matchedEmp = exactMatches[0];
            matchType = 'name';
          }
        } else {
          const candidateMatches = normEmployees.filter(
            (e) => normInputName.length > 5 && (e.normName.includes(normInputName) || normInputName.includes(e.normName)),
          );
          if (candidateMatches.length === 1) {
            matchedEmp = candidateMatches[0];
            matchType = 'name';
          }
        }
      }

      let matchedPrg: Program | undefined = undefined;
      if (prgTitle) {
        const normPrgInput = normalizePersianText(prgTitle);
        matchedPrg = normPrograms.find(
          (p) =>
            p.normTitle === normPrgInput ||
            p.normCode === normPrgInput ||
            p.normTitle.includes(normPrgInput) ||
            normPrgInput.includes(p.normTitle),
        );
      }
      if (!matchedPrg && targetProgramId) {
        matchedPrg = db.programs.find((p) => p.id === targetProgramId);
      }

      let resolvedStatus: ExecutionStatus = 'done';
      let statusMatchReason = 'انجام شده بر اساس فایل';

      const normStat = normalizePersianText(statusText);
      if (normStat.includes('دیر') || normStat.includes('تاخیر') || normStat.includes('late')) {
        resolvedStatus = 'late';
        statusMatchReason = 'دیر انجام شده با تاخیر';
      } else if (
        normStat.includes('عدم') ||
        normStat.includes('نشده') ||
        normStat.includes('خیر') ||
        normStat.includes('منفی') ||
        normStat.includes('not')
      ) {
        resolvedStatus = 'not_done';
        statusMatchReason = 'انجام نشده';
      } else if (
        normStat.includes('بله') ||
        normStat.includes('شد') ||
        normStat.includes('انجام') ||
        normStat.includes('موفق') ||
        normStat.includes('کامل') ||
        normStat.includes('done') ||
        !statusText
      ) {
        resolvedStatus = 'done';
        statusMatchReason = 'انجام شده در موعد مقرر';
      }

      const dedupeKey = `${matchedEmp?.id || name}_${matchedPrg?.id || prgTitle}`;
      const isDuplicate = seenKeys.has(dedupeKey);
      seenKeys.add(dedupeKey);

      rows.push({
        rowIdx: idx + 2,
        schoolCode: sCode,
        schoolName: sName,
        personnelCode: pCode,
        employeeCode: eCode,
        fullName: name,
        role,
        programTitle: prgTitle,
        programCode: matchedPrg?.code || '',
        statusText,
        executionDate: date ? updateJalaliDateToCurrentYear(date) : getCurrentJalaliDate(),
        notes,
        matchedEmployee: matchedEmp,
        matchedProgram: matchedPrg,
        resolvedStatus,
        statusMatchReason,
        isDuplicate,
        isAmbiguous: !matchedEmp && Boolean(name),
        matchType,
      });
    });

    setParsedRows(rows);
    setIsProcessing(false);
  };

  const handleCommitImport = () => {
    if (parsedRows.length === 0) return;

    const matchedItems = parsedRows.filter((r) => r.matchedEmployee && r.matchedProgram && !r.isDuplicate);
    if (matchedItems.length === 0) {
      alert('هیچ ردیف معتبر و منطبقی برای ثبت یافت نشد. لطفاً نگاشت ستون‌ها را بررسی فرمایید.');
      return;
    }

    const confirmMsg =
      importMode === 'completed_only'
        ? `آیا از ثبت قطعی ${toPersianDigits(matchedItems.length)} تکلیف شناسایی‌شده در سامانه اطمینان دارید؟ (وضعیت سایر همکاران دست‌نخورده باقی می‌ماند)`
        : `آیا از تکمیل وضعیت ${toPersianDigits(matchedItems.length)} تکلیف مشمول و اعمال تغییرات اطمینان دارید؟`;

    if (!window.confirm(confirmMsg)) return;

    let updatedEmployees = [...db.employees];
    let updatedEmployeePrograms = [...db.employeePrograms];
    let updatedRolesCount = 0;
    let updatedAssignmentsCount = 0;
    let createdAssignmentsCount = 0;

    matchedItems.forEach((row) => {
      const emp = row.matchedEmployee!;
      const prg = row.matchedProgram!;

      if (updateRolesFromExcel && row.role) {
        const normRoleInput = row.role.trim();
        const matchedStd = STANDARD_ROLES.find(
          (sr) => sr === normRoleInput || normalizePersianText(sr) === normalizePersianText(normRoleInput),
        );
        const finalRole: StandardStaffRole | string = matchedStd || normRoleInput;

        const empIdx = updatedEmployees.findIndex((e) => e.id === emp.id);
        if (empIdx !== -1 && updatedEmployees[empIdx].role !== finalRole) {
          updatedEmployees[empIdx] = {
            ...updatedEmployees[empIdx],
            role: finalRole,
            customRoleTitle: !matchedStd ? normRoleInput : undefined,
          };
          updatedRolesCount++;
        }
      }

      const existingAssignIdx = updatedEmployeePrograms.findIndex(
        (ep) => ep.employeeId === emp.id && ep.programId === prg.id,
      );

      if (existingAssignIdx !== -1) {
        updatedEmployeePrograms[existingAssignIdx] = {
          ...updatedEmployeePrograms[existingAssignIdx],
          status: row.resolvedStatus,
          actualDate: row.executionDate || updatedEmployeePrograms[existingAssignIdx].actualDate || getCurrentJalaliDate(),
          executionDate: row.executionDate || updatedEmployeePrograms[existingAssignIdx].executionDate || getCurrentJalaliDate(),
          notes: row.notes ? `${updatedEmployeePrograms[existingAssignIdx].notes || ''} | ${row.notes}`.trim() : updatedEmployeePrograms[existingAssignIdx].notes,
          updatedAt: getCurrentJalaliDate(),
        };
        updatedAssignmentsCount++;
      } else {
        updatedEmployeePrograms.push({
          id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          employeeId: emp.id,
          employeeCode: emp.code,
          programId: prg.id,
          status: row.resolvedStatus,
          isManualOverride: false,
          actualDate: row.executionDate || getCurrentJalaliDate(),
          executionDate: row.executionDate || getCurrentJalaliDate(),
          notes: row.notes || 'ثبت خودکار از طریق ورود گروهی اکسل',
          updatedAt: getCurrentJalaliDate(),
        });
        createdAssignmentsCount++;
      }
    });

    if (importMode === 'full_scope' && autoMarkUnlistedAsNotDone && targetProgramId) {
      const targetPrg = db.programs.find((p) => p.id === targetProgramId);
      if (targetPrg) {
        const matchedEmpIds = new Set(matchedItems.map((r) => r.matchedEmployee!.id));
        updatedEmployees.forEach((emp) => {
          if (!matchedEmpIds.has(emp.id)) {
            const assignIdx = updatedEmployeePrograms.findIndex(
              (ep) => ep.employeeId === emp.id && ep.programId === targetPrg.id,
            );
            if (assignIdx !== -1) {
              if (updatedEmployeePrograms[assignIdx].status !== 'not_done') {
                updatedEmployeePrograms[assignIdx] = {
                  ...updatedEmployeePrograms[assignIdx],
                  status: 'not_done',
                  notes: 'تعیین عدم اجرا بر اساس فایل اکسل ارسالی',
                  updatedAt: getCurrentJalaliDate(),
                };
                updatedAssignmentsCount++;
              }
            } else {
              updatedEmployeePrograms.push({
                id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                employeeId: emp.id,
                employeeCode: emp.code,
                programId: targetPrg.id,
                status: 'not_done',
                isManualOverride: false,
                notes: 'ثبت عدم اجرا بر اساس فایل اکسل',
                updatedAt: getCurrentJalaliDate(),
              });
              createdAssignmentsCount++;
            }
          }
        });
      }
    }

    const newDb: AppDatabase = {
      ...db,
      employees: updatedEmployees,
      employeePrograms: updatedEmployeePrograms,
    };

    onUpdateDatabase(newDb);

    setExecutionResult({
      success: true,
      totalRows: parsedRows.length,
      matchedCount: matchedItems.length,
      updatedAssignmentsCount,
      createdAssignmentsCount,
      updatedRolesCount,
      unmatchedCount: parsedRows.filter((r) => !r.matchedEmployee).length,
      duplicatesCount: parsedRows.filter((r) => r.isDuplicate).length,
      message: `عملیات ورود گروهی با موفقیت کامل انجام شد. ${toPersianDigits(updatedAssignmentsCount + createdAssignmentsCount)} وضعیت با موفقیت در پایگاه داده ثبت و به‌روزرسانی شد.`,
    });
  };

  const handleDownloadSampleExcel = () => {
    const wb = XLSX.utils.book_new();

    const sampleHeaders = [
      'کد مدرسه',
      'نام مدرسه',
      'شناسه یا کد پرسنلی',
      'کد همکار',
      'نام و نام خانوادگی',
      'سمت سازمانی',
      'نام طرح یا برنامه',
      'وضعیت اجرا',
      'تاریخ اجرا',
      'توضیحات و مستندات',
    ];

    const sampleData = [
      sampleHeaders,
      [
        '101',
        'دبیرستان شهید بهشتی',
        '201001',
        '01',
        'حسین صادقی',
        'معاون پرورشی',
        'مسابقات قرآن، عترت و نماز (مرحله آموزشگاهی)',
        'انجام شده',
        `${getCurrentJalaliDate()}`,
        'برگزاری موفق مسابقات مرحله آموزشگاهی',
      ],
      [
        '102',
        'دبیرستان فرزانگان',
        '201002',
        '02',
        'زهره کریمی',
        'معاون پرورشی',
        'پویش ملی یاریگران زندگی و پیشگیری از آسیب‌های اجتماعی',
        'انجام شده',
        `${getCurrentJalaliDate()}`,
        'ارسال مستندات در سامانه ایتا',
      ],
      [
        '103',
        'دبستان انقلاب اسلامی',
        '201003',
        '03',
        'رضا مرادی',
        'آموزگار',
        'مسابقات قرآن، عترت و نماز (مرحله آموزشگاهی)',
        'دیر انجام شده',
        `${getCurrentJalaliDate()}`,
        'ارسال آثار با تاخیر ۲ روزه',
      ],
      [
        '104',
        'هنرستان فنی دخترانه کوثر',
        '201004',
        '04',
        'الهام سعیدی',
        'دبیر',
        'اجرای طرح پیوند مسجد، مدرسه و منزل (اقامه نماز جماعت)',
        'انجام شده',
        `${getCurrentJalaliDate()}`,
        'برگزاری مستمر نماز جماعت ظهر و عصر',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 12 },
      { wch: 28 },
      { wch: 18 },
      { wch: 10 },
      { wch: 24 },
      { wch: 18 },
      { wch: 42 },
      { wch: 16 },
      { wch: 14 },
      { wch: 38 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'الگوی ورود گروهی');
    XLSX.writeFile(wb, 'الگوی_ورود_گروهی_ارزشیابی_عملکرد_ناحیه۶.xlsx');
  };

  const handleExportErrorsExcel = () => {
    const errorRows = parsedRows.filter((r) => !r.matchedEmployee || r.isDuplicate);
    if (errorRows.length === 0) {
      alert('هیچ رکورد دارای خطا یا نامشخصی در این فایل وجود ندارد.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [
        'شماره سطر در فایل',
        'نام وارد شده',
        'کد پرسنلی',
        'کد همکار',
        'مدرسه',
        'سمت',
        'طرح',
        'وضعیت خطا',
        'علت',
      ],
    ];

    errorRows.forEach((r) => {
      let errReason = 'همکاری با این مشخصات در سامانه یافت نشد';
      if (r.isDuplicate) errReason = 'رکورد تکراری در فایل';
      data.push([
        r.rowIdx,
        r.fullName || '---',
        r.personnelCode || '---',
        r.employeeCode || '---',
        r.schoolName || '---',
        r.role || '---',
        r.programTitle || '---',
        r.isDuplicate ? 'تکراری' : 'ناشناخته',
        errReason,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 16 },
      { wch: 24 },
      { wch: 18 },
      { wch: 12 },
      { wch: 28 },
      { wch: 18 },
      { wch: 32 },
      { wch: 16 },
      { wch: 38 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'موارد نیازمند بررسی');
    XLSX.writeFile(wb, 'گزارش_خطاهای_ورود_گروهی.xlsx');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
              📊 سامانه ارزشیابی عملکرد نیروهای آموزش و پرورش ناحیه ۶ اصفهان
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              ورود هوشمند اکسل
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-teal-600" />
            <span>ورود گروهی اطلاعات و وضعیت اجرای طرح‌ها از فایل Excel</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ثبت سریع وضعیت «انجام شده» و به‌روزرسانی سمت همکاران بدون نیاز به ثبت دستی تک‌تک افراد
          </p>
        </div>

        <button
          onClick={handleDownloadSampleExcel}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-300 shadow-xs"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>دانلود فایل نمونه Excel</span>
        </button>
      </div>

      {executionResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-3xl shadow-sm space-y-3 animate-fade-in">
          <div className="flex items-center gap-2.5 font-bold text-sm text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{executionResult.message}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">سطرهای بررسی‌شده:</span>
              <strong className="text-slate-800 font-mono text-sm">
                {toPersianDigits(executionResult.totalRows)} سطر
              </strong>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">ثبت‌های موفق و قطعی:</span>
              <strong className="text-emerald-700 font-mono text-sm">
                {toPersianDigits(executionResult.matchedCount)} نفر
              </strong>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">به‌روزرسانی سمت سازمانی:</span>
              <strong className="text-teal-700 font-mono text-sm">
                {toPersianDigits(executionResult.updatedRolesCount)} همکار
              </strong>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">موارد ناشناخته / خطا:</span>
              <strong className="text-rose-600 font-mono text-sm">
                {toPersianDigits(executionResult.unmatchedCount)} مورد
              </strong>
            </div>
          </div>
          {onNavigateToTab && (
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => onNavigateToTab('ranking')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                مشاهده تابلوی جدید رتبه‌بندی همکاران ↵
              </button>
              <button
                onClick={() => onNavigateToTab('schools_report')}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                مشاهده گزارش مدارس
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Upload File & Mode Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">
            ۱
          </span>
          <span>بارگذاری فایل اکسل (XLSX / XLS) و انتخاب حالت عملیات</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            onClick={() => setImportMode('completed_only')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              importMode === 'completed_only'
                ? 'bg-teal-50/80 border-teal-500 text-teal-950 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <input
              type="radio"
              name="importModeRadio"
              checked={importMode === 'completed_only'}
              onChange={() => setImportMode('completed_only')}
              className="mt-1 text-teal-600"
            />
            <div className="space-y-1">
              <div className="font-bold text-xs flex items-center gap-1.5">
                <span>حالت اول: ثبت انجام‌شدگان (پیش‌فرض)</span>
                <span className="bg-teal-200 text-teal-900 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  توصیه‌شده
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                فایل فقط شامل اسامی افرادی است که طرح را انجام داده‌اند. وضعیت این افراد به «انجام شده» تغییر می‌یابد و وضعیت بقیه همکاران سامانه دست‌نخورده باقی می‌ماند.
              </p>
            </div>
          </label>

          <label
            onClick={() => setImportMode('full_scope')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              importMode === 'full_scope'
                ? 'bg-amber-50/80 border-amber-500 text-amber-950 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <input
              type="radio"
              name="importModeRadio"
              checked={importMode === 'full_scope'}
              onChange={() => setImportMode('full_scope')}
              className="mt-1 text-amber-600"
            />
            <div className="space-y-1">
              <div className="font-bold text-xs">حالت دوم: تکمیل وضعیت تمام افراد مشمول</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                فایل برای تعیین وضعیت جامع تمام مشمولان است. ستون وضعیت مستقیماً خوانده شده و با تأیید صریح، افراد ثبت‌نشده می‌توانند «عدم اجرا» علامت‌گذاری شوند.
              </p>
            </div>
          </label>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all space-y-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
            <Upload className="w-6 h-6" />
          </div>
          <div className="font-bold text-sm text-slate-800">
            {fileName ? (
              <span className="text-teal-700">فایل انتخاب‌شده: {fileName}</span>
            ) : (
              <span>کلیک برای انتخاب فایل اکسل یا کشیدن و رها کردن (Drag & Drop)</span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            پشتیبانی کامل از پسوندهای XLSX و XLS با قابلیت شناسایی خودکار ستون‌ها و تبدیل تاریخ‌های شمسی
          </p>
        </div>

        {sheetNames.length > 1 && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <Layers className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="font-bold text-slate-700">انتخاب شیت اکسل:</span>
            <select
              value={selectedSheet}
              onChange={(e) => handleSheetChange(e.target.value)}
              className="p-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
            >
              {sheetNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="text-slate-400">
              ({toPersianDigits(rawDataRows.length)} سطر داده)
            </span>
          </div>
        )}
      </div>

      {rawHeaders.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">
                ۲
              </span>
              <span>تطبیق هوشمند ستون‌های فایل اکسل با مشخصات سامانه</span>
            </div>
            <button
              onClick={() => setColumnMap(autoDetectColumns(rawHeaders))}
              className="flex items-center gap-1.5 text-xs text-teal-700 hover:underline font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تشخیص مجدد خودکار ستون‌ها</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">
                کد پرسنلی / شناسه همکار (اولویت ۱ تطبیق):
              </label>
              <select
                value={columnMap.personnelCode}
                onChange={(e) => setColumnMap({ ...columnMap, personnelCode: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="">-- انتخاب ستون --</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">
                کد ۲ رقمی همکار در سامانه:
              </label>
              <select
                value={columnMap.employeeCode}
                onChange={(e) => setColumnMap({ ...columnMap, employeeCode: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="">-- انتخاب ستون --</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1">
              <label className="font-bold text-teal-900 block">
                نام و نام خانوادگی همکار (اولویت ۲): *
              </label>
              <select
                value={columnMap.fullName}
                onChange={(e) => setColumnMap({ ...columnMap, fullName: e.target.value })}
                className="w-full p-2 bg-white border border-teal-300 rounded-lg font-bold text-teal-950"
              >
                <option value="">-- انتخاب ستون --</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">نام آموزشگاه / مدرسه:</label>
              <select
                value={columnMap.schoolName}
                onChange={(e) => setColumnMap({ ...columnMap, schoolName: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="">-- بدون ستون مدرسه --</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">
                سمت سازمانی همکار (مدیر، معاون، آموزگار، ...):
              </label>
              <select
                value={columnMap.role}
                onChange={(e) => setColumnMap({ ...columnMap, role: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="">-- بدون ستون سمت سازمانی --</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">
                ستون نام طرح / برنامه (چندطرحی):
              </label>
              <select
                value={columnMap.programTitle}
                onChange={(e) => setColumnMap({ ...columnMap, programTitle: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="">-- فایل تک‌طرحی است (انتخاب دستی طرح زیر) --</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">ستون وضعیت اجرا:</label>
              <select
                value={columnMap.status}
                onChange={(e) => setColumnMap({ ...columnMap, status: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="">-- پیش‌فرض (انجام شده) --</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">ستون تاریخ اجرا:</label>
              <select
                value={columnMap.date}
                onChange={(e) => setColumnMap({ ...columnMap, date: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="">-- پیش‌فرض (تاریخ جاری) --</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block">ستون توضیحات / مستندات:</label>
              <select
                value={columnMap.notes}
                onChange={(e) => setColumnMap({ ...columnMap, notes: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="">-- بدون یادداشت --</option>
                {rawHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!columnMap.programTitle && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <strong className="text-teal-950 block">
                  طرح مورد نظر برای ثبت تکالیف این فایل:
                </strong>
                <span className="text-teal-800 text-[11px]">
                  چون فایل ستون طرح مجزا ندارد، وضعیت افراد برای طرح زیر ثبت خواهد شد:
                </span>
              </div>
              <select
                value={targetProgramId}
                onChange={(e) => setTargetProgramId(e.target.value)}
                className="p-2.5 bg-white border border-teal-300 rounded-xl font-bold text-slate-800 sm:w-80 shadow-xs"
              >
                {db.programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title} (ضریب {toPersianDigits(p.coefficient || 1)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-700 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={updateRolesFromExcel}
                onChange={(e) => setUpdateRolesFromExcel(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600"
              />
              <span>به‌روزرسانی خودکار سمت سازمانی همکار در صورت وجود در فایل</span>
            </label>

            {importMode === 'full_scope' && (
              <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
                <input
                  type="checkbox"
                  checked={autoMarkUnlistedAsNotDone}
                  onChange={(e) => setAutoMarkUnlistedAsNotDone(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span>ثبت خودکار «انجام نشده» برای همکاران مشمولی که نامشان در فایل نیست</span>
              </label>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={analyzeAndPreview}
              className="flex items-center gap-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <span>تحلیل فایل و پیش‌نمایش تطبیق‌ها</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {parsedRows.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                ۳
              </span>
              <span>پیش‌نمایش نتایج تطبیق و تأیید نهایی عملیات</span>
            </div>

            {parsedRows.some((r) => !r.matchedEmployee) && (
              <button
                onClick={handleExportErrorsExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود گزارش موارد ناشناخته (Excel)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-slate-500 block mb-1">کل ردیف‌های فایل:</span>
              <strong className="text-slate-900 font-mono text-base">
                {toPersianDigits(parsedRows.length)}
              </strong>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-emerald-800 block mb-1">همکاران شناسایی‌شده:</span>
              <strong className="text-emerald-700 font-mono text-base">
                {toPersianDigits(parsedRows.filter((r) => r.matchedEmployee && !r.isDuplicate).length)} نفر
              </strong>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
              <span className="text-rose-800 block mb-1">افراد ناشناخته در سامانه:</span>
              <strong className="text-rose-600 font-mono text-base">
                {toPersianDigits(parsedRows.filter((r) => !r.matchedEmployee).length)} مورد
              </strong>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-amber-800 block mb-1">ردیف‌های تکراری:</span>
              <strong className="text-amber-700 font-mono text-base">
                {toPersianDigits(parsedRows.filter((r) => r.isDuplicate).length)} سطر
              </strong>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-center w-12">سطر</th>
                    <th className="p-2.5">مشخصات در فایل</th>
                    <th className="p-2.5">همکار تطبیق‌یافته در سامانه</th>
                    <th className="p-2.5">سمت سازمانی</th>
                    <th className="p-2.5">طرح مشمول</th>
                    <th className="p-2.5 text-center">وضعیت اعمال</th>
                    <th className="p-2.5 text-center">نتیجه تطبیق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row) => {
                    const isMatched = Boolean(row.matchedEmployee);
                    return (
                      <tr
                        key={row.rowIdx}
                        className={`hover:bg-slate-50 transition-colors ${
                          !isMatched ? 'bg-rose-50/40' : row.isDuplicate ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center text-slate-400 font-mono font-bold">
                          {toPersianDigits(row.rowIdx)}
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-800">{row.fullName || '---'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            کد پرسنلی: {row.personnelCode || '---'} | کد: {row.employeeCode || '---'}
                          </div>
                        </td>
                        <td className="p-2.5">
                          {row.matchedEmployee ? (
                            <div>
                              <span className="font-bold text-emerald-800">
                                {row.matchedEmployee.fullName}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {row.matchedEmployee.schoolName} (کد {row.matchedEmployee.code})
                              </span>
                            </div>
                          ) : (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <UserX className="w-3.5 h-3.5" />
                              <span>عدم تطبیق در سامانه</span>
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {row.role ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold text-[10px]">
                              {row.role}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {row.matchedEmployee?.role || '---'}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <span className="font-medium text-slate-800">
                            {row.matchedProgram?.title || row.programTitle || '---'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          {row.resolvedStatus === 'done' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px]">
                              🟢 انجام شده
                            </span>
                          ) : row.resolvedStatus === 'late' ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px]">
                              🟠 با تاخیر
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px]">
                              🔴 انجام نشده
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.isDuplicate ? (
                            <span className="text-amber-700 text-[10px] font-bold">تکراری</span>
                          ) : isMatched ? (
                            <span className="text-emerald-700 text-[10px] font-bold flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>آماده ثبت</span>
                            </span>
                          ) : (
                            <span className="text-rose-600 text-[10px] font-bold">نامشخص</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              با تأیید نهایی، امتیازات وزنی و شاخص‌های رتبه‌بندی تمام همکاران و مدارس به صورت خودکار محاسبه و به‌روزرسانی خواهند شد.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setParsedRows([])}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                انصراف و اصلاح فایل
              </button>
              <button
                onClick={handleCommitImport}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تأیید و ثبت نهایی در سامانه</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
