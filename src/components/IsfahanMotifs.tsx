import React from 'react';

/**
 * Isfahan Province Architectural & Cultural Symbols
 * - Sheikh Lotfollah Dome & Shah Mosque Arabesque Domes (گنبدهای فیروزه‌ای نقش جهان)
 * - Si-o-se-pol & Khaju Bridge Arches (طاق‌ها و دهانه‌های پل خواجو و سی‌وسه‌پل)
 * - Ali Qapu Veranda (ایوان عالی‌قاپو) & Chehel Sotoun
 * - Historical Isfahan Sagittarius / Qeysarieh Portal Emblem (نماد تاریخی برج قوس اصفهان)
 * - Persian Turquoise & Azure Seven-Color Tilework (کاشی‌کاری هفت‌رنگ و گره‌چینی لاجوردی و فیروزه‌ای)
 * - Traditional Esfahani Toranj (ترنج و شمسه اسلیمی)
 */

// 1. Isfahan Skyline Silhouette (Naqsh-e Jahan, Sheikh Lotfollah Dome, Si-o-se-pol arches, Ali Qapu, Menar Jonban)
export const IsfahanSkyline: React.FC<{ className?: string; opacity?: number }> = ({
  className = 'w-full h-24',
  opacity = 0.25,
}) => {
  return (
    <svg
      viewBox="0 0 1200 160"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      preserveAspectRatio="none"
    >
      {/* Ground river base (Zayandeh Rood reflection line) */}
      <path d="M0,158 L1200,158 L1200,160 L0,160 Z" />

      {/* Si-o-se-pol & Khaju Arches */}
      <g id="bridge-arches">
        <rect x="20" y="110" width="310" height="12" rx="2" />
        <rect x="20" y="98" width="310" height="6" rx="1" />
        {[0, 32, 64, 96, 128, 160, 192, 224, 256, 288].map((offset, i) => (
          <g key={`arch-${i}`} transform={`translate(${28 + offset}, 122)`}>
            <rect x="0" y="0" width="6" height="36" />
            <path d="M6,36 L6,14 C6,4 12,0 16,0 C20,0 26,4 26,14 L26,36 Z" />
            <path d="M8, -12 C8, -19 12, -22 16, -22 C20, -22 24, -19 24, -12 Z" />
          </g>
        ))}
      </g>

      {/* Menar Jonban (Shaking Minarets) */}
      <g id="menar-jonban" transform="translate(360, 45)">
        <rect x="15" y="65" width="40" height="50" rx="1" />
        <path d="M20,115 L20,80 C20,70 35,66 35,66 C35,66 50,70 50,80 L50,115 Z" fill="#0284c7" fillOpacity="0.4" />
        <rect x="10" y="15" width="8" height="55" />
        <polygon points="14,-2 9,15 19,15" />
        <rect x="8" y="24" width="12" height="4" />
        <rect x="52" y="15" width="8" height="55" />
        <polygon points="56,-2 51,15 61,15" />
        <rect x="50" y="24" width="12" height="4" />
      </g>

      {/* Sheikh Lotfollah Dome */}
      <g id="sheikh-lotfollah-dome" transform="translate(460, 20)">
        <rect x="25" y="90" width="100" height="50" rx="2" />
        {[0, 16, 32, 48, 64, 80].map((dx, idx) => (
          <path key={`win-${idx}`} d={`M${35 + dx},120 L${35 + dx},102 C${35 + dx},96 ${43 + dx},96 ${43 + dx},102 L${43 + dx},120 Z`} fill="#0ea5e9" fillOpacity="0.5" />
        ))}
        <path d="M22,90 C22,35 60,6 75,0 C90,6 128,35 128,90 Z" />
        <path d="M74, -8 L76, -8 L76, 0 L74, 0 Z" />
        <circle cx="75" cy="-10" r="3" />
      </g>

      {/* Ali Qapu Palace & Veranda */}
      <g id="ali-qapu" transform="translate(630, 22)">
        <rect x="10" y="80" width="110" height="58" />
        <path d="M45,138 L45,95 C45,86 65,82 65,82 C65,82 85,86 85,95 L85,138 Z" fill="#0369a1" fillOpacity="0.3" />
        <rect x="5" y="15" width="120" height="15" rx="1" />
        <rect x="25" y="0" width="80" height="16" rx="1" />
        {[10, 24, 38, 52, 66, 80, 94, 108, 120].map((cx, idx) => (
          <rect key={`col-${idx}`} x={cx} y="28" width="3" height="54" />
        ))}
      </g>

      {/* Shah Mosque / Jameh Abbasi */}
      <g id="shah-mosque" transform="translate(780, 0)">
        <path d="M60,110 C60,45 88,14 105,4 C122,14 150,45 150,110 Z" />
        <rect x="62" y="108" width="86" height="52" />
        <path d="M104, -8 L106, -8 L106, 5 L104, 5 Z" />
        <circle cx="105" cy="-9" r="3" />
        <rect x="40" y="80" width="130" height="80" />
        <path d="M72,160 L72,95 C72,82 105,75 105,75 C105,75 138,82 138,95 L138,160 Z" fill="#0891b2" fillOpacity="0.4" />
        <rect x="30" y="24" width="8" height="136" />
        <polygon points="34,-4 28,24 40,24" />
        <rect x="26" y="38" width="16" height="5" />
        <rect x="27" y="80" width="14" height="4" />
        <rect x="172" y="24" width="8" height="136" />
        <polygon points="176,-4 170,24 182,24" />
        <rect x="168" y="38" width="16" height="5" />
        <rect x="169" y="80" width="14" height="4" />
      </g>

      {/* Chehel Sotoun */}
      <g id="chehel-sotoun" transform="translate(980, 48)">
        <polygon points="0,50 15,30 185,30 200,50" />
        <rect x="25" y="18" width="150" height="14" />
        {[15, 35, 55, 75, 95, 115, 135, 155, 175, 190].map((cx, idx) => (
          <rect key={`cs-col-${idx}`} x={cx} y="48" width="3" height="64" />
        ))}
        <rect x="60" y="60" width="80" height="52" />
        <path d="M80,112 L80,78 C80,68 100,64 100,64 C100,64 120,68 120,78 L120,112 Z" fill="#0284c7" fillOpacity="0.3" />
      </g>
    </svg>
  );
};

// 2. Isfahan Emblem: The Historical Sagittarius/Qeysarieh Arch + Turquoise Dome
export const IsfahanEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 44,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-br from-teal-700 via-cyan-800 to-blue-950 p-1.5 shadow-md border border-teal-400/40 ${className}`}
      style={{ width: size, height: size }}
      title="نشان استان اصفهان - نصف جهان"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-white"
      >
        <circle cx="50" cy="50" r="46" stroke="#5eead4" strokeWidth="2" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="41" stroke="#38bdf8" strokeWidth="1.5" />

        <path
          d="M24,84 L24,54 C24,34 50,20 50,20 C50,20 76,34 76,54 L76,84 Z"
          fill="#0f766e"
          fillOpacity="0.4"
          stroke="#99f6e4"
          strokeWidth="2"
        />

        <path
          d="M34,56 C34,36 45,26 50,22 C55,26 66,36 66,56 Z"
          fill="#38bdf8"
          fillOpacity="0.8"
        />
        <circle cx="50" cy="18" r="2.5" fill="#facc15" />
        <path d="M50,18 L50,23" stroke="#facc15" strokeWidth="1.5" />

        <path
          d="M32,84 L32,68 C32,63 38,60 41,60 C44,60 50,63 50,68 L50,84 M50,84 L50,68 C50,63 56,60 59,60 C62,60 68,63 68,68 L68,84"
          stroke="#fef08a"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M40,44 C45,38 55,38 60,44"
          stroke="#fef08a"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M50,34 L50,48 M47,37 L50,34 L53,37"
          stroke="#fef08a"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// 3. Persian Turquoise & Gold Tile Border Trim
export const IsfahanTileBorder: React.FC<{ className?: string }> = ({
  className = 'w-full h-2',
}) => {
  return (
    <div
      className={`overflow-hidden relative bg-gradient-to-r from-teal-800 via-sky-600 to-blue-900 ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(
          45deg,
          #0d9488 0px,
          #0d9488 10px,
          #0284c7 10px,
          #0284c7 20px,
          #d97706 20px,
          #d97706 23px,
          #1e3a8a 23px,
          #1e3a8a 33px
        )`,
      }}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px]" />
    </div>
  );
};

// 4. Safavid Pointed Arch Badge
export const IsfahanArchBadge: React.FC<{
  title: string;
  subtitle?: string;
  className?: string;
}> = ({ title, subtitle, className = '' }) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-gradient-to-r from-teal-50 via-sky-50 to-blue-50 border border-teal-200 text-teal-950 text-xs shadow-xs ${className}`}
    >
      <span className="text-teal-600 font-bold text-sm">✦</span>
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-teal-900">{title}</span>
        {subtitle && (
          <>
            <span className="text-teal-400">•</span>
            <span className="text-teal-700 text-[11px]">{subtitle}</span>
          </>
        )}
      </div>
      <span className="text-sky-600 font-bold text-sm">✦</span>
    </div>
  );
};

// 5. Authentic Persian Arabesque Toranj
export const IsfahanToranjWatermark: React.FC<{ className?: string; opacity?: number }> = ({
  className = 'w-32 h-32',
  opacity = 0.08,
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
    >
      <g transform="translate(50,50)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
          <g key={idx} transform={`rotate(${angle})`}>
            <path d="M0, -46 C8, -36 12, -22 0, -10 C-12, -22 -8, -36 0, -46 Z" />
            <path
              d="M0, -28 C6, -24 8, -16 3, -12 C-2, -8 -6, -14 0, -28 Z"
              fill="#0d9488"
            />
            <circle cx="0" cy="-48" r="1.5" />
          </g>
        ))}
        <circle cx="0" cy="0" r="10" />
        <circle cx="0" cy="0" r="6" fill="#f59e0b" />
        <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
      </g>
    </svg>
  );
};

// 6. Cultural Heritage Footer / Banner Bar
export const IsfahanHeritageBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`p-3 bg-gradient-to-r from-teal-900 via-sky-950 to-indigo-950 text-white rounded-2xl border border-teal-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
          <span className="text-teal-300 text-base">🕌</span>
        </div>
        <div>
          <div className="font-bold text-teal-200">
            استان اصفهان؛ نصف جهان، پایتخت فرهنگ و تمدن ایران اسلامی
          </div>
          <div className="text-[11px] text-teal-300/80">
            اداره آموزش و پرورش ناحیه ۶ اصفهان | مهد پرورش نخبگان، مفاخر علمی و هنرمندان نامدار
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-sky-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
        <span>سی‌وسه‌پل</span>
        <span className="text-teal-400">•</span>
        <span>میدان نقش جهان</span>
        <span className="text-teal-400">•</span>
        <span>مسجد شیخ لطف‌الله</span>
        <span className="text-teal-400">•</span>
        <span>پل خواجو</span>
        <span className="text-teal-400">•</span>
        <span>چهل‌ستون</span>
      </div>
    </div>
  );
};
