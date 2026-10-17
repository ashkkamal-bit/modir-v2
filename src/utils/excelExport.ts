import * as XLSX from 'xlsx';
import { AppDatabase } from '../types';
import { calculateEmployeeStats, calculateProgramStats, calculateSchoolStats } from './storage';
import { getCurrentJalaliDate, getCurrentJalaliYear, updateJalaliDateToCurrentYear, toPersianDigits } from './jalali';

export function exportFullExcelReport(db: AppDatabase, filenamePrefix = 'گزارش_جامع_عملکرد_پرورشی'): void {
  const wb = XLSX.utils.book_new();

  const currentYear = getCurrentJalaliYear();
  const nextYear = String(Number(currentYear) + 1);
  const currentJalaliDate = getCurrentJalaliDate();
  const dynamicAcademicYear = db.settings.academicYear && !db.settings.academicYear.includes('1403')
    ? db.settings.academicYear
    : `سال تحصیلی ${toPersianDigits(currentYear)}-${toPersianDigits(nextYear)}`;

  wb.Props = {
    Title: `گزارش جامع پرورشی با ضرایب طرح‌ها - ${db.settings.officeTitle || 'اداره آموزش و پرورش ناحیه ۶ اصفهان'}`,
    Subject: 'گزارش ارزیابی و رتبه‌بندی عملکرد نیروهای پرورشی مدارس با اعمال ضرایب ۱ تا ۳ طرح‌ها',
    Author: db.settings.developerName || 'علیرضا شریعتی',
    Company: db.settings.officeTitle || 'اداره آموزش و پرورش ناحیه ۶ اصفهان',
    Comments: `برنامه‌نویس: ${db.settings.developerName || 'علیرضا شریعتی'} - تاریخ صدور: ${currentJalaliDate}`,
  };

  const empMap = new Map(db.employees.map((e) => [e.id, e]));
  const prgMap = new Map(db.programs.map((p) => [p.id, p]));

  // ----------------------------------------------------
  // 0. Sheet 0: شناسنامه سامانه و گزارش
  // ----------------------------------------------------
  const sheet0Data: (string | number)[][] = [
    ['عنوان مشخصه', 'مقدار مشخصه در سامانه'],
    ['نام اداره متبوع', db.settings.officeTitle || 'اداره آموزش و پرورش ناحیه ۶ اصفهان'],
    ['عنوان کارشناسی / واحد سازمانی', db.settings.departmentTitle || 'کارشناسی امور پرورشی و فرهنگی'],
    ['سال تحصیلی رسمی', dynamicAcademicYear],
    ['تاریخ صدور این فایل گزارش (شمسی)', currentJalaliDate],
    ['کارشناس مسئول واحد پرورشی', db.settings.officerName || 'کارشناسی امور پرورشی'],
    ['طراح و برنامه‌نویس سامانه', db.settings.developerName || 'علیرضا شریعتی'],
    ['تعداد کل همکاران پرورشی ثبت‌شده', db.employees.length],
    ['تعداد کل آموزشگاه‌ها و مدارس', db.schools.length],
    ['تعداد کل طرح‌ها و برنامه‌های تعریف‌شده', db.programs.length],
    ['تعداد طرح‌های همگانی (مؤثر در امتیاز با ضریب)', db.programs.filter((p) => p.scope !== 'اختصاصی').length],
    ['تعداد طرح‌های اختصاصی (بدون امتیاز در رتبه)', db.programs.filter((p) => p.scope === 'اختصاصی').length],
    ['مجموع کل تکالیف ارجاع‌شده', db.employeePrograms.length],
    ['سیستم امتیازبندی و ضرایب', 'هر طرح دارای ضریب ۱ تا ۳ است؛ اجرای به‌موقع = ۱۰۰ × ضریب | با تاخیر = ۶۰ × ضریب'],
  ];
  const ws0 = XLSX.utils.aoa_to_sheet(sheet0Data);
  ws0['!cols'] = [{ wch: 38 }, { wch: 65 }];
  XLSX.utils.book_append_sheet(wb, ws0, 'شناسنامه گزارش');

  // ----------------------------------------------------
  // 1. Sheet 1: جزئیات عملکرد و مستندات
  // ----------------------------------------------------
  const sheet1Data: (string | number)[][] = [
    [
      'ردیف',
      'کد همکار',
      'نام و نام خانوادگی',
      'آموزشگاه',
      'مقطع تحصیلی',
      'سمت پرورشی',
      'کد برنامه',
      'عنوان برنامه',
      'ضریب طرح (۱ تا ۳)',
      'نوع طرح',
      'تأثیر در رتبه‌بندی',
      'محور پرورشی',
      'مهلت مقرر اجرا',
      'تاریخ اجرای طرح',
      'تاریخ ارسال مستندات',
      'محل ارسال مستندات',
      'وضعیت اجرا',
      'امتیاز کسب‌شده با ضریب',
      'مشخصات مستندات و شماره نامه',
      'توضیحات و بازخورد کارشناس',
    ],
  ];

  let rowIdx = 1;
  for (const ep of db.employeePrograms) {
    const emp = empMap.get(ep.employeeId);
    const prg = prgMap.get(ep.programId);
    if (!emp || !prg) continue;

    let statusFa = 'انجام نشده';
    if (ep.status === 'done') statusFa = 'انجام شده (به‌موقع)';
    else if (ep.status === 'late') statusFa = 'دیر انجام شده';

    let rawExec = ep.executionDate || ep.actualDate;
    if ((ep.status === 'done' || ep.status === 'late') && (!rawExec || rawExec === '---')) {
      rawExec = currentJalaliDate;
    }
    const execDate = rawExec ? updateJalaliDateToCurrentYear(rawExec) : '---';

    let rawSub = ep.submissionDate || ep.docSubmissionDate || rawExec;
    const subDate = rawSub ? updateJalaliDateToCurrentYear(rawSub) : execDate;

    const platform = ep.submissionPlatform || ep.documentationPlatform || '---';
    const updatedDeadline = updateJalaliDateToCurrentYear(prg.deadline);
    const isSpecific = prg.scope === 'اختصاصی';
    const coeff = prg.coefficient || 1;

    let earnedPoints = 0;
    if (!isSpecific) {
      if (ep.status === 'done') earnedPoints = coeff * 100;
      else if (ep.status === 'late') earnedPoints = coeff * 60;
    }

    sheet1Data.push([
      rowIdx++,
      emp.code,
      emp.fullName,
      emp.schoolName,
      emp.grade,
      emp.role,
      prg.code,
      prg.title,
      coeff,
      isSpecific ? 'اختصاصی' : 'همگانی',
      isSpecific ? 'بدون امتیاز' : `مؤثر با ضریب ${coeff}`,
      prg.axis,
      updatedDeadline,
      execDate,
      subDate,
      platform,
      statusFa,
      earnedPoints,
      ep.documentationNotes || '---',
      ep.notes || '',
    ]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = [
    { wch: 6 },  // ردیف
    { wch: 10 }, // کد همکار
    { wch: 22 }, // نام و نام خانوادگی
    { wch: 30 }, // آموزشگاه
    { wch: 20 }, // مقطع
    { wch: 24 }, // سمت
    { wch: 12 }, // کد برنامه
    { wch: 38 }, // عنوان برنامه
    { wch: 16 }, // ضریب
    { wch: 14 }, // نوع طرح
    { wch: 18 }, // تأثیر در رتبه
    { wch: 26 }, // محور
    { wch: 14 }, // مهلت اجرا
    { wch: 16 }, // تاریخ اجرا
    { wch: 16 }, // تاریخ ارسال مستندات
    { wch: 18 }, // محل ارسال
    { wch: 20 }, // وضعیت
    { wch: 20 }, // امتیاز با ضریب
    { wch: 32 }, // مشخصات پیوست
    { wch: 38 }, // توضیحات
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'ریز عملکرد و مستندات');

  // ----------------------------------------------------
  // 2. Sheet 2: خلاصه عملکرد همکاران
  // ----------------------------------------------------
  const sheet2Data: (string | number)[][] = [
    [
      'ردیف',
      'کد همکار',
      'نام همکار',
      'آموزشگاه',
      'مقطع تحصیلی',
      'سمت',
      'شماره تماس',
      'کل طرح‌های محوله',
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
    ],
  ];

  let r2 = 1;
  for (const emp of db.employees) {
    const stats = calculateEmployeeStats(emp.id, db.employeePrograms, db.programs);
    const empAssignments = db.employeePrograms.filter((ep) => ep.employeeId === emp.id);
    const specificAssignments = empAssignments.filter((ep) => {
      const p = prgMap.get(ep.programId);
      return p?.scope === 'اختصاصی';
    });

    const score = stats.earnedWeightedScore;

    let tier = 'نیازمند پیگیری';
    if (score >= 600 || (stats.total > 0 && stats.progressPercent >= 85)) tier = 'ممتاز';
    else if (score >= 350 || (stats.total > 0 && stats.progressPercent >= 65)) tier = 'بسیار خوب';
    else if (score >= 150 || (stats.total > 0 && stats.progressPercent >= 40)) tier = 'خوب';

    sheet2Data.push([
      r2++,
      emp.code,
      emp.fullName,
      emp.schoolName,
      emp.grade,
      emp.role,
      emp.phone || '---',
      empAssignments.length,
      stats.total,
      stats.totalCoefficients,
      specificAssignments.length,
      stats.done,
      stats.late,
      stats.notDone,
      `${stats.progressPercent}%`,
      `${stats.onTimePercent}%`,
      score,
      tier,
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 22 },
    { wch: 30 },
    { wch: 20 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'خلاصه عملکرد همکاران');

  // ----------------------------------------------------
  // 3. Sheet 3: گزارش طرح‌ها و برنامه‌ها
  // ----------------------------------------------------
  const sheet3Data: (string | number)[][] = [
    [
      'ردیف',
      'کد برنامه',
      'عنوان برنامه / طرح',
      'ضریب طرح (۱ تا ۳)',
      'نوع برنامه',
      'تأثیر در رتبه‌بندی',
      'ارزش به‌موقع (امتیاز)',
      'ارزش با تاخیر (امتیاز)',
      'محور پرورشی',
      'تاریخ شروع',
      'مهلت نهایی اجرا',
      'تعداد افراد مشمول',
      'انجام شده (به‌موقع)',
      'دیر انجام شده',
      'انجام نشده',
      'درصد تحقق طرح',
      'درصد اجرای به‌موقع',
      'وضعیت',
      'شرح و اهداف طرح',
    ],
  ];

  let r3 = 1;
  for (const prg of db.programs) {
    const pStats = calculateProgramStats(prg.id, db.employeePrograms);
    const isSpecific = prg.scope === 'اختصاصی';
    const coeff = prg.coefficient || 1;

    sheet3Data.push([
      r3++,
      prg.code,
      prg.title,
      coeff,
      isSpecific ? 'اختصاصی' : 'همگانی',
      isSpecific ? 'بدون امتیاز' : `مؤثر با ضریب ${coeff}`,
      coeff * 100,
      coeff * 60,
      prg.axis,
      updateJalaliDateToCurrentYear(prg.startDate),
      updateJalaliDateToCurrentYear(prg.deadline),
      pStats.totalAssigned,
      pStats.done,
      pStats.late,
      pStats.notDone,
      `${pStats.progressPercent}%`,
      `${pStats.onTimePercent}%`,
      prg.isActive ? 'فعال' : 'غیرفعال',
      prg.description || '---',
    ]);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 38 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 26 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'گزارش طرح‌ها و برنامه‌ها');

  // ----------------------------------------------------
  // 4. Sheet 4: گزارش آموزشگاه‌ها
  // ----------------------------------------------------
  const sheet4Data: (string | number)[][] = [
    [
      'ردیف',
      'کد آموزشگاه',
      'نام آموزشگاه',
      'مقطع تحصیلی',
      'جنسیت',
      'مدیر آموزشگاه',
      'تعداد همکاران پرورشی',
      'کل تکالیف محوله',
      'انجام شده (به‌موقع)',
      'دیر انجام شده',
      'انجام نشده',
      'درصد پیشرفت آموزشگاه',
      'امتیاز وزنی مکتسبه مدرسه',
      'میانگین امتیاز هر نیرو',
    ],
  ];

  let r4 = 1;
  for (const sch of db.schools) {
    const sStats = calculateSchoolStats(sch.id, db.employees, db.employeePrograms, db.programs);
    sheet4Data.push([
      r4++,
      sch.code,
      sch.name,
      sch.grade,
      sch.gender,
      sch.principalName || '---',
      sStats.staffCount,
      sStats.totalPrograms,
      sStats.done,
      sStats.late,
      sStats.notDone,
      `${sStats.progressPercent}%`,
      sStats.earnedWeightedScore,
      sStats.averageStaffScore,
    ]);
  }

  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
  ws4['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 32 },
    { wch: 22 },
    { wch: 12 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, 'گزارش آموزشگاه‌ها');

  // ----------------------------------------------------
  // 4.5 Sheet 4.5: گزارش تفکیک سمت‌های سازمانی
  // ----------------------------------------------------
  const standardRoles = [
    'مدیر',
    'معاون آموزشی',
    'معاون پرورشی',
    'دبیر',
    'آموزگار',
    'معاون اجرایی',
    'سایر',
  ];

  const sheetRolesData: (string | number)[][] = [
    [
      'ردیف',
      'عنوان سمت سازمانی',
      'تعداد همکاران',
      'کل طرح‌های محوله',
      'انجام شده به‌موقع',
      'دیر انجام شده',
      'انجام نشده',
      'میانگین درصد پیشرفت',
      'میانگین امتیاز وزنی',
    ],
  ];

  let rRole = 1;
  for (const roleName of standardRoles) {
    const staffInRole = db.employees.filter((e) => {
      if (roleName === 'سایر') {
        const coreSix = new Set(['مدیر', 'معاون آموزشی', 'معاون پرورشی', 'دبیر', 'آموزگار', 'معاون اجرایی']);
        const isStandard = coreSix.has(e.role) || e.role.startsWith('معاون پرورشی');
        return !isStandard || e.role === 'سایر';
      }
      if (roleName === 'معاون پرورشی') {
        return e.role === 'معاون پرورشی' || e.role.includes('معاون پرورشی');
      }
      return e.role === roleName;
    });

    const count = staffInRole.length;
    let totalAssigned = 0;
    let totalDone = 0;
    let totalLate = 0;
    let totalNotDone = 0;
    let sumProgress = 0;
    let sumScore = 0;

    for (const e of staffInRole) {
      const stats = calculateEmployeeStats(e.id, db.employeePrograms, db.programs);
      totalAssigned += stats.total;
      totalDone += stats.done;
      totalLate += stats.late;
      totalNotDone += stats.notDone;
      sumProgress += stats.progressPercent;
      sumScore += stats.earnedWeightedScore;
    }

    const avgProg = count > 0 ? Math.round(sumProgress / count) : 0;
    const avgScore = count > 0 ? Math.round(sumScore / count) : 0;

    sheetRolesData.push([
      rRole++,
      roleName === 'سایر' ? 'سایر سمت‌ها' : roleName,
      count,
      totalAssigned,
      totalDone,
      totalLate,
      totalNotDone,
      `${avgProg}%`,
      avgScore,
    ]);
  }

  const wsRoles = XLSX.utils.aoa_to_sheet(sheetRolesData);
  wsRoles['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRoles, 'گزارش تفکیک سمت‌ها');

  // ----------------------------------------------------
  // 5. Sheet 5: رتبه‌بندی رسمی همکاران (با ضرایب ۱ تا ۳)
  // ----------------------------------------------------
  const rankedColleagues = db.employees
    .map((emp) => {
      const stats = calculateEmployeeStats(emp.id, db.employeePrograms, db.programs);
      const empAssignments = db.employeePrograms.filter((ep) => ep.employeeId === emp.id);
      const specificCount = empAssignments.filter((ep) => {
        const p = prgMap.get(ep.programId);
        return p?.scope === 'اختصاصی';
      }).length;

      const score = stats.earnedWeightedScore;
      let tier = 'نیازمند پیگیری';
      if (score >= 600 || (stats.total > 0 && stats.progressPercent >= 85)) tier = 'ممتاز';
      else if (score >= 350 || (stats.total > 0 && stats.progressPercent >= 65)) tier = 'بسیار خوب';
      else if (score >= 150 || (stats.total > 0 && stats.progressPercent >= 40)) tier = 'خوب';
      return { emp, stats, specificCount, score, tier };
    })
    .sort((a, b) => b.score - a.score || b.stats.progressPercent - a.stats.progressPercent);

  const sheet5Data: (string | number)[][] = [
    [
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
    ],
  ];

  let r5 = 1;
  for (const item of rankedColleagues) {
    sheet5Data.push([
      r5++,
      item.emp.code,
      item.emp.fullName,
      item.emp.schoolName,
      item.emp.grade,
      item.emp.role,
      item.stats.total,
      item.stats.totalCoefficients,
      item.specificCount,
      item.stats.done,
      item.stats.late,
      item.stats.notDone,
      `${item.stats.progressPercent}%`,
      `${item.stats.onTimePercent}%`,
      item.score,
      item.tier,
    ]);
  }

  const ws5 = XLSX.utils.aoa_to_sheet(sheet5Data);
  ws5['!cols'] = [
    { wch: 8 },  // رتبه
    { wch: 10 }, // کد همکار
    { wch: 24 }, // نام و نام خانوادگی
    { wch: 30 }, // آموزشگاه
    { wch: 22 }, // مقطع
    { wch: 24 }, // سمت
    { wch: 16 }, // طرح‌های همگانی
    { wch: 18 }, // مجموع ضرایب
    { wch: 16 }, // طرح‌های اختصاصی
    { wch: 18 }, // به‌موقع
    { wch: 16 }, // دیرکرد
    { wch: 14 }, // انجام نشده
    { wch: 18 }, // پیشرفت همگانی
    { wch: 16 }, // به‌موقع
    { wch: 24 }, // امتیاز نهایی
    { wch: 16 }, // سطح عملکرد
  ];
  XLSX.utils.book_append_sheet(wb, ws5, 'رتبه‌بندی رسمی همکاران');

  // ----------------------------------------------------
  // 6. Sheet 6: مشخصات پرسنلی همکاران
  // ----------------------------------------------------
  const sheet6Data: (string | number)[][] = [
    [
      'ردیف',
      'کد اختصاصی (۲ رقمی)',
      'نام و نام خانوادگی',
      'کد پرسنلی',
      'نام آموزشگاه',
      'مقطع تحصیلی',
      'سمت سازمانی',
      'تلفن همراه',
      'تاریخ ثبت در سامانه',
      'یادداشت‌ها و سوابق پرسنلی',
    ],
  ];

  let r6 = 1;
  for (const emp of db.employees) {
    sheet6Data.push([
      r6++,
      emp.code,
      emp.fullName,
      emp.personnelCode || '---',
      emp.schoolName,
      emp.grade,
      emp.role,
      emp.phone || '---',
      emp.createdAt ? updateJalaliDateToCurrentYear(emp.createdAt) : currentJalaliDate,
      emp.notes || '---',
    ]);
  }

  const ws6 = XLSX.utils.aoa_to_sheet(sheet6Data);
  ws6['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 26 },
    { wch: 16 },
    { wch: 32 },
    { wch: 22 },
    { wch: 26 },
    { wch: 18 },
    { wch: 18 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, ws6, 'مشخصات پرسنلی همکاران');

  // ----------------------------------------------------
  // 7. Sheet 7: آیین‌نامه و شیوه محاسبه با ضرایب ۱ تا ۳
  // ----------------------------------------------------
  const sheet7Data: (string | number)[][] = [
    ['موضوع آیین‌نامه و شیوه ارزیابی', 'توضیحات و فرمول‌های محاسباتی'],
    ['ضریب امتیازی طرح‌ها و برنامه‌ها', 'به هر طرح ضریب امتیازی از ۱ تا ۳ تعلق می‌گیرد: ضریب ۱ (عادی)، ضریب ۲ (بااهمیت) و ضریب ۳ (ویژه و اولویت‌دار) تا اهمیت طرح‌های مهم در ارزیابی منعکس گردد.'],
    ['فرمول امتیازدهی به ازای هر طرح', 'امتیاز اجرای به‌موقع هر طرح = ۱۰۰ × ضریب طرح | امتیاز اجرای با تاخیر هر طرح = ۶۰ × ضریب طرح | عدم اجرا = ۰ امتیاز'],
    ['محاسبه امتیاز نهایی همکاران', 'امتیاز نهایی هر همکار = مجموع امتیازات وزنی کسب‌شده از تمامی طرح‌های همگانی مشمول.'],
    ['محاسبه امتیاز نهایی مدارس', 'امتیاز نهایی هر مدرسه = مجموع امتیازات وزنی کسب‌شده توسط تمامی نیروهای پرورشی شاغل در آن آموزشگاه.'],
    ['قانون طرح‌های اختصاصی', 'طرح‌های اختصاصی موردی هستند و هیچ‌گونه کسر یا اضافه امتیازی در رتبه‌بندی نهایی ندارند.'],
    ['سطح عملکرد ممتاز', 'کسب حداقل ۶۰۰ امتیاز وزنی و یا پیشرفت بیش از ۸۵ درصد'],
    ['سطح عملکرد بسیار خوب', 'کسب ۳۵۰ تا ۵۹۹ امتیاز وزنی و یا پیشرفت بین ۶۵ تا ۸۴ درصد'],
    ['سطح عملکرد خوب', 'کسب ۱۵۰ تا ۳۴۹ امتیاز وزنی و یا پیشرفت بین ۴۰ تا ۶۴ درصد'],
    ['سطح عملکرد نیازمند پیگیری', 'کسب کمتر از ۱۵۰ امتیاز وزنی و یا پیشرفت کمتر از ۴۰ درصد'],
  ];

  const ws7 = XLSX.utils.aoa_to_sheet(sheet7Data);
  ws7['!cols'] = [{ wch: 36 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(wb, ws7, 'آیین‌نامه و ضرایب طرح‌ها');

  const dateStr = currentJalaliDate.replace(/\//g, '-');
  XLSX.writeFile(wb, `${filenamePrefix}_${dateStr}.xlsx`);
}
