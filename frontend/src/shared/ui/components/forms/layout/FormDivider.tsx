import React from 'react';

const FormDivider: React.FC<{ label?: string }> = ({ label = 'Or' }) => (
  <div className="flex items-center gap-3 text-xs text-slate-500">
    <div className="h-px bg-slate-200/70 flex-1" />
    <span>{label}</span>
    <div className="h-px bg-slate-200/70 flex-1" />
  </div>
);

export default FormDivider;
