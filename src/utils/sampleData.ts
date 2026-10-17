import { getCurrentJalaliYear, toPersianDigits } from "./jalali";
import { AppDatabase, School, Employee, Program, EmployeeProgram } from '../types';

export const INITIAL_SCHOOLS: School[] = [
  {
    id: 'sch-1',
    code: '101',
    name: 'دبیرستان شهید بهشتی (متوسطه اول)',
    grade: 'متوسطه اول',
    gender: 'پسرانه',
    principalName: 'محمد رضایی',
    phone: '031-36611001',
  },
  {
    id: 'sch-2',
    code: '102',
    name: 'دبیرستان فرزانگان (متوسطه دوم)',
    grade: 'متوسطه دوم نظری',
    gender: 'دخترانه',
    principalName: 'فاطمه احمدی',
    phone: '031-36622002',
  },
  {
    id: 'sch-3',
    code: '103',
    name: 'دبستان انقلاب اسلامی (دوره اول و دوم)',
    grade: 'ابتدایی دوره دوم',
    gender: 'پسرانه',
    principalName: 'علی کاظمی',
    phone: '031-36633003',
  },
  {
    id: 'sch-4',
    code: '104',
    name: 'هنرستان فنی دخترانه کوثر',
    grade: 'هنرستان فنی و حرفه‌ای و کاردانش',
    gender: 'دخترانه',
    principalName: 'مریم حسینی',
    phone: '031-36644004',
  },
  {
    id: 'sch-5',
    code: '105',
    name: 'دبستان اندیشه نو (دوره اول)',
    grade: 'ابتدایی دوره اول',
    gender: 'دخترانه',
    principalName: 'زهرا موسوی',
    phone: '031-36655005',
  },
  {
    id: 'sch-6',
    code: '106',
    name: 'دبیرستان علامه حلی (متوسطه دوم)',
    grade: 'متوسطه دوم نظری',
    gender: 'پسرانه',
    principalName: 'سعید محمدی',
    phone: '031-36666006',
  },
];

export const INITIAL_PROGRAMS: Program[] = [
  {
    id: 'prg-1',
    code: 'PRG-01',
    title: 'مسابقات قرآن، عترت و نماز (مرحله آموزشگاهی)',
    axis: 'پرورشی',
    scope: 'همگانی',
    coefficient: 3, // ضریب ۳: بسیار مهم و اولویت‌دار
    startDate: `${getCurrentJalaliYear()}/07/15`,
    deadline: `${getCurrentJalaliYear()}/08/30`,
    description: 'برگزاری مسابقات حفظ، قرائت، نهج‌البلاغه و صحیفه سجادیه و ثبت اسامی برگزیدگان',
    isActive: true,
    createdAt: `${getCurrentJalaliYear()}/07/01`,
  },
  {
    id: 'prg-2',
    code: 'PRG-02',
    title: 'طرح ارتقای سواد خواندن و مهارت‌های زبانی دانش‌آموزان دوره ابتدایی',
    axis: 'آموزش ابتدایی',
    scope: 'همگانی',
    coefficient: 2, // ضریب ۲: بااهمیت
    startDate: `${getCurrentJalaliYear()}/08/01`,
    deadline: `${getCurrentJalaliYear()}/09/15`,
    description: 'ارتقای سواد خواندن و درک مطلب و ارزشیابی توصیفی در مقطع ابتدایی',
    isActive: true,
    createdAt: `${getCurrentJalaliYear()}/07/10`,
  },
  {
    id: 'prg-3',
    code: 'PRG-03',
    title: 'جشنواره علمی، پژوهشی و مهارتی نوجوان خوارزمی (متوسطه اول)',
    axis: 'آموزش متوسطه اول',
    scope: 'همگانی',
    coefficient: 2, // ضریب ۲: بااهمیت
    startDate: `${getCurrentJalaliYear()}/08/15`,
    deadline: `${getCurrentJalaliYear()}/10/15`,
    description: 'هدایت تحصیلی، خلاقیت و شناسایی استعدادهای مهارتی در پایه‌های هفتم تا نهم',
    isActive: true,
    createdAt: `${getCurrentJalaliYear()}/08/01`,
  },
  {
    id: 'prg-4',
    code: 'PRG-04',
    title: 'طرح تقویت بنیه علمی، کنکور و آزمون‌های نهایی استاندارد کشوری',
    axis: 'آموزش متوسطه دوم',
    scope: 'همگانی',
    coefficient: 3, // ضریب ۳: بسیار مهم و اولویت‌دار
    startDate: `${getCurrentJalaliYear()}/07/10`,
    deadline: `${getCurrentJalaliYear()}/09/01`,
    description: 'آماده‌سازی امتحانات نهایی کشوری و ارتقای معدل کتبی دوره دوم متوسطه نظری و فنی',
    isActive: true,
    createdAt: `${getCurrentJalaliYear()}/07/05`,
  },
  {
    id: 'prg-5',
    code: 'PRG-05',
    title: 'المپیاد ورزشی درون‌مدرسه‌ای و پایش سلامت جسمانی و ساختار قامتی',
    axis: 'تربیت بدنی',
    scope: 'همگانی',
    coefficient: 2, // ضریب ۲: بااهمیت
    startDate: `${getCurrentJalaliYear()}/08/20`,
    deadline: `${getCurrentJalaliYear()}/09/25`,
    description: 'برگزاری رقابت‌های ورزشی، حیاط پویا و ارزیابی فاکتورهای آمادگی جسمانی دانش‌آموزان',
    isActive: true,
    createdAt: `${getCurrentJalaliYear()}/08/10`,
  },
  {
    id: 'prg-6',
    code: 'PRG-06',
    title: 'پویش ملی یاریگران زندگی و پیشگیری از آسیب‌های اجتماعی',
    axis: 'پرورشی',
    scope: 'همگانی',
    coefficient: 2, // ضریب ۲: بااهمیت
    startDate: `${getCurrentJalaliYear()}/08/05`,
    deadline: `${getCurrentJalaliYear()}/08/25`,
    description: 'تشکیل کانون یاریگران زندگی، آموزش مهارت‌های خودمراقبتی و پیشگیری از رفتارهای پرخطر',
    isActive: true,
    createdAt: `${getCurrentJalaliYear()}/08/01`,
  },
  {
    id: 'prg-7',
    code: 'PRG-07',
    title: 'کارگاه‌های توانمندسازی معلمان دوره اول و دوم ابتدایی',
    axis: 'آموزش ابتدایی',
    scope: 'اختصاصی',
    coefficient: 1, // ضریب ۱: عادی
    startDate: `${getCurrentJalaliYear()}/07/20`,
    deadline: `${getCurrentJalaliYear()}/10/01`,
    description: 'دانش‌افزایی معلمان پایه و آموزش روش‌های نوین تدریس (طرح اختصاصی)',
    isActive: true,
    createdAt: `${getCurrentJalaliYear()}/07/15`,
  },
  {
    id: 'prg-8',
    code: 'PRG-08',
    title: 'مسابقات ورزشی قطبی و استانی دانش‌آموزی و کانون‌های ورزشی',
    axis: 'تربیت بدنی',
    scope: 'اختصاصی',
    coefficient: 1, // ضریب ۱: عادی
    startDate: `${getCurrentJalaliYear()}/07/15`,
    deadline: `${getCurrentJalaliYear()}/09/10`,
    description: 'شناسایی و اعزام تیم‌های ورزشی برگزیده مدارس به مسابقات استانی (طرح اختصاصی)',
    isActive: true,
    createdAt: `${getCurrentJalaliYear()}/07/10`,
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    code: '01',
    personnelCode: '201001',
    fullName: 'حسین صادقی',
    schoolId: 'sch-1',
    schoolName: 'دبیرستان شهید بهشتی (متوسطه اول)',
    grade: 'متوسطه اول',
    role: 'معاون پرورشی',
    phone: '09131112233',
    notes: 'همکار با سابقه ۱۵ سال، مسئول برگزاری مسابقات قطب',
    createdAt: `${getCurrentJalaliYear()}/06/25`,
  },
  {
    id: 'emp-2',
    code: '02',
    personnelCode: '201002',
    fullName: 'زهره کریمی',
    schoolId: 'sch-2',
    schoolName: 'دبیرستان فرزانگان (متوسطه دوم)',
    grade: 'متوسطه دوم نظری',
    role: 'معاون پرورشی',
    phone: '09132223344',
    notes: 'پیگیر و بسیار دقیق در ارسال گزارش‌ها و مستندات',
    createdAt: `${getCurrentJalaliYear()}/06/25`,
  },
  {
    id: 'emp-3',
    code: '03',
    personnelCode: '201003',
    fullName: 'رضا مرادی',
    schoolId: 'sch-3',
    schoolName: 'دبستان انقلاب اسلامی (دوره اول و دوم)',
    grade: 'ابتدایی دوره دوم',
    role: 'آموزگار',
    phone: '09133334455',
    notes: 'دارای رتبه اول سرود منطقه‌ای سال گذشته',
    createdAt: `${getCurrentJalaliYear()}/06/26`,
  },
  {
    id: 'emp-4',
    code: '04',
    personnelCode: '201004',
    fullName: 'الهام سعیدی',
    schoolId: 'sch-4',
    schoolName: 'هنرستان فنی دخترانه کوثر',
    grade: 'هنرستان فنی و حرفه‌ای و کاردانش',
    role: 'دبیر',
    phone: '09134445566',
    notes: 'مسئول هماهنگی طرح یاریگران زندگی در هنرستان‌ها',
    createdAt: `${getCurrentJalaliYear()}/06/27`,
  },
  {
    id: 'emp-5',
    code: '05',
    personnelCode: '201005',
    fullName: 'داود ابراهیمی',
    schoolId: 'sch-1',
    schoolName: 'دبیرستان شهید بهشتی (متوسطه اول)',
    grade: 'متوسطه اول',
    role: 'معاون آموزشی',
    phone: '09135556677',
    notes: 'سرپرست گروه نمایش و قرآن مدرسه',
    createdAt: `${getCurrentJalaliYear()}/06/28`,
  },
  {
    id: 'emp-6',
    code: '06',
    personnelCode: '201006',
    fullName: 'سارا میرزایی',
    schoolId: 'sch-5',
    schoolName: 'دبستان اندیشه نو (دوره اول)',
    grade: 'ابتدایی دوره اول',
    role: 'مدیر',
    phone: '09136667788',
    notes: 'مدیر توانمند و باانگیزه آموزشگاه',
    createdAt: `${getCurrentJalaliYear()}/07/01`,
  },
  {
    id: 'emp-7',
    code: '07',
    personnelCode: '201007',
    fullName: 'محمود رستمی',
    schoolId: 'sch-6',
    schoolName: 'دبیرستان علامه حلی (متوسطه دوم)',
    grade: 'متوسطه دوم نظری',
    role: 'معاون اجرایی',
    phone: '09137778899',
    notes: 'معاون اجرایی با سابقه، هماهنگ‌کننده امور سامانه سیدا و ثبت‌نام',
    createdAt: `${getCurrentJalaliYear()}/07/01`,
  },
  {
    id: 'emp-8',
    code: '08',
    personnelCode: '201008',
    fullName: 'سمیرا نوری',
    schoolId: 'sch-2',
    schoolName: 'دبیرستان فرزانگان (متوسطه دوم)',
    grade: 'متوسطه دوم نظری',
    role: 'سایر',
    customRoleTitle: 'مشاور مدرسه',
    phone: '09138889900',
    notes: 'پیگیری منظم پرونده‌های نماد و هدایت تحصیلی',
    createdAt: `${getCurrentJalaliYear()}/07/02`,
  },
  {
    id: 'emp-9',
    code: '09',
    personnelCode: '201009',
    fullName: 'جواد قاسمی',
    schoolId: 'sch-3',
    schoolName: 'دبستان انقلاب اسلامی (دوره اول و دوم)',
    grade: 'ابتدایی دوره دوم',
    role: 'سایر',
    customRoleTitle: 'مربی امور تربیتی',
    phone: '09139990011',
    notes: 'مسئول اقامه نماز جماعت مدارس ابتدایی قطب ۲',
    createdAt: `${getCurrentJalaliYear()}/07/03`,
  },
  {
    id: 'emp-10',
    code: '10',
    personnelCode: '201010',
    fullName: 'محدثه اکبری',
    schoolId: 'sch-4',
    schoolName: 'هنرستان فنی دخترانه کوثر',
    grade: 'هنرستان فنی و حرفه‌ای و کاردانش',
    role: 'معاون پرورشی',
    phone: '09131114455',
    notes: 'برگزارکننده نمایشگاه‌های دست‌سازه‌های پرورشی و عفاف و حجاب',
    createdAt: `${getCurrentJalaliYear()}/07/04`,
  },
];

// Helper to seed realistic assignments
export function generateInitialAssignments(): EmployeeProgram[] {
  const assignments: EmployeeProgram[] = [];

  // Employee 01: 6 programs (4 Done, 1 Late, 1 Not done)
  assignments.push(
    {
      id: 'ep-1',
      employeeId: 'emp-1',
      employeeCode: '01',
      programId: 'prg-1', // coeff 3
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/08/20`,
      notes: 'مسابقات با شرکت ۸۵ دانش‌آموز برگزار و لیست نفرات برتر ارسال شد.',
      updatedAt: `${getCurrentJalaliYear()}/08/22`,
    },
    {
      id: 'ep-2',
      employeeId: 'emp-1',
      employeeCode: '01',
      programId: 'prg-2', // coeff 2
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/09/10`,
      notes: 'کانون یاریگران تشکیل و کارگاه برگزار گردید.',
      updatedAt: `${getCurrentJalaliYear()}/09/12`,
    },
    {
      id: 'ep-3',
      employeeId: 'emp-1',
      employeeCode: '01',
      programId: 'prg-4', // coeff 3
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/08/28`,
      notes: 'نماز جماعت هر روز دایر است.',
      updatedAt: `${getCurrentJalaliYear()}/08/30`,
    },
    {
      id: 'ep-4',
      employeeId: 'emp-1',
      employeeCode: '01',
      programId: 'prg-5', // coeff 1 (اختصاصی)
      status: 'late',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/10/02`,
      notes: 'اردو با هماهنگی مجدد با تاخیر یک هفته‌ای برگزار شد.',
      updatedAt: `${getCurrentJalaliYear()}/10/03`,
    },
    {
      id: 'ep-5',
      employeeId: 'emp-1',
      employeeCode: '01',
      programId: 'prg-6', // coeff 2
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/08/22`,
      notes: 'مراسم باشکوه یادواره شهدا در نمازخانه برگزار گردید.',
      updatedAt: `${getCurrentJalaliYear()}/08/24`,
    },
    {
      id: 'ep-6',
      employeeId: 'emp-1',
      employeeCode: '01',
      programId: 'prg-7', // coeff 2
      status: 'not_done',
      isManualOverride: false,
      notes: 'هنوز هماهنگی با استاد حوزه انجام نشده است.',
      updatedAt: `${getCurrentJalaliYear()}/10/05`,
    },
  );

  // Employee 02 (Zohreh Karimi): 6 programs (5 Done, 1 Late, 0 Not done) -> Top performer!
  assignments.push(
    {
      id: 'ep-7',
      employeeId: 'emp-2',
      employeeCode: '02',
      programId: 'prg-1', // coeff 3
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/08/18`,
      notes: 'ارسال عالی گزارش و عکس‌ها در موعد مقرر',
      updatedAt: `${getCurrentJalaliYear()}/08/19`,
    },
    {
      id: 'ep-8',
      employeeId: 'emp-2',
      employeeCode: '02',
      programId: 'prg-2', // coeff 2
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/09/05`,
      notes: 'تشکیل کامل کارگروه همتایان سلامت',
      updatedAt: `${getCurrentJalaliYear()}/09/06`,
    },
    {
      id: 'ep-9',
      employeeId: 'emp-2',
      employeeCode: '02',
      programId: 'prg-3', // coeff 2
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/10/10`,
      notes: 'ثبت ۴۲ اثر فرهنگی هنری در سامانه نورینو',
      updatedAt: `${getCurrentJalaliYear()}/10/11`,
    },
    {
      id: 'ep-10',
      employeeId: 'emp-2',
      employeeCode: '02',
      programId: 'prg-4', // coeff 3
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/08/25`,
      notes: 'نماز با حضور حداکثری دانش‌آموزان',
      updatedAt: `${getCurrentJalaliYear()}/08/26`,
    },
    {
      id: 'ep-11',
      employeeId: 'emp-2',
      employeeCode: '02',
      programId: 'prg-6', // coeff 2
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/08/20`,
      notes: 'نمایشگاه عکس شهدا و دعوت از مادر شهید',
      updatedAt: `${getCurrentJalaliYear()}/08/21`,
    },
    {
      id: 'ep-12',
      employeeId: 'emp-2',
      employeeCode: '02',
      programId: 'prg-7', // coeff 2
      status: 'late',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/10/12`,
      notes: 'به دلیل امتحانات دی‌ماه با تاخیر برگزار شد',
      updatedAt: `${getCurrentJalaliYear()}/10/13`,
    },
  );

  // Employee 03 (Reza Moradi): 5 programs (2 Done, 1 Late, 2 Not Done)
  assignments.push(
    {
      id: 'ep-13',
      employeeId: 'emp-3',
      employeeCode: '03',
      programId: 'prg-1',
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/08/25`,
      notes: 'مسابقات حفظ جز سی برای دانش‌آموزان ابتدایی',
      updatedAt: `${getCurrentJalaliYear()}/08/26`,
    },
    {
      id: 'ep-14',
      employeeId: 'emp-3',
      employeeCode: '03',
      programId: 'prg-3',
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/10/05`,
      notes: 'سرود همگانی با شرکت تمام پایه‌ها',
      updatedAt: `${getCurrentJalaliYear()}/10/06`,
    },
    {
      id: 'ep-15',
      employeeId: 'emp-3',
      employeeCode: '03',
      programId: 'prg-4',
      status: 'late',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/09/20`,
      notes: 'تجهیز نمازخانه کمی زمان‌بر بود',
      updatedAt: `${getCurrentJalaliYear()}/09/22`,
    },
    {
      id: 'ep-16',
      employeeId: 'emp-3',
      employeeCode: '03',
      programId: 'prg-5',
      status: 'not_done',
      isManualOverride: false,
      notes: 'عدم اخذ رضایت‌نامه اردو از سوی والدین',
      updatedAt: `${getCurrentJalaliYear()}/10/01`,
    },
    {
      id: 'ep-17',
      employeeId: 'emp-3',
      employeeCode: '03',
      programId: 'prg-6',
      status: 'not_done',
      isManualOverride: false,
      notes: 'گزارشی ثبت نشده است',
      updatedAt: `${getCurrentJalaliYear()}/09/01`,
    },
  );

  // Employee 04 (Elham Saeedi - Counselor): 4 programs
  assignments.push(
    {
      id: 'ep-18',
      employeeId: 'emp-4',
      employeeCode: '04',
      programId: 'prg-2',
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/09/12`,
      notes: 'کارگاه با همکاری اولیا برگزار شد',
      updatedAt: `${getCurrentJalaliYear()}/09/14`,
    },
    {
      id: 'ep-19',
      employeeId: 'emp-4',
      employeeCode: '04',
      programId: 'prg-8',
      status: 'done',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/09/08`,
      notes: 'غربالگری نماد ۹۵ درصد دانش‌آموزان ثبت گردید',
      updatedAt: `${getCurrentJalaliYear()}/09/10`,
    },
    {
      id: 'ep-20',
      employeeId: 'emp-4',
      employeeCode: '04',
      programId: 'prg-7',
      status: 'late',
      isManualOverride: false,
      actualDate: `${getCurrentJalaliYear()}/10/08`,
      notes: 'نشست مشاوره‌ای با تاخیر انجام شد',
      updatedAt: `${getCurrentJalaliYear()}/10/10`,
    },
    {
      id: 'ep-21',
      employeeId: 'emp-4',
      employeeCode: '04',
      programId: 'prg-5',
      status: 'not_done',
      isManualOverride: false,
      notes: 'مربوط به معاونت اجرایی بود',
      updatedAt: `${getCurrentJalaliYear()}/10/01`,
    },
  );

  // Other employees assignments:
  const otherEmployees = ['emp-5', 'emp-6', 'emp-7', 'emp-8', 'emp-9', 'emp-10'];
  const codeMap: Record<string, string> = {
    'emp-5': '05',
    'emp-6': '06',
    'emp-7': '07',
    'emp-8': '08',
    'emp-9': '09',
    'emp-10': '10',
  };

  let counter = 22;
  for (const empId of otherEmployees) {
    const code = codeMap[empId];
    // Assign 4 programs to each
    assignments.push(
      {
        id: `ep-${counter++}`,
        employeeId: empId,
        employeeCode: code,
        programId: 'prg-1',
        status: counter % 2 === 0 ? 'done' : 'late',
        isManualOverride: false,
        actualDate: counter % 2 === 0 ? `${getCurrentJalaliYear()}/08/22` : `${getCurrentJalaliYear()}/09/15`,
        notes: 'برگزاری مسابقات قرآن مرحله اول',
        updatedAt: `${getCurrentJalaliYear()}/09/16`,
      },
      {
        id: `ep-${counter++}`,
        employeeId: empId,
        employeeCode: code,
        programId: 'prg-4',
        status: 'done',
        isManualOverride: false,
        actualDate: `${getCurrentJalaliYear()}/08/29`,
        notes: 'اقامه نماز جماعت مستمر',
        updatedAt: `${getCurrentJalaliYear()}/08/30`,
      },
      {
        id: `ep-${counter++}`,
        employeeId: empId,
        employeeCode: code,
        programId: 'prg-6',
        status: counter % 3 === 0 ? 'not_done' : 'done',
        isManualOverride: false,
        actualDate: counter % 3 === 0 ? undefined : `${getCurrentJalaliYear()}/08/24`,
        notes: counter % 3 === 0 ? 'عدم ارسال مستندات یادواره' : 'اجرای طرح یادواره',
        updatedAt: `${getCurrentJalaliYear()}/09/01`,
      },
      {
        id: `ep-${counter++}`,
        employeeId: empId,
        employeeCode: code,
        programId: 'prg-2',
        status: counter % 2 === 1 ? 'late' : 'done',
        isManualOverride: false,
        actualDate: counter % 2 === 1 ? `${getCurrentJalaliYear()}/09/28` : `${getCurrentJalaliYear()}/09/14`,
        notes: 'پویش یاریگران زندگی',
        updatedAt: `${getCurrentJalaliYear()}/09/29`,
      },
    );
  }

  const platforms: ('ایتا' | 'شاد' | 'اتوماسیون' | 'سایر')[] = ['ایتا', 'شاد', 'اتوماسیون', 'سایر'];
  return assignments.map((a, idx) => {
    const execDate = a.actualDate;
    const subDate = execDate ? execDate : undefined;
    const plat = (a.status === 'done' || a.status === 'late') ? platforms[idx % platforms.length] : undefined;
    return {
      ...a,
      executionDate: execDate,
      submissionDate: subDate,
      docSubmissionDate: subDate,
      submissionPlatform: plat,
      documentationPlatform: plat,
      documentationNotes: plat ? `ارسال از طریق سامانه ${plat} (کد پیگیری ${1000 + idx})` : '',
    };
  });
}

export const INITIAL_SETTINGS = {
  officeTitle: 'اداره آموزش و پرورش ناحیه ۶ اصفهان',
  departmentTitle: 'کارشناسی امور پرورشی، فرهنگی، قرآن و عترت',
  officerName: 'کارشناس مسئول امور پرورشی',
  academicYear: `سال تحصیلی ${toPersianDigits(getCurrentJalaliYear())}-${toPersianDigits(Number(getCurrentJalaliYear()) + 1)}`,
  lastBackupDate: '',
  developerName: 'علیرضا شریعتی',
};

export function getInitialDatabase(): AppDatabase {
  return {
    employees: INITIAL_EMPLOYEES,
    schools: INITIAL_SCHOOLS,
    programs: INITIAL_PROGRAMS,
    employeePrograms: generateInitialAssignments(),
    settings: INITIAL_SETTINGS,
    version: 1,
  };
}
