import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { uploadAvatar } from '../lib/storage';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log('[Auth] Buscando perfil para:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('[Auth] Erro ao buscar perfil:', error.message);
      // Mesmo sem perfil, podemos ter o ID do auth
      setUser({ id: userId, email: '', name: 'Usuário' } as User);
      return null;
    }

    if (data) {
      console.log('[Auth] Perfil carregado com sucesso');
      setUser({
        ...data,
        profilePic: data.profile_pic ?? null,
        has_default_address: Boolean(data.address),
      });
      return data;
    }
    return null;
  }, []);

  useEffect(() => {
    console.log('[Auth] Inicializando listener de autenticação');
    
    // 1. Verificar sessão inicial
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          console.log('[Auth] Sessão inicial encontrada:', session.user.email);
          await fetchUserProfile(session.user.id);
        } else {
          console.log('[Auth] Nenhuma sessão inicial encontrada');
        }
      } catch (err: any) {
        console.error('[Auth] Erro ao obter sessão inicial:', err.message);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initSession();

    // 2. Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Evento de Auth:', event, session?.user?.email);
      
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        await fetchUserProfile(session.user.id);
        setIsAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthLoading(false);
      }
    });

    return () => {
      console.log('[Auth] Limpando listener de autenticação');
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const handleSignIn = async (email: string, pass: string): Promise<boolean> => {
    console.log('[Auth] Tentando login para:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) {
      console.error('[Auth] Erro no login:', error.message);
      alert(`Erro no login: ${error.message}`);
      return false;
    }
    
    if (data.user) {
      console.log('[Auth] Login bem-sucedido, buscando perfil...');
      await fetchUserProfile(data.user.id);
      return true;
    }
    return false;
  };

  const handleSignUp = async (
    email: string,
    pass: string,
    profileData: { name: string; phone: string; birthday: string; sex: string; avatarFile?: File }
  ): Promise<boolean> => {
    console.log('[Auth] Tentando cadastro para:', email);
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    
    if (error) {
      console.error('[Auth] Erro no cadastro:', error.message);
      alert(`Erro no cadastro: ${error.message}`);
      return false;
    }
    
    if (!data.user) return false;

    console.log('[Auth] Cadastro bem-sucedido, ID:', data.user.id);

    let profile_pic: string | null = null;
    if (profileData.avatarFile) {
      try {
        profile_pic = await uploadAvatar(profileData.avatarFile, data.user.id);
      } catch (e: any) {
        console.warn('[Auth] Upload de avatar falhou:', e.message);
      }
    }

    // O perfil é criado automaticamente via trigger no banco de dados.
    // Aqui apenas atualizamos com os dados adicionais do formulário.
    console.log('[Auth] Atualizando perfil com dados adicionais...');
    const { error: updateError } = await supabase.from('profiles').update({
      name: profileData.name,
      phone: profileData.phone,
      birthday: profileData.birthday,
      sex: profileData.sex,
      profile_pic,
    }).eq('id', data.user.id);

    if (updateError) {
      console.error('[Auth] Erro ao atualizar perfil:', updateError.message);
    }

    await fetchUserProfile(data.user.id);
    return true;
  };

  const handleSignOut = async () => {
    console.log('[Auth] Fazendo logout...');
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[Auth] Erro no logout:', error.message);
    setUser(null);
  };

  const persistDefaultAddress = async (address: {
    address: string; city: string; postal_code: string; apartment: string; reference: string;
  }) => {
    if (!user?.id) return;
    const payload = {
      address: address.address || null,
      city: address.city || null,
      postal_code: address.postal_code || null,
      apartment: address.apartment || null,
      reference: address.reference || null,
    };
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    if (error) {
      console.error('[Auth] Erro ao salvar endereço:', error.message);
      alert('Não foi possível guardar o endereço padrão.');
      return;
    }
    setUser(prev => prev ? { ...prev, ...payload, has_default_address: Boolean(address.address) } : prev);
  };

  const handleProfilePicUpload = async (file: File) => {
    if (!user?.id) return;
    try {
      const url = await uploadAvatar(file, user.id);
      const { error } = await supabase.from('profiles').update({ profile_pic: url }).eq('id', user.id);
      if (error) throw error;
      setUser(prev => prev ? { ...prev, profilePic: url } : prev);
    } catch (err: any) {
      console.error('[Auth] Erro no upload de foto:', err.message);
      alert(err.message || 'Erro ao enviar foto.');
    }
  };

  return {
    user, isAuthLoading, fetchUserProfile,
    handleSignIn, handleSignUp, handleSignOut,
    persistDefaultAddress, handleProfilePicUpload,
  };
}
