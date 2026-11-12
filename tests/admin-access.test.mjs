import test from 'node:test';
import assert from 'node:assert/strict';
import { readAdminLinkToken } from '../src/features/products/adminLink.ts';

const project = 'https://exemplo.supabase.co';
const token = 'token-ficticio-de-teste-123';

test('extrai o token de um convite do projeto configurado', () => {
  assert.equal(readAdminLinkToken(project + '/auth/v1/verify?type=invite&token=' + token, project, 'invite'), token);
});

test('extrai o token de recuperação do projeto configurado', () => {
  assert.equal(readAdminLinkToken(project + '/auth/v1/verify?type=recovery&token=' + token, project, 'recovery'), token);
});

test('rejeita endereços incompletos e links de outros projetos ou finalidades', () => {
  assert.throws(() => readAdminLinkToken(token, project, 'invite'));
  assert.throws(() => readAdminLinkToken('https://outro.supabase.co/auth/v1/verify?type=invite&token=' + token, project, 'invite'));
  assert.throws(() => readAdminLinkToken(project + '/auth/v1/verify?type=recovery&token=' + token, project, 'invite'));
  assert.throws(() => readAdminLinkToken(project + '/auth/v1/verify?type=invite&token=' + token, project, 'recovery'));
  assert.throws(() => readAdminLinkToken(project + '/auth/v1/verify?type=invite', project, 'invite'));
});
