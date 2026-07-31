import React from 'react';
import { FacultyType } from '../types';
import { GraduationCap, Building2, Users, CheckCircle2 } from 'lucide-react';

interface FacultyTypeSelectorProps {
  value: FacultyType;
  onChange: (type: FacultyType) => void;
}

export const FacultyTypeSelector: React.FC<FacultyTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  const options: { type: FacultyType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      type: '교원',
      label: '교원',
      desc: '교장, 교감, 교사 등 교원 직렬',
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      type: '지방공무원',
      label: '지방공무원',
      desc: '행정, 시설, 사서 등 일반/기술직',
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      type: '교육공무직',
      label: '교육공무직',
      desc: '교무행정사, 조리실무사, 돌봄전담사 등',
      icon: <Users className="w-5 h-5" />,
    }
  ];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span>교직원 유형 선택</span>
          <span className="text-indigo-600 font-bold">*</span>
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = value === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              id={`faculty-type-${opt.type}`}
              onClick={() => onChange(opt.type)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {opt.icon}
                </div>
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300" />
                )}
              </div>

              <div>
                <span className={`font-bold text-sm block ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block leading-normal">{opt.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
