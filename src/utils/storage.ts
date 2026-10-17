import { AppDatabase, EmployeeStats, EmployeeProgram, Employee, Program, SchoolStats } from '../types';
import { getInitialDatabase } from './sampleData';
import { getCurrentJalaliYear, updateJalaliDateToCurrentYear, toPersianDigits } from './jalali';

const STORAGE_KEY = 'parvareshi_app_db_v1';

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialDatabase();
      saveDatabase(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppDatabase;
    if (!parsed.employees || !parsed.programs || !parsed.employeePrograms) {
      const initial = getInitialDatabase();
      saveDatabase(initial);
      return initial;
    }

    const currentYear = getCurrentJalaliYear();

    // Normalize employeePrograms to have executionDate, submissionDate, and submissionPlatform,
    // and upgrade old 1403 dates to current year
    if (Array.isArray(parsed.employeePrograms)) {
      parsed.employeePrograms = parsed.employeePrograms.map((ep: any) => {
        let execDate = ep.executionDate || ep.actualDate || undefined;
        let subDate = ep.submissionDate || ep.docSubmissionDate || (ep.actualDate ? ep.actualDate : undefined);
        let platform = ep.submissionPlatform || ep.documentationPlatform || ep.docPlatform;
        if (!platform && (ep.status === 'done' || ep.status === 'late')) {
          platform = 'ایتا';
        }

        if (execDate) execDate = updateJalaliDateToCurrentYear(execDate);
        if (subDate) subDate = updateJalaliDateToCurrentYear(subDate);

        return {
          ...ep,
          actualDate: execDate,
          executionDate: execDate,
          submissionDate: subDate,
          docSubmissionDate: subDate,
          submissionPlatform: platform,
          documentationPlatform: platform,
        };
      });
    }

    // Normalize programs to update any 1403 deadlines/dates to current year and ensure scope, coefficient and the 5 valid axes
    if (Array.isArray(parsed.programs)) {
      parsed.programs = parsed.programs.map((p: any) => {
        const rawCoeff = Number(p.coefficient);
        const coeff = ([1, 2, 3].includes(rawCoeff)) ? (rawCoeff as 1 | 2 | 3) : 1;
        
        // Normalize axis to the 5 designated sections:
        let normalizedAxis = p.axis;
        const validAxes = ['پرورشی', 'آموزش ابتدایی', 'آموزش متوسطه اول', 'آموزش متوسطه دوم', 'تربیت بدنی'];
        if (!validAxes.includes(normalizedAxis)) {
          if (normalizedAxis === 'اردویی، کانون‌ها و اوقات فراغت') {
            normalizedAxis = 'تربیت بدنی';
          } else {
            normalizedAxis = 'پرورشی';
          }
        }

        return {
          ...p,
          axis: normalizedAxis,
          scope: p.scope === 'اختصاصی' ? 'اختصاصی' : 'همگانی',
          coefficient: coeff,
          startDate: p.startDate ? updateJalaliDateToCurrentYear(p.startDate) : p.startDate,
          deadline: p.deadline ? updateJalaliDateToCurrentYear(p.deadline) : p.deadline,
          executionDate: p.executionDate ? updateJalaliDateToCurrentYear(p.executionDate) : p.executionDate,
          submissionDate: p.submissionDate ? updateJalaliDateToCurrentYear(p.submissionDate) : p.submissionDate,
        };
      });
    }

    // Normalize employees: Migrate old legacy titles to the 7 standard organizational positions
    // (1. مدیر, 2. معاون آموزشی, 3. معاون پرورشی, 4. دبیر, 5. آموزگار, 6. معاون اجرایی, 7. سایر)
    if (Array.isArray(parsed.employees)) {
      parsed.employees = parsed.employees.map((emp: any) => {
        let updatedRole = emp.role;
        let customRole = emp.customRoleTitle;

        if (updatedRole === 'معاون پرورشی و تربیت بدنی') {
          updatedRole = 'معاون پرورشی';
        } else if (updatedRole === 'مدیر / سرپرست پرورشی') {
          updatedRole = 'مدیر';
        } else if (updatedRole === 'مربی امور تربیتی') {
          updatedRole = 'سایر';
          customRole = customRole || 'مربی امور تربیتی';
        } else if (updatedRole === 'مشاور مدرسه') {
          updatedRole = 'سایر';
          customRole = customRole || 'مشاور مدرسه';
        } else if (updatedRole === 'رابط فرهنگی و اقامه نماز') {
          updatedRole = 'سایر';
          customRole = customRole || 'رابط فرهنگی و اقامه نماز';
        } else if (updatedRole === 'مراقب سلامت') {
          updatedRole = 'سایر';
          customRole = customRole || 'مراقب سلامت';
        }

        const personnelCode = emp.personnelCode || `2010${emp.code}`;

        return {
          ...emp,
          role: updatedRole,
          customRoleTitle: customRole,
          personnelCode,
        };
      });
    }

    // Ensure officeTitle, developerName and academicYear are properly set
    if (!parsed.settings) {
      parsed.settings = getInitialDatabase().settings;
    } else {
      if (
        !parsed.settings.officeTitle ||
        parsed.settings.officeTitle.includes('منطقه / شهرستان') ||
        parsed.settings.officeTitle.includes('منطقه ۵ تهران')
      ) {
        parsed.settings.officeTitle = 'اداره آموزش و پرورش ناحیه ۶ اصفهان';
      }
      if (!parsed.settings.developerName) {
        parsed.settings.developerName = 'علیرضا شریعتی';
      }
      if (
        !parsed.settings.academicYear ||
        parsed.settings.academicYear.includes('1403') ||
        parsed.settings.academicYear.includes('۱۴۰۳')
      ) {
        const nextYear = String(Number(currentYear) + 1);
        parsed.settings.academicYear = `سال تحصیلی ${toPersianDigits(currentYear)}-${toPersianDigits(nextYear)}`;
      }
    }
    saveDatabase(parsed);
    return parsed;
  } catch (err) {
    console.error('Error loading database from localStorage:', err);
    return getInitialDatabase();
  }
}

export function saveDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Error saving database to localStorage:', err);
  }
}

export function exportDatabaseAsJson(db: AppDatabase): void {
  const jsonStr = JSON.stringify(db, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().slice(0, 10);
  link.download = `parvareshi_backup_${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importDatabaseFromJson(jsonString: string): AppDatabase {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString.trim());
  } catch (e: any) {
    throw new Error('متن یا فایل وارد شده ساختار معتبر JSON ندارد: ' + e.message);
  }

  // Handle if json is wrapped in a data property
  if (parsed.database && typeof parsed.database === 'object') {
    parsed = parsed.database;
  } else if (parsed.db && typeof parsed.db === 'object') {
    parsed = parsed.db;
  }

  const employees = parsed.employees || parsed.colleagues || parsed.staff || [];
  const programs = parsed.programs || parsed.plans || parsed.tarhha || [];
  const employeePrograms = parsed.employeePrograms || parsed.assignments || parsed.tarhayeEjraei || [];
  const schools = parsed.schools || parsed.madares || [];

  if (!Array.isArray(employees) && !Array.isArray(programs)) {
    throw new Error('فایل انتخاب شده معتبر نیست یا مشخصات همکاران و طرح‌ها در آن یافت نشد.');
  }

  const defaultDb = getInitialDatabase();

  const normalizedEmployeePrograms = (Array.isArray(employeePrograms) ? employeePrograms : []).map((ep: any, idx: number) => {
    const execDate = ep.executionDate || ep.actualDate || undefined;
    const subDate = ep.submissionDate || ep.docSubmissionDate || execDate;
    let platform = ep.submissionPlatform || ep.documentationPlatform || ep.docPlatform;
    if (!platform && (ep.status === 'done' || ep.status === 'late')) {
      platform = 'ایتا';
    }
    return {
      id: ep.id || `ep_imported_${idx + 1}`,
      employeeId: ep.employeeId || '',
      employeeCode: ep.employeeCode || '',
      programId: ep.programId || '',
      status: ep.status || 'not_done',
      isManualOverride: ep.isManualOverride ?? false,
      actualDate: execDate,
      executionDate: execDate,
      submissionDate: subDate,
      docSubmissionDate: subDate,
      submissionPlatform: platform,
      documentationPlatform: platform,
      notes: ep.notes || '',
      documentationNotes: ep.documentationNotes || '',
      updatedAt: ep.updatedAt || '1403/10/01',
    };
  });

  const normalizedPrograms = (Array.isArray(programs) && programs.length > 0 ? programs : defaultDb.programs).map((p: any) => {
    const rawCoeff = Number(p.coefficient);
    const coeff = ([1, 2, 3].includes(rawCoeff)) ? (rawCoeff as 1 | 2 | 3) : 1;
    return {
      ...p,
      scope: p.scope === 'اختصاصی' ? 'اختصاصی' : 'همگانی',
      coefficient: coeff,
    };
  });

  const validDb: AppDatabase = {
    employees: Array.isArray(employees) && employees.length > 0 ? employees : defaultDb.employees,
    schools: Array.isArray(schools) && schools.length > 0 ? schools : defaultDb.schools,
    programs: normalizedPrograms,
    employeePrograms: normalizedEmployeePrograms.length > 0 ? normalizedEmployeePrograms : defaultDb.employeePrograms,
    settings: {
      ...defaultDb.settings,
      ...(parsed.settings || {}),
      officeTitle: 'اداره آموزش و پرورش ناحیه ۶ اصفهان',
      developerName: 'علیرضا شریعتی',
    },
    version: parsed.version || 1,
  };

  saveDatabase(validDb);
  return validDb;
}

export function resetDatabaseToDefault(): AppDatabase {
  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}

/**
 * Smart Persian text normalization for robust name matching and Excel imports
 * Normalizes Persian/Arabic Yeh/Kaf, digits, spaces, and half-spaces.
 */
export function normalizePersianText(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u200c/g, ' ')
    .replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * محاسبه امتیاز و آمار همکاران با اعمال ضرایب ۱ تا ۳ طرح‌ها
 * 
 * فرمول‌ها:
 * - ضریب هر طرح (C_i): از ۱ تا ۳
 * - انجام به‌موقع هر طرح = ۱۰۰ × ضریب
 * - انجام با تأخیر هر طرح = ۶۰ × ضریب
 * - عدم اقدام = ۰
 * - امتیاز وزنی کل قابل کسب = مجموع (۱۰۰ × ضریب) برای تمام طرح‌های همگانی
 * - درصد عملکرد وزنی = (امتیاز وزنی کسب‌شده ÷ امتیاز وزنی کل قابل کسب) × ۱۰۰
 * - درصد پیشرفت ساده = (تعداد انجام‌شده + تعداد با تاخیر) ÷ تعداد کل × ۱۰۰
 * - درصد اجرای به‌موقع ساده = تعداد انجام‌شده ÷ تعداد کل × ۱۰۰
 */
export function calculateEmployeeStats(
  employeeId: string,
  allEmployeePrograms: EmployeeProgram[],
  allPrograms?: Program[],
): EmployeeStats {
  const prgMap = new Map((allPrograms || []).map((p) => [p.id, p]));
  let assignments = allEmployeePrograms.filter((ep) => ep.employeeId === employeeId);

  // If allPrograms is provided, filter out dedicated (اختصاصی) programs so they do not impact score/ranking
  if (allPrograms && allPrograms.length > 0) {
    assignments = assignments.filter((ep) => {
      const prg = prgMap.get(ep.programId);
      return !prg || prg.scope !== 'اختصاصی'; // only general programs count towards official score/ranking
    });
  }

  const total = assignments.length;
  if (total === 0) {
    return {
      total: 0,
      done: 0,
      late: 0,
      notDone: 0,
      progressPercent: 0,
      onTimePercent: 0,
      totalWeightedPossible: 0,
      earnedWeightedScore: 0,
      weightedProgressPercent: 0,
      totalCoefficients: 0,
    };
  }

  const done = assignments.filter((a) => a.status === 'done').length;
  const late = assignments.filter((a) => a.status === 'late').length;
  const notDone = assignments.filter((a) => a.status === 'not_done').length;

  const progressPercent = Math.round(((done + late) / total) * 100);
  const onTimePercent = Math.round((done / total) * 100);

  // محاسبه دقیق امتیاز وزنی با ضرایب ۱، ۲ یا ۳
  let totalCoefficients = 0;
  let totalWeightedPossible = 0;
  let earnedWeightedScore = 0;

  for (const a of assignments) {
    const prg = prgMap.get(a.programId);
    const coeff = (prg?.coefficient && [1, 2, 3].includes(prg.coefficient)) ? prg.coefficient : 1;
    totalCoefficients += coeff;
    totalWeightedPossible += coeff * 100;

    if (a.status === 'done') {
      earnedWeightedScore += coeff * 100;
    } else if (a.status === 'late') {
      earnedWeightedScore += coeff * 60;
    }
  }

  const weightedProgressPercent =
    totalWeightedPossible > 0
      ? Number(((earnedWeightedScore / totalWeightedPossible) * 100).toFixed(1))
      : 0;

  return {
    total,
    done,
    late,
    notDone,
    progressPercent,
    onTimePercent,
    totalWeightedPossible,
    earnedWeightedScore,
    weightedProgressPercent,
    totalCoefficients,
  };
}

/**
 * Detailed stats separating general programs (affecting ranking score with coefficients)
 * and specific dedicated programs (no effect on ranking score).
 */
export function calculateEmployeeDetailedStats(
  employeeId: string,
  allEmployeePrograms: EmployeeProgram[],
  allPrograms: Program[],
) {
  const prgMap = new Map(allPrograms.map((p) => [p.id, p]));
  const allEmpAssignments = allEmployeePrograms.filter((ep) => ep.employeeId === employeeId);

  const general = allEmpAssignments.filter((ep) => {
    const prg = prgMap.get(ep.programId);
    return !prg || prg.scope !== 'اختصاصی';
  });

  const specific = allEmpAssignments.filter((ep) => {
    const prg = prgMap.get(ep.programId);
    return prg?.scope === 'اختصاصی';
  });

  const gTotal = general.length;
  const gDone = general.filter((a) => a.status === 'done').length;
  const gLate = general.filter((a) => a.status === 'late').length;
  const gNotDone = general.filter((a) => a.status === 'not_done').length;
  const gProgressPercent = gTotal > 0 ? Math.round(((gDone + gLate) / gTotal) * 100) : 0;
  const gOnTimePercent = gTotal > 0 ? Math.round((gDone / gTotal) * 100) : 0;

  // ضرایب وزنی ۱، ۲ یا ۳
  let gTotalCoeff = 0;
  let gWeightedPossible = 0;
  let gEarnedWeightedScore = 0;

  for (const a of general) {
    const prg = prgMap.get(a.programId);
    const coeff = (prg?.coefficient && [1, 2, 3].includes(prg.coefficient)) ? prg.coefficient : 1;
    gTotalCoeff += coeff;
    gWeightedPossible += coeff * 100;
    if (a.status === 'done') {
      gEarnedWeightedScore += coeff * 100;
    } else if (a.status === 'late') {
      gEarnedWeightedScore += coeff * 60;
    }
  }

  const gWeightedPercent =
    gWeightedPossible > 0 ? Number(((gEarnedWeightedScore / gWeightedPossible) * 100).toFixed(1)) : 0;

  const officialScore = gEarnedWeightedScore;

  const sTotal = specific.length;
  const sDone = specific.filter((a) => a.status === 'done').length;
  const sLate = specific.filter((a) => a.status === 'late').length;
  const sNotDone = specific.filter((a) => a.status === 'not_done').length;

  return {
    general: {
      total: gTotal,
      done: gDone,
      late: gLate,
      notDone: gNotDone,
      progressPercent: gProgressPercent,
      onTimePercent: gOnTimePercent,
      score: officialScore,
      totalCoefficients: gTotalCoeff,
      weightedPossible: gWeightedPossible,
      earnedWeightedScore: gEarnedWeightedScore,
      weightedPercent: gWeightedPercent,
    },
    specific: {
      total: sTotal,
      done: sDone,
      late: sLate,
      notDone: sNotDone,
    },
    totalAssignments: allEmpAssignments.length,
    officialScore,
  };
}

/**
 * محاسبه امتیاز و آمار آموزشگاه‌ها با اعمال ضرایب طرح‌ها
 */
export function calculateSchoolStats(
  schoolId: string,
  employees: Employee[],
  allEmployeePrograms: EmployeeProgram[],
  allPrograms?: Program[],
): SchoolStats {
  const prgMap = new Map((allPrograms || []).map((p) => [p.id, p]));
  const schoolEmployees = employees.filter((e) => e.schoolId === schoolId);
  const empIds = new Set(schoolEmployees.map((e) => e.id));
  const assignments = allEmployeePrograms.filter((ep) => empIds.has(ep.employeeId));

  const totalPrograms = assignments.length;
  const done = assignments.filter((a) => a.status === 'done').length;
  const late = assignments.filter((a) => a.status === 'late').length;
  const notDone = assignments.filter((a) => a.status === 'not_done').length;

  const progressPercent = totalPrograms > 0 ? Math.round(((done + late) / totalPrograms) * 100) : 0;
  const onTimePercent = totalPrograms > 0 ? Math.round((done / totalPrograms) * 100) : 0;

  // محاسبه امتیاز وزنی مدرسه بر اساس ضرایب ۱ تا ۳
  let totalWeightedPossible = 0;
  let earnedWeightedScore = 0;

  for (const a of assignments) {
    const prg = prgMap.get(a.programId);
    const coeff = (prg?.coefficient && [1, 2, 3].includes(prg.coefficient)) ? prg.coefficient : 1;
    totalWeightedPossible += coeff * 100;
    if (a.status === 'done') {
      earnedWeightedScore += coeff * 100;
    } else if (a.status === 'late') {
      earnedWeightedScore += coeff * 60;
    }
  }

  const weightedProgressPercent =
    totalWeightedPossible > 0
      ? Number(((earnedWeightedScore / totalWeightedPossible) * 100).toFixed(1))
      : 0;

  const averageStaffScore =
    schoolEmployees.length > 0 ? Math.round(earnedWeightedScore / schoolEmployees.length) : 0;

  return {
    staffCount: schoolEmployees.length,
    totalPrograms,
    done,
    late,
    notDone,
    progressPercent,
    onTimePercent,
    totalWeightedPossible,
    earnedWeightedScore,
    weightedProgressPercent,
    averageStaffScore,
  };
}

export function calculateProgramStats(programId: string, allEmployeePrograms: EmployeeProgram[]) {
  const assignments = allEmployeePrograms.filter((ep) => ep.programId === programId);
  const totalAssigned = assignments.length;
  const done = assignments.filter((a) => a.status === 'done').length;
  const late = assignments.filter((a) => a.status === 'late').length;
  const notDone = assignments.filter((a) => a.status === 'not_done').length;

  const progressPercent = totalAssigned > 0 ? Math.round(((done + late) / totalAssigned) * 100) : 0;
  const onTimePercent = totalAssigned > 0 ? Math.round((done / totalAssigned) * 100) : 0;

  return {
    totalAssigned,
    done,
    late,
    notDone,
    progressPercent,
    onTimePercent,
  };
}

export function calculateOverallStats(
  employees: Employee[],
  allEmployeePrograms: EmployeeProgram[],
) {
  const totalEmployees = employees.length;
  const totalAssignments = allEmployeePrograms.length;
  const done = allEmployeePrograms.filter((a) => a.status === 'done').length;
  const late = allEmployeePrograms.filter((a) => a.status === 'late').length;
  const notDone = allEmployeePrograms.filter((a) => a.status === 'not_done').length;

  const progressPercent =
    totalAssignments > 0 ? Math.round(((done + late) / totalAssignments) * 100) : 0;
  const onTimePercent =
    totalAssignments > 0 ? Math.round((done / totalAssignments) * 100) : 0;

  return {
    totalEmployees,
    totalAssignments,
    done,
    late,
    notDone,
    progressPercent,
    onTimePercent,
  };
}
