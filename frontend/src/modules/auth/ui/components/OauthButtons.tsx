import React from 'react';

const OauthButtons: React.FC = () => {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      Google sign-in is temporarily unavailable. Use your email and password to continue.
    </div>
  );
};

export default OauthButtons;
