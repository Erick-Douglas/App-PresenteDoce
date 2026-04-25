import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { uploadAvatar } from '../lib/storage';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log('[Auth] Buscando perfil para:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('[Auth] Perfil não encontrado ou erro de RLS:', error.message);
        // Mesmo sem perfil na tabela, mantemos o estado logado com o ID básico
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
    } catch (err) {
      console.error('[Auth] Exceção ao buscar perfil:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Inicializando sistema de autenticação');
    
    const initAuth = async () => {
      try {
        // 1. Verificar sessão atual imediatamente
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user && mounted) {
          console.log('[Auth] Sessão ativa encontrada:', session.user.email);
          await fetchUserProfile(session.user.id);
        } else {
          console.log('[Auth] Nenhuma sessão ativa');
        }
      } catch (err: any) {
        console.error('[Auth] Erro na inicialização:', err.message);
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    };

    initAuth();

    // 2. Listener para mudanças de estado (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Evento detectado:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id);
        if (mounted) setIsAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        if (mounted) setIsAuthLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await fetchUserProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const handleSignIn = async (email: string, pass: string): Promise<boolean> => {
    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      
      if (data.user) {
        await fetchUserProfile(data.user.id);
        return true;
      }
      return false;
    } catch (err: any) {
      alert(`Erro no login: ${err.message}`);
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignUp = async (
    email: string,
    pass: string,
    profileData: { name: string; phone: string; birthday: string; sex: string; avatarFile?: File }
  ): Promise<boolean> => {
    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password: pass });
      if (error) throw error;
      if (!data.user) return false;

      let profile_pic: string | null = null;
      if (profileData.avatarFile) {
        try {
          profile_pic = await uploadAvatar(profileData.avatarFile, data.user.id);
        } catch (e: any) {
          console.warn('[Auth] Upload de avatar falhou:', e.message);
        }
      }

      // Atualizar perfil (criado pelo trigger)
      const { error: updateError } = await supabase.from('profiles').update({
        name: profileData.name,
        phone: profileData.phone,
        birthday: profileData.birthday,
        sex: profileData.sex,
        profile_pic,
      }).eq('id', data.user.id);

      if (updateError) console.error('[Auth] Erro ao atualizar perfil:', updateError.message);

      await fetchUserProfile(data.user.id);
      return true;
    } catch (err: any) {
      alert(`Erro no cadastro: ${err.message}`);
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
      alert(err.message || 'Erro ao enviar foto.');
    }
  };

  return {
    user, isAuthLoading, fetchUserProfile,
    handleSignIn, handleSignUp, handleSignOut,
    persistDefaultAddress, handleProfilePicUpload,
  };
}
