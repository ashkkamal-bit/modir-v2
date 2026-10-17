import React, { useState, useEffect } from 'react';
import { Program, ProgramAxis, ProgramScope, ProgramCoefficient } from '../types';
import { getCurrentJalaliDate, toPersianDigits } from '../utils/jalali';
import { X, BookOpen, Save, AlertCircle, Globe, Star, Zap, Award } from 'lucide-react';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (programData: Omit<Program, 'id' | 'createdAt'>, existingId?: string) => void;
  existingProgram?: Program | null;
  existingPrograms: Program[];
}

const AXES: ProgramAxis[] = [
  'پرورشی',
  'آموزش ابتدایی',
  'آموزش متوسطه اول',
  'آموزش متوسطه دوم',
  'تربیت بدنی',
];

export const ProgramModal: React.FC<ProgramModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingProgram,
  existingPrograms,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [axis, setAxis] = useState<ProgramAxis>('پرورشی');
  const [scope, setScope] = useState<ProgramScope>('همگانی');
  const [coefficient, setCoefficient] = useState<ProgramCoefficient>(1);
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (existingProgram) {
      setCode(existingProgram.code);
      setTitle(existingProgram.title);
      setAxis(existingProgram.axis);
      setScope(existingProgram.scope || 'همگانی');
      const rawC = Number(existingProgram.coefficient);
      setCoefficient(([1, 2, 3].includes(rawC)) ? (rawC as ProgramCoefficient) : 1);
      setStartDate(existingProgram.startDate);
      setDeadline(existingProgram.deadline);
      setDescription(existingProgram.description || '');
      setIsActive(existingProgram.isActive);
      setErrorMessage('');
    } else {
      const today = getCurrentJalaliDate();
      const nextNum = existingPrograms.length + 1;
      setCode(`PRG-${String(nextNum).padStart(2, '0')}`);
      setTitle('');
      setAxis('پرورشی');
      setScope('همگانی');
      setCoefficient(1);
      setStartDate(today);
      setDeadline('1403/10/30');
      setDescription('');
      setIsActive(true);
      setErrorMessage('');
    }
  }, [existingProgram, isOpen, existingPrograms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!code.trim() || !title.trim() || !deadline.trim()) {
      setErrorMessage('کد برنامه، عنوان و مهلت نهایی اجرا الزامی هستند.');
      return;
    }

    onSave(
      {
        code: code.trim(),
        title: title.trim(),
        axis,
        scope,
        coefficient,
        startDate: startDate.trim() || getCurrentJalaliDate(),
        deadline: deadline.trim(),
        description: description.trim(),
        isActive,
      },
      existingProgram?.id,
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-blue-200" />
            <h3 className="text-lg font-bold">
              {existingProgram ? 'ویرایش طرح / برنامه پرورشی' : 'تعریف طرح یا برنامه پرورشی جدید'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                کد برنامه <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PRG-01"
                className="w-full text-center font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden text-sm"
                required
              />
            </div>

            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان برنامه یا طرح <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مسابقات قرآن و عترت مرحله آموزشگاه"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden text-sm"
                required
              />
            </div>
          </div>

          {/* Axis */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              محور برنامه <span className="text-rose-500">*</span>
            </label>
            <select
              value={axis}
              onChange={(e) => setAxis(e.target.value as ProgramAxis)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden text-sm"
              required
            >
              {AXES.map((ax) => (
                <option key={ax} value={ax}>
                  {ax}
                </option>
              ))}
            </select>
          </div>

          {/* Scope: همگانی vs اختصاصی (نقش در امتیازدهی) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 mb-2">
              نوع برنامه و شمولیت در ارزیابی: <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScope('همگانی')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-start gap-2.5 ${
                  scope === 'همگانی'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${scope === 'همگانی' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span>برنامه همگانی</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${scope === 'همگانی' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
                      مؤثر در امتیاز با ضریب
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-snug ${scope === 'همگانی' ? 'text-blue-100' : 'text-slate-500'}`}>
                    مشمول ارزیابی؛ امتیازات آن با ضریب انتخابی در رتبه‌بندی نهایی مدارس و همکاران ضرب می‌شود.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('اختصاصی')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-start gap-2.5 ${
                  scope === 'اختصاصی'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${scope === 'اختصاصی' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'}`}>
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span>برنامه اختصاصی</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${scope === 'اختصاصی' ? 'bg-amber-400 text-amber-950 font-bold' : 'bg-amber-100 text-amber-800'}`}>
                      بدون تأثیر در رتبه
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-snug ${scope === 'اختصاصی' ? 'text-purple-100' : 'text-slate-500'}`}>
                    طرح‌های موردی، داوطلبانه یا مدارس خاص؛ در رتبه‌بندی و فرمول امتیاز همکاران محاسبه نمی‌شود.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Coefficient Selector: ضریب امتیازی از ۱ تا ۳ */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>ضریب امتیازی برنامه (از ۱ تا ۳ برای اهمیت دادن به طرح‌های مهم):</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                ضریب فعلی: {toPersianDigits(coefficient)}
              </span>
            </div>
            <p className="text-[11px] text-amber-900/80 mb-3 leading-relaxed">
              این ضریب در امتیاز نهایی مدارس و همکاران ضرب می‌شود (مثلاً با ضریب ۳، اجرای به‌موقع ۳۰۰ امتیاز و اجرای با تاخیر ۱۸۰ امتیاز کسب می‌کند).
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Coefficient 1 */}
              <button
                type="button"
                onClick={() => setCoefficient(1)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  coefficient === 1
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                }`}
              >
                <span className="text-sm font-black font-mono">ضریب ۱</span>
                <span className={`text-[11px] mt-0.5 font-bold ${coefficient === 1 ? 'text-amber-100' : 'text-slate-500'}`}>
                  طرح عادی
                </span>
                <span className={`text-[10px] mt-1 ${coefficient === 1 ? 'text-amber-200' : 'text-slate-400'}`}>
                  (۱۰۰ امتیاز به‌موقع)
                </span>
              </button>

              {/* Coefficient 2 */}
              <button
                type="button"
                onClick={() => setCoefficient(2)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  coefficient === 2
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <span className="text-sm font-black font-mono">ضریب ۲</span>
                  <span className="text-xs">⭐</span>
                </div>
                <span className={`text-[11px] mt-0.5 font-bold ${coefficient === 2 ? 'text-amber-100' : 'text-amber-700'}`}>
                  طرح بااهمیت
                </span>
                <span className={`text-[10px] mt-1 ${coefficient === 2 ? 'text-amber-200' : 'text-slate-400'}`}>
                  (۲۰۰ امتیاز به‌موقع)
                </span>
              </button>

              {/* Coefficient 3 */}
              <button
                type="button"
                onClick={() => setCoefficient(3)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  coefficient === 3
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <span className="text-sm font-black font-mono">ضریب ۳</span>
                  <span className="text-xs">⭐⭐</span>
                </div>
                <span className={`text-[11px] mt-0.5 font-bold ${coefficient === 3 ? 'text-amber-100' : 'text-amber-900'}`}>
                  طرح ویژه و کلیدی
                </span>
                <span className={`text-[10px] mt-1 ${coefficient === 3 ? 'text-amber-200' : 'text-slate-400'}`}>
                  (۳۰۰ امتیاز به‌موقع)
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ شروع (شمسی)</label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="1403/07/01"
                dir="ltr"
                className="w-full text-center px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden text-sm font-mono"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مهلت نهایی اجرا (شمسی) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="1403/09/30"
                dir="ltr"
                className="w-full text-center px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden text-sm font-mono font-bold text-rose-600"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">شرح و دستورالعمل اجرایی</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نحوه اجرا، مستندات مورد نیاز، نحوه ارسال گزارش و بازخورد..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden text-sm"
            />
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              طرح / برنامه فعال است و در اولویت پیگیری قرار دارد
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{existingProgram ? 'ذخیره تغییرات' : 'ثبت برنامه'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
