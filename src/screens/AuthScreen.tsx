import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, Pencil, User as UserIcon } from 'lucide-react';
import { View } from '../types';
import { COUNTRY_CODES } from '../constants';

interface AuthScreenProps {
  onSignIn: (email: string, pass: string) => Promise<boolean>;
  onSignUp: (email: string, pass: string, profileData: {
    name: string; phone: string; birthday: string; sex: string; avatarFile?: File;
  }) => Promise<boolean>;
  onNavigate: (view: View) => void;
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

function formatBirthday(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSignIn, onSignUp, onNavigate }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [sex, setSex] = useState('');
  const [prefix, setPrefix] = useState('+351');
  const [prefixOpen, setPrefixOpen] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState('+351');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const filtered = COUNTRY_CODES.filter(c =>
    c.code.includes(prefixSearch) || c.country.toLowerCase().includes(prefixSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const pass = fd.get('password') as string;
    let ok = false;
    if (mode === 'login') {
      ok = await onSignIn(email, pass);
    } else {
      ok = await onSignUp(email, pass, {
        name: fd.get('name') as string,
        phone: `${prefix} ${phone}`,
        birthday,
        sex,
        avatarFile: avatarFile ?? undefined,
      });
    }
    if (ok) onNavigate('home');
  };

  return (
    <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="bg-white flex flex-col fixed inset-0 z-[60] overflow-y-auto">
      <div className="absolute top-0 left-0 right-0 h-[60vh] bg-primary pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <div className="w-full px-8 flex justify-between items-center fixed top-6 left-0 z-[65]">
          <button onClick={() => onNavigate('home')} className="p-2 text-cream/80 hover:text-white transition-all bg-white/10 rounded-xl backdrop-blur-md">
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 mt-[15vh] mb-8 shrink-0 px-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <UserIcon size={32} className="text-primary" />
          </div>
          <h1 className="font-headline font-black text-xl text-cream tracking-wider capitalize">
            {mode === 'login' ? 'Login' : 'Registo'}
          </h1>
        </div>

        <motion.div layout className="flex-grow bg-white rounded-t-[48px] px-8 pt-8 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] w-full flex flex-col z-10">
          <div className="max-w-md mx-auto w-full flex flex-col flex-1">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-start space-y-4">

              {mode === 'register' && (
                <>
                  {/* Avatar */}
                  <div className="flex flex-col items-center py-2">
                    <label className="cursor-pointer group relative">
                      <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { setAvatarFile(f); const r = new FileReader(); r.onloadend = () => setAvatarPreview(r.result as string); r.readAsDataURL(f); }
                        }} />
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 shrink-0 transition-all ${avatarPreview ? 'border-primary shadow-md' : 'border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10'}`}>
                        {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-primary/40" />}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                          <Pencil size={16} className="text-white" />
                        </div>
                      </div>
                    </label>
                    <span className="font-headline text-[10px] text-primary/60 mt-2">Foto de perfil opcional</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-headline font-bold text-[10px] text-black ml-1 italic">Como gostaria de ser chamado?</label>
                    <input name="name" required placeholder="João Silva" className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-5 h-10 font-body text-[12px] outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5" />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="font-headline font-bold text-[10px] text-black ml-1 italic">Endereço de Email</label>
                <input name="email" required type="email" placeholder="exemplo@gmail.com" className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-5 h-10 font-body text-[12px] outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5" />
              </div>

              <div className="space-y-1 relative">
                <label className="font-headline font-bold text-[10px] text-black ml-1 italic">Senha</label>
                <div className="relative">
                  <input name="password" required type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-5 h-10 font-body text-[12px] outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 pr-12" />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black p-1">
                    <Eye size={20} className={showPassword ? 'text-primary' : 'text-black/40'} />
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div className="space-y-1">
                    <label className="font-headline font-bold text-[10px] text-black ml-1 italic">WhatsApp</label>
                    <div className="flex gap-2">
                      <div className="relative isolate w-20">
                        <input type="text" value={prefixSearch}
                          onChange={(e) => { setPrefixSearch(e.target.value); setPrefixOpen(true); }}
                          onFocus={() => setPrefixOpen(true)}
                          className="w-full h-10 bg-black/[0.03] rounded-2xl pl-3 pr-2 font-body outline-none text-[11px] font-bold border border-black/5 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5" />
                        <AnimatePresence>
                          {prefixOpen && (
                            <>
                              <div className="fixed inset-0 z-[70]" onClick={() => setPrefixOpen(false)} />
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-1 w-48 bg-white border border-primary/5 rounded-xl shadow-2xl z-[80] overflow-hidden max-h-40 overflow-y-auto">
                                {filtered.map((item, i) => (
                                  <button type="button" key={i} onClick={() => { setPrefix(item.code); setPrefixSearch(item.code); setPrefixOpen(false); }}
                                    className="w-full text-left px-4 py-3 hover:bg-primary/5 flex justify-between items-center border-b border-primary/5 last:border-0">
                                    <span className="font-headline font-bold text-xs">{item.code}</span>
                                    <span className="text-[9px] text-black/40 truncate ml-2">{item.country}</span>
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                      <input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} required placeholder="999 999 999"
                        className="flex-1 bg-black/[0.03] border border-black/5 rounded-2xl px-5 h-10 font-body text-[12px] outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-headline font-bold text-[10px] text-black ml-1 italic">Data de nascimento</label>
                    <input type="text" value={birthday} onChange={(e) => setBirthday(formatBirthday(e.target.value))} required placeholder="DD/MM/AAAA" maxLength={10}
                      className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-5 h-10 font-body text-[12px] outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-headline font-bold text-[10px] text-black ml-1 italic">Sexo</label>
                    <select value={sex} onChange={(e) => setSex(e.target.value)} required
                      className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-5 h-10 font-body text-[12px] outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5">
                      <option value="">Selecione</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Prefiro não informar">Prefiro não informar</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-6 pb-2 flex flex-col items-center gap-3">
                <button type="submit" className="w-full max-w-[280px] bg-primary text-cream font-headline font-bold text-sm h-11 rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all">
                  {mode === 'login' ? 'Entrar' : 'Registar'}
                </button>
                <p className="text-center font-body text-[11px] text-black/60 pt-2">
                  {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
                  <button type="button" onClick={() => setMode(m => m === 'login' ? 'register' : 'login')} className="text-primary font-bold hover:underline">
                    {mode === 'login' ? 'Registe-se' : 'Faça login'}
                  </button>
                </p>
              </div>
            </form>

            <div className="text-center mt-auto pt-6 pb-4">
              <button onClick={() => onNavigate('home')} type="button" className="text-[10px] font-bold text-black/60 hover:text-black tracking-wider capitalize transition-all">
                Continuar como visitante
              </button>
              <p className="text-black/10 font-body text-[8px] tracking-widest mt-2">Copyright © 2025 - Presente Doce</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
