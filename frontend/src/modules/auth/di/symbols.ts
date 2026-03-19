export const AUTH_SYMBOLS = {
  IAuthService: Symbol.for('IAuthService'),
  IAuthRepository: Symbol.for('IAuthRepository'),
  AuthEventHandler: Symbol.for('AuthEventHandler'),
} as const;

export type AuthSymbols = typeof AUTH_SYMBOLS;
