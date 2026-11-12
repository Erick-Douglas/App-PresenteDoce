export function authRetryAfter(value: string | null, now = Date.now()) {
  if (!value?.trim()) return 60;
  const seconds = /^\d+$/.test(value.trim()) ? Number(value) : Math.ceil((Date.parse(value) - now) / 1000);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.min(3600, Math.max(1, seconds)) : 60;
}

export class AuthRateLimitError extends Error {
  readonly retryAfter: number;

  constructor(retryAfter: number) {
    super('Demasiadas tentativas. Aguarde e tente novamente.');
    this.retryAfter = retryAfter;
  }
}
