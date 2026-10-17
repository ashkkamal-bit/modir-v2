import React, { useState, useEffect, useCallback } from 'react';
import {
  AppDatabase,
  Employee,
  Program,
  School,
  EmployeeProgram,
  SystemSettings,
  ExecutionStatus,
} from './types';
import {
  loadDatabase,
  saveDatabase,
  resetDatabaseToDefault,
} from './utils/storage';
import { exportFullExcelReport } from './utils/excelExport';
import { exportFullHtmlReport } from './utils/htmlExport';
import { padZero, getCurrentJalaliDate } from './utils/jalali';

// Components
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { EmployeeCartable } from './components/EmployeeCartable';
import { EmployeesManagement } from './components/EmployeesManagement';
import { ProgramsManagement } from './components/ProgramsManagement';
import { PerformanceReport } from './components/PerformanceReport';
import { ColleagueRanking } from './components/ColleagueRanking';
import { SchoolPerformanceReport } from './components/SchoolPerformanceReport';
import { ProgramPerformanceReport } from './components/ProgramPerformanceReport';
import { ExcelExportCenter } from './components/ExcelExportCenter';
import { ExcelBulkImport } from './components/ExcelBulkImport';
import { BackupSettings } from './components/BackupSettings';
import { UserGuide } from './components/UserGuide';
import { IsfahanTileBorder } from './components/IsfahanMotifs';

// Modals
import { EmployeeModal } from './components/EmployeeModal';
import { ProgramModal } from './components/ProgramModal';
import { SchoolModal } from './components/SchoolModal';
import { ProgramAssignmentModal } from './components/ProgramAssignmentModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(() => {
    return db.employees[0] || null;
  });

  // Modal states
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignPreselectedEmpId, setAssignPreselectedEmpId] = useState<string | undefined>();
  const [assignPreselectedPrgId, setAssignPreselectedPrgId] = useState<string | undefined>();

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  // Synchronize global font class on body
  useEffect(() => {
    const font = db.settings.selectedFont || 'vazir';
    document.body.classList.remove(
      'font-theme-vazir',
      'font-theme-mitra',
      'font-theme-titr',
      'font-theme-nastaliq',
    );
    document.body.classList.add(`font-theme-${font}`);
  }, [db.settings.selectedFont]);

  // Save DB automatically on change
  const updateDatabase = useCallback(
    (newDb: AppDatabase) => {
      setDb(newDb);
      saveDatabase(newDb);
      if (selectedEmployee) {
        const synced = newDb.employees.find((e) => e.id === selectedEmployee.id);
        setSelectedEmployee(synced || newDb.employees[0] || null);
      }
    },
    [selectedEmployee],
  );

  // Quick Jump by 2-digit Code
  const handleQuickJump = useCallback(
    (code: string): boolean => {
      const padded = padZero(code);
      const found = db.employees.find((e) => e.code === padded);
      if (found) {
        setSelectedEmployee(found);
        setCurrentTab('cartable');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return true;
      }
      return false;
    },
    [db.employees],
  );

  // Select employee helper
  const handleSelectEmployee = useCallback((emp: Employee) => {
    setSelectedEmployee(emp);
    setCurrentTab('cartable');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Employee CRUD
  const handleSaveEmployee = (
    empData: Omit<Employee, 'id' | 'createdAt'>,
    existingId?: string,
    newSchoolToCreate?: Omit<School, 'id'>,
  ) => {
    let updatedSchools = db.schools;
    let finalSchoolId = empData.schoolId;
    let finalSchoolName = empData.schoolName;

    if (newSchoolToCreate) {
      const createdSchool: School = {
        ...newSchoolToCreate,
        id: `sch_${Date.now()}`,
      };
      updatedSchools = [...db.schools, createdSchool];
      finalSchoolId = createdSchool.id;
      finalSchoolName = createdSchool.name;
    }

    const targetEmpData = {
      ...empData,
      schoolId: finalSchoolId,
      schoolName: finalSchoolName,
    };

    let updatedEmployees: Employee[];
    let targetEmp: Employee;

    if (existingId) {
      const existing = db.employees.find((e) => e.id === existingId);
      targetEmp = {
        ...targetEmpData,
        id: existingId,
        createdAt: existing?.createdAt || getCurrentJalaliDate(),
      };
      updatedEmployees = db.employees.map((e) => (e.id === existingId ? targetEmp : e));
      if (newSchoolToCreate) {
        showToast(
          `مشخصات همکار «${targetEmpData.fullName}» به‌روزرسانی شد و آموزشگاه «${finalSchoolName}» به لیست اضافه شد.`,
        );
      } else {
        showToast(`اطلاعات همکار «${empData.fullName}» با موفقیت ویرایش شد.`);
      }
    } else {
      targetEmp = {
        ...targetEmpData,
        id: `emp_${Date.now()}`,
        createdAt: getCurrentJalaliDate(),
      };
      updatedEmployees = [targetEmp, ...db.employees];
      if (newSchoolToCreate) {
        showToast(
          `همکار جدید «${targetEmpData.fullName}» و آموزشگاه «${finalSchoolName}» با موفقیت به سیستم اضافه شدند.`,
        );
      } else {
        showToast(`همکار جدید «${empData.fullName}» با کد ${empData.code} افزوده شد.`);
      }
    }

    updateDatabase({
      ...db,
      schools: updatedSchools,
      employees: updatedEmployees,
    });
    setSelectedEmployee(targetEmp);
  };

  const handleDeleteEmployee = (empId: string) => {
    const emp = db.employees.find((e) => e.id === empId);
    if (!emp) return;

    if (
      window.confirm(
        `آیا از حذف همکار «${emp.fullName}» (کد ${emp.code}) و تمامی سوابق تکالیف او اطمینان دارید؟`,
      )
    ) {
      const updatedEmployees = db.employees.filter((e) => e.id !== empId);
      const updatedAssignments = db.employeePrograms.filter((ep) => ep.employeeId !== empId);

      updateDatabase({
        ...db,
        employees: updatedEmployees,
        employeePrograms: updatedAssignments,
      });

      if (selectedEmployee?.id === empId) {
        setSelectedEmployee(updatedEmployees[0] || null);
      }
      showToast(`همکار «${emp.fullName}» حذف شد.`);
    }
  };

  // Program CRUD
  const handleSaveProgram = (
    prgData: Omit<Program, 'id' | 'createdAt'>,
    existingId?: string,
  ) => {
    let updatedPrograms: Program[];

    if (existingId) {
      const existing = db.programs.find((p) => p.id === existingId);
      updatedPrograms = db.programs.map((p) =>
        p.id === existingId
          ? { ...prgData, id: existingId, createdAt: existing?.createdAt || getCurrentJalaliDate() }
          : p,
      );
      showToast(`طرح «${prgData.title}» (ضریب ${prgData.coefficient}) به‌روزرسانی شد.`);
    } else {
      const newPrg: Program = {
        ...prgData,
        id: `prg_${Date.now()}`,
        createdAt: getCurrentJalaliDate(),
      };
      updatedPrograms = [newPrg, ...db.programs];
      showToast(`برنامه جدید «${prgData.title}» با کد ${prgData.code} و ضریب ${prgData.coefficient} تعریف شد.`);
    }

    updateDatabase({
      ...db,
      programs: updatedPrograms,
    });
  };

  const handleDeleteProgram = (prgId: string) => {
    const prg = db.programs.find((p) => p.id === prgId);
    if (!prg) return;

    if (
      window.confirm(
        `آیا از حذف طرح «${prg.title}» و حذف تکالیف مربوط به آن برای تمام همکاران اطمینان دارید؟`,
      )
    ) {
      const updatedPrograms = db.programs.filter((p) => p.id !== prgId);
      const updatedAssignments = db.employeePrograms.filter((ep) => ep.programId !== prgId);

      updateDatabase({
        ...db,
        programs: updatedPrograms,
        employeePrograms: updatedAssignments,
      });
      showToast(`طرح «${prg.title}» حذف گردید.`);
    }
  };

  const handleToggleProgramActive = (prgId: string) => {
    const updatedPrograms = db.programs.map((p) =>
      p.id === prgId ? { ...p, isActive: !p.isActive } : p,
    );
    updateDatabase({
      ...db,
      programs: updatedPrograms,
    });
  };

  // School CRUD
  const handleSaveSchool = (schoolData: Omit<School, 'id'>, existingId?: string) => {
    let updatedSchools: School[];
    if (existingId) {
      updatedSchools = db.schools.map((s) =>
        s.id === existingId ? { ...schoolData, id: existingId } : s,
      );
      showToast(`اطلاعات آموزشگاه «${schoolData.name}» ویرایش شد.`);
    } else {
      const newSchool: School = { ...schoolData, id: `sch_${Date.now()}` };
      updatedSchools = [...db.schools, newSchool];
      showToast(`آموزشگاه «${schoolData.name}» ثبت شد.`);
    }

    updateDatabase({
      ...db,
      schools: updatedSchools,
    });
  };

  const handleDeleteSchool = (schoolId: string) => {
    const school = db.schools.find((s) => s.id === schoolId);
    if (!school) return;

    const linkedStaff = db.employees.filter((e) => e.schoolId === schoolId);
    const confirmMessage =
      linkedStaff.length > 0
        ? `آیا از حذف آموزشگاه «${school.name}» (کد ${school.code}) اطمینان دارید؟\nتوجه: ${linkedStaff.length} همکار در این آموزشگاه ثبت هستند. با حذف آموزشگاه، وضعیت مدرسه این همکاران به «نامشخص» تغییر خواهد یافت.`
        : `آیا از حذف آموزشگاه «${school.name}» (کد ${school.code}) اطمینان دارید؟`;

    if (window.confirm(confirmMessage)) {
      const updatedSchools = db.schools.filter((s) => s.id !== schoolId);
      const updatedEmployees = db.employees.map((e) =>
        e.schoolId === schoolId
          ? { ...e, schoolId: '', schoolName: 'نامشخص / تفکیک‌نشده' }
          : e,
      );

      updateDatabase({
        ...db,
        schools: updatedSchools,
        employees: updatedEmployees,
      });
      showToast(`آموزشگاه «${school.name}» با موفقیت از سیستم حذف گردید.`);
    }
  };

  // Assignment Group or Single
  const handleAssignPrograms = (programId: string, employeeIds: string[]) => {
    const newAssignments: EmployeeProgram[] = [];
    const now = getCurrentJalaliDate();

    for (const eId of employeeIds) {
      const emp = db.employees.find((e) => e.id === eId);
      const exists = db.employeePrograms.some(
        (ep) => ep.programId === programId && ep.employeeId === eId,
      );
      if (!exists) {
        newAssignments.push({
          id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          employeeId: eId,
          employeeCode: emp?.code || '',
          programId,
          status: 'not_done',
          isManualOverride: false,
          updatedAt: now,
        });
      }
    }

    if (newAssignments.length === 0) {
      showToast('تمامی همکاران انتخاب شده قبلاً به این برنامه تخصیص یافته بودند.');
      return;
    }

    updateDatabase({
      ...db,
      employeePrograms: [...db.employeePrograms, ...newAssignments],
    });
    showToast(`${newAssignments.length} همکار با موفقیت به این طرح تخصیص داده شدند.`);
  };

  // Update Single Assignment
  const handleUpdateAssignment = (updated: Partial<EmployeeProgram> & { id: string }) => {
    const updatedAssignments = db.employeePrograms.map((ep) => {
      if (ep.id === updated.id) {
        return {
          ...ep,
          ...updated,
          updatedAt: new Date().toISOString(),
        };
      }
      return ep;
    });

    updateDatabase({
      ...db,
      employeePrograms: updatedAssignments,
    });
    showToast('وضعیت اجرای برنامه با موفقیت به‌روزرسانی شد.');
  };

  // Delete Assignment for Single Employee
  const handleDeleteAssignment = (assignmentId: string) => {
    const assignment = db.employeePrograms.find((ep) => ep.id === assignmentId);
    if (!assignment) return;
    const prg = db.programs.find((p) => p.id === assignment.programId);
    const emp = db.employees.find((e) => e.id === assignment.employeeId);
    const prgTitle = prg ? `«${prg.title}»` : 'این برنامه';
    const empName = emp ? `«${emp.fullName}»` : 'این همکار';

    const updatedAssignments = db.employeePrograms.filter((ep) => ep.id !== assignmentId);
    updateDatabase({
      ...db,
      employeePrograms: updatedAssignments,
    });
    showToast(`برنامه ${prgTitle} از کارتابل ${empName} حذف گردید.`);
  };

  // Unassign/Remove Program from Specific Employee directly
  const handleUnassignProgramFromEmployee = (programId: string, employeeId: string) => {
    const targetAssignment = db.employeePrograms.find(
      (ep) => ep.programId === programId && ep.employeeId === employeeId,
    );
    if (!targetAssignment) return;
    const prg = db.programs.find((p) => p.id === programId);
    const emp = db.employees.find((e) => e.id === employeeId);
    const prgTitle = prg ? `«${prg.title}»` : 'این برنامه';
    const empName = emp ? `«${emp.fullName}»` : 'این همکار';

    const updatedAssignments = db.employeePrograms.filter((ep) => ep.id !== targetAssignment.id);
    updateDatabase({
      ...db,
      employeePrograms: updatedAssignments,
    });
    showToast(`برنامه ${prgTitle} برای همکار ${empName} با موفقیت حذف / لغو گردید.`);
  };

  // Batch Update Assignments
  const handleBatchUpdateAssignments = (
    updates: (Partial<EmployeeProgram> & { id: string })[],
  ) => {
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    const now = new Date().toISOString();

    const updatedAssignments = db.employeePrograms.map((ep) => {
      const up = updateMap.get(ep.id);
      if (up) {
        const execDate = up.executionDate || up.actualDate || ep.executionDate || ep.actualDate;
        const subDate = up.submissionDate || up.docSubmissionDate || ep.submissionDate || ep.docSubmissionDate || execDate;
        return {
          ...ep,
          ...up,
          actualDate: execDate,
          executionDate: execDate,
          submissionDate: subDate,
          docSubmissionDate: subDate,
          updatedAt: now,
        };
      }
      return ep;
    });

    updateDatabase({
      ...db,
      employeePrograms: updatedAssignments,
    });
    showToast(`وضعیت ${updates.length} برنامه به صورت یکجا ذخیره شد.`);
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: SystemSettings) => {
    updateDatabase({
      ...db,
      settings: newSettings,
    });
    showToast('تنظیمات سربرگ اداری با موفقیت ذخیره شد.');
  };

  const handleOpenAssignModal = (preEmpId?: string, prePrgId?: string) => {
    setAssignPreselectedEmpId(preEmpId);
    setAssignPreselectedPrgId(prePrgId);
    setIsAssignModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-slide-up no-print">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        settings={db.settings}
        selectedEmployee={selectedEmployee}
        onQuickJump={handleQuickJump}
        onOpenAssignModal={() => handleOpenAssignModal()}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        db={db}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab 1: Dashboard */}
        {currentTab === 'dashboard' && (
          <Dashboard
            employees={db.employees}
            programs={db.programs}
            schools={db.schools}
            employeePrograms={db.employeePrograms}
            settings={db.settings}
            onQuickJump={handleQuickJump}
            onNavigate={setCurrentTab}
            onSelectEmployee={handleSelectEmployee}
            onOpenNewEmployeeModal={() => {
              setEditingEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
            onOpenNewProgramModal={() => {
              setEditingProgram(null);
              setIsProgramModalOpen(true);
            }}
            onOpenAssignModal={() => handleOpenAssignModal()}
            onExportExcel={() => exportFullExcelReport(db)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}

        {/* Tab 2: Colleague Cartable */}
        {currentTab === 'cartable' && (
          selectedEmployee ? (
            <EmployeeCartable
              employee={selectedEmployee}
              allEmployees={db.employees}
              programs={db.programs}
              employeePrograms={db.employeePrograms}
              onSelectEmployee={setSelectedEmployee}
              onUpdateAssignment={handleUpdateAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              onSaveBatch={handleBatchUpdateAssignments}
              onOpenAssignModal={(empId) => handleOpenAssignModal(empId)}
              onQuickCodeSearch={handleQuickJump}
            />
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-xs">
              <h3 className="text-lg font-bold text-slate-800 mb-2">کارتابلی انتخاب نشده است</h3>
              <p className="text-xs text-slate-500 mb-6">
                لطفاً کد ۲ رقمی همکار را در کادر جستجوی بالا وارد کنید یا یکی از همکاران را از لیست انتخاب نمایید.
              </p>
              <button
                onClick={() => setCurrentTab('employees')}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                مشاهده لیست همکاران
              </button>
            </div>
          )
        )}

        {/* Tab 3: Employees Management */}
        {currentTab === 'employees' && (
          <EmployeesManagement
            employees={db.employees}
            schools={db.schools}
            onSelectEmployee={handleSelectEmployee}
            onOpenNewModal={() => {
              setEditingEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
            onEditEmployee={(emp) => {
              setEditingEmployee(emp);
              setIsEmployeeModalOpen(true);
            }}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {/* Tab 4: Programs Management */}
        {currentTab === 'programs' && (
          <ProgramsManagement
            programs={db.programs}
            onOpenNewProgramModal={() => {
              setEditingProgram(null);
              setIsProgramModalOpen(true);
            }}
            onEditProgram={(prg) => {
              setEditingProgram(prg);
              setIsProgramModalOpen(true);
            }}
            onDeleteProgram={handleDeleteProgram}
            onOpenAssignModal={(prgId) => handleOpenAssignModal(undefined, prgId)}
            onToggleActive={handleToggleProgramActive}
          />
        )}

        {/* Tab 5: Colleague Ranking & Leaderboard */}
        {currentTab === 'ranking' && (
          <ColleagueRanking
            employees={db.employees}
            employeePrograms={db.employeePrograms}
            programs={db.programs}
            schools={db.schools}
            onSelectEmployee={handleSelectEmployee}
            onExportHtml={() => exportFullHtmlReport(db)}
          />
        )}

        {/* Tab 6: Performance Report (All Colleagues) */}
        {currentTab === 'performance_report' && (
          <PerformanceReport
            employees={db.employees}
            employeePrograms={db.employeePrograms}
            programs={db.programs}
            schools={db.schools}
            onSelectEmployee={handleSelectEmployee}
            onExportExcel={() => exportFullExcelReport(db)}
          />
        )}

        {/* Tab 7: School Performance Report */}
        {currentTab === 'schools_report' && (
          <SchoolPerformanceReport
            schools={db.schools}
            employees={db.employees}
            employeePrograms={db.employeePrograms}
            programs={db.programs}
            onOpenNewSchoolModal={() => {
              setEditingSchool(null);
              setIsSchoolModalOpen(true);
            }}
            onEditSchool={(school) => {
              setEditingSchool(school);
              setIsSchoolModalOpen(true);
            }}
            onDeleteSchool={handleDeleteSchool}
            onExportExcel={() => exportFullExcelReport(db)}
            onFilterBySchool={(schoolId) => {
              setCurrentTab('performance_report');
            }}
          />
        )}

        {/* Tab 8: Program Performance Report */}
        {currentTab === 'programs_report' && (
          <ProgramPerformanceReport
            programs={db.programs}
            employees={db.employees}
            employeePrograms={db.employeePrograms}
            onOpenNewProgramModal={() => {
              setEditingProgram(null);
              setIsProgramModalOpen(true);
            }}
            onOpenAssignModal={(prgId) => handleOpenAssignModal(undefined, prgId)}
            onSelectEmployee={handleSelectEmployee}
            onExportExcel={() => exportFullExcelReport(db)}
            onUpdateStatus={handleUpdateAssignment}
          />
        )}

        {/* Tab 8.5: Excel Bulk Import */}
        {currentTab === 'excel_import' && (
          <ExcelBulkImport
            db={db}
            onUpdateDatabase={updateDatabase}
            onNavigateToTab={setCurrentTab}
          />
        )}

        {/* Tab 9: Excel Export Center */}
        {currentTab === 'excel_export' && <ExcelExportCenter db={db} />}

        {/* Tab 10: Backup & Settings */}
        {currentTab === 'backup_settings' && (
          <BackupSettings
            db={db}
            onUpdateDatabase={updateDatabase}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {/* Tab 11: User Guide */}
        {currentTab === 'guide' && <UserGuide />}
      </main>

      {/* Footer with Isfahan Tilework Ribbon */}
      <footer className="bg-white border-t border-slate-200 mt-12 text-center text-xs text-slate-500 no-print overflow-hidden">
        <IsfahanTileBorder className="w-full h-1.5" />
        <div className="py-6 max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
            <span className="font-bold text-slate-700">
              {db.settings.officeTitle} — {db.settings.departmentTitle}
            </span>
            <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-bold">
              نصف جهان
            </span>
          </div>
          <span className="text-slate-400">
            سامانه ارزشیابی عملکرد نیروهای آموزش و پرورش ناحیه ۶ اصفهان | طراح و توسعه‌دهنده: <strong className="text-slate-700">{db.settings.developerName || 'علیرضا شریعتی'}</strong>
          </span>
        </div>
      </footer>

      {/* Modals Container */}
      {isEmployeeModalOpen && (
        <EmployeeModal
          isOpen={isEmployeeModalOpen}
          onClose={() => {
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
          }}
          onSave={handleSaveEmployee}
          existingEmployee={editingEmployee}
          schools={db.schools}
          existingEmployees={db.employees}
        />
      )}

      {isProgramModalOpen && (
        <ProgramModal
          isOpen={isProgramModalOpen}
          onClose={() => {
            setIsProgramModalOpen(false);
            setEditingProgram(null);
          }}
          onSave={handleSaveProgram}
          existingProgram={editingProgram}
          existingPrograms={db.programs}
        />
      )}

      {isSchoolModalOpen && (
        <SchoolModal
          isOpen={isSchoolModalOpen}
          onClose={() => {
            setIsSchoolModalOpen(false);
            setEditingSchool(null);
          }}
          onSave={handleSaveSchool}
          existingSchool={editingSchool}
          existingSchools={db.schools}
        />
      )}

      {isAssignModalOpen && (
        <ProgramAssignmentModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          programs={db.programs}
          employees={db.employees}
          existingAssignments={db.employeePrograms}
          onAssign={handleAssignPrograms}
          onUnassign={handleUnassignProgramFromEmployee}
          preselectedProgramId={assignPreselectedPrgId}
          preselectedEmployeeId={assignPreselectedEmpId}
        />
      )}

      {/* Quick Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        db={db}
        onUpdateDatabase={updateDatabase}
        onNavigateToSettings={() => setCurrentTab('backup_settings')}
      />
    </div>
  );
}
