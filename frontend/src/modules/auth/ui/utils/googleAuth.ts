export const startGoogleAuth = (): void => {
  window.location.assign(`${window.location.origin}/auth/login`);
};
