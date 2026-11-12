import test from 'node:test';
import assert from 'node:assert/strict';
import { readInviteToken } from '../src/features/products/adminInvite.ts';

const project = 'https://exemplo.supabase.co';
const token = 'token-ficticio-de-teste-123';

test('extrai o token de um convite do projeto configurado', () => {
  assert.equal(readInviteToken(project + '/auth/v1/verify?type=invite&token=' + token, project), token);
});

test('rejeita endereços incompletos e links de outros projetos ou finalidades', () => {
  assert.throws(() => readInviteToken(token, project));
  assert.throws(() => readInviteToken('https://outro.supabase.co/auth/v1/verify?type=invite&token=' + token, project));
  assert.throws(() => readInviteToken(project + '/auth/v1/verify?type=recovery&token=' + token, project));
  assert.throws(() => readInviteToken(project + '/auth/v1/verify?type=invite', project));
});
