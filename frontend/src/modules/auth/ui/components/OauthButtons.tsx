import React, { useState } from 'react';
import GoogleSignInButton from './GoogleSignInButton';
const OauthButtons: React.FC = () => {
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <GoogleSignInButton onError={setErr} />
      {err && <p className="text-xs text-red-500 text-center">{err}</p>}
    </div>
  );
};
export default OauthButtons;
