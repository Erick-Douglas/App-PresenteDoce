import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { uploadAvatar } from '../lib/storage';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data && !error) {
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id).finally(() => setIsAuthLoading(false));
      } else {
        setIsAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const handleSignIn = async (email: string, pass: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { alert(`Erro no login: ${error.message}`); return false; }
    if (data.user) { await fetchUserProfile(data.user.id); return true; }
    return false;
  };

  const handleSignUp = async (
    email: string,
    pass: string,
    profileData: { name: string; phone: string; birthday: string; sex: string; avatarFile?: File }
  ): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) { alert(`Erro no cadastro: ${error.message}`); return false; }
    if (!data.user) return false;

    let profile_pic: string | null = null;
    if (profileData.avatarFile) {
      try { profile_pic = await uploadAvatar(profileData.avatarFile, data.user.id); }
      catch (e: any) { console.warn('Avatar upload falhou:', e.message); }
    }

    // O perfil é criado automaticamente via trigger no banco de dados.
    // Aqui apenas atualizamos com os dados adicionais do formulário.
    await supabase.from('profiles').update({
      name: profileData.name,
      phone: profileData.phone,
      birthday: profileData.birthday,
      sex: profileData.sex,
      profile_pic,
    }).eq('id', data.user.id);
    await fetchUserProfile(data.user.id);
    return true;
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
    if (error) { alert('Não foi possível guardar o endereço padrão.'); return; }
    setUser(prev => prev ? { ...prev, ...payload, has_default_address: Boolean(address.address) } : prev);
  };

  const handleProfilePicUpload = async (file: File) => {
    if (!user?.id) return;
    try {
      const url = await uploadAvatar(file, user.id);
      const { error } = await supabase.from('profiles').update({ profile_pic: url }).eq('id', user.id);
      if (!error) setUser(prev => prev ? { ...prev, profilePic: url } : prev);
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
