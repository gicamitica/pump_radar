import React from 'react';
import ActionButton from '@/components/forms/buttons/ActionButton';

const MfaSetupForm: React.FC<{ onContinue?: () => void }> = ({ onContinue }) => {
  const qr = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" rx="12" fill="%23e5e7eb"/></svg>';
  const codes = Array.from({ length: 6 }).map((_, i) => `RCODE-${i + 1}XXXX`);

  return (
    <div className="space-y-4">
      <img alt="QR" src={qr} className="mx-auto rounded-xl border" />
      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
        {codes.map(c => <code key={c} className="px-2 py-1 rounded bg-white border text-slate-700">{c}</code>)}
      </div>
      <ActionButton className="w-full" onClick={onContinue}>Continue</ActionButton>
    </div>
  );
};

export default MfaSetupForm;
