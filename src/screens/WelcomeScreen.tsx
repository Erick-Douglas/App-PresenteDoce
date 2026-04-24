import React from 'react';
import { motion } from 'motion/react';
import { Instagram, Facebook, MessageCircle } from 'lucide-react';
import { SPLASH_IMAGE, BUSINESS_INFO } from '../constants';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative h-screen flex flex-col items-center justify-end overflow-hidden bg-primary">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url('${SPLASH_IMAGE}')` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent z-10" />

      <div className="relative z-20 w-full px-6 pb-12 flex flex-col items-center text-center space-y-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
          <div className="flex justify-center mb-0">
            <img src="/logo.png" alt="Logo" className="h-32 sm:h-40 w-auto object-contain drop-shadow-2xl brightness-110" />
          </div>
          <p className="font-body text-cream/90 text-sm sm:text-base leading-relaxed font-medium max-w-[280px] sm:max-w-none mx-auto">
            Feitos com carinho para surpreender em cada detalhe.
          </p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="w-full space-y-6">
          <button onClick={onContinue}
            className="w-full py-4 bg-gold text-primary rounded-2xl font-headline font-black text-sm uppercase tracking-[0.1em] shadow-xl active:scale-95 transition-transform">
            Ver Cardápio
          </button>

          <div className="flex justify-center gap-5">
            {[
              { icon: Instagram, href: BUSINESS_INFO.instagram, label: 'Instagram' },
              { icon: Facebook, href: BUSINESS_INFO.facebook, label: 'Facebook' },
              { icon: MessageCircle, href: `https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}`, label: 'WhatsApp' },
            ].map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-cream/70 hover:text-cream hover:bg-white/20 transition-all">
                <Icon size={18} />
              </a>
            ))}
          </div>

          <p className="text-cream/50 font-body text-[10px] tracking-widest uppercase">
            © 2026 Presente Doce
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
