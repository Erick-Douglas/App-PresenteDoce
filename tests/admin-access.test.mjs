import test from 'node:test';
import assert from 'node:assert/strict';
import { readManualRecoveryToken, readRecoveryCallback } from '../src/features/products/adminLink.ts';
import { authRetryAfter } from '../src/features/products/authRateLimit.ts';

const project = 'https://exemplo.supabase.co';
const store = 'https://presente-doce.vercel.app';
const manualToken = 'token-ficticio-de-teste-123';
const sessionToken = 'cabecalho.conteudo.assinatura';

test('respeita o intervalo de nova tentativa do servidor', () => {
  const now = Date.UTC(2026, 10, 12, 13, 0, 0);
  assert.equal(authRetryAfter('8', now), 8);
  assert.equal(authRetryAfter('Thu, 12 Nov 2026 13:00:30 GMT', now), 30);
  assert.equal(authRetryAfter('0', now), 1);
  assert.equal(authRetryAfter('999999', now), 3600);
  assert.equal(authRetryAfter(null, now), 60);
  assert.equal(authRetryAfter('inválido', now), 60);
});

test('reconhece uma sessão de recuperação apenas no fragmento das rotas da loja', () => {
  const hash = '#type=recovery&access_token=' + sessionToken + '&refresh_token=nao-ler';
  assert.deepEqual(readRecoveryCallback(new URL(store + '/admin?recuperar=1' + hash)), { token: sessionToken });
  assert.deepEqual(readRecoveryCallback(new URL(store + '/' + hash)), { token: sessionToken });
  assert.equal(readRecoveryCallback(new URL(store + '/precificacao' + hash)), null);
  assert.equal(readRecoveryCallback(new URL(store + '/#product-list')), null);
  assert.equal(readRecoveryCallback(new URL(store + '/admin?recuperar=1&access_token=' + sessionToken)), null);
});

test('trata erro do provedor e rejeita sessões incompletas ou com outra finalidade', () => {
  const callback = store + '/admin?recuperar=1';
  assert.deepEqual(readRecoveryCallback(new URL(callback + '#error_code=otp_expired')), { invalid: true });
  assert.deepEqual(readRecoveryCallback(new URL(callback + '#type=recovery&access_token=invalido')), { invalid: true });
  assert.deepEqual(readRecoveryCallback(new URL(callback + '#type=invite&access_token=' + sessionToken)), { invalid: true });
  assert.equal(readRecoveryCallback(new URL(callback)), null);
});

test('valida projeto, rota e finalidade no caminho manual de recuperação', () => {
  const endpoint = project + '/auth/v1/verify?type=recovery&token=';
  assert.equal(readManualRecoveryToken(endpoint + manualToken, project), manualToken);
  assert.throws(() => readManualRecoveryToken(manualToken, project));
  assert.throws(() => readManualRecoveryToken(endpoint.replace('exemplo', 'outro') + manualToken, project));
  assert.throws(() => readManualRecoveryToken(endpoint.replace('recovery', 'invite') + manualToken, project));
  assert.throws(() => readManualRecoveryToken(endpoint, project));
});
