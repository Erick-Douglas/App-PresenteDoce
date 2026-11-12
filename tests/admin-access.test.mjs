import test from 'node:test';
import assert from 'node:assert/strict';
import { readManualRecoveryToken, readRecoveryCallback } from '../src/features/products/adminLink.ts';

const project = 'https://exemplo.supabase.co';
const store = 'https://presente-doce.vercel.app';
const manualToken = 'token-ficticio-de-teste-123';
const sessionToken = 'cabecalho.conteudo.assinatura';

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
