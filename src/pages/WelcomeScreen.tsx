import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Menu, MessageCircle } from 'lucide-react';
import { SPLASH_IMAGE, BUSINESS_INFO } from '../config/constants';
import { View } from '../config/types';

interface WelcomeScreenProps {
  onNavigate: (view: View) => void;
  onOpenMenu: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate, onOpenMenu }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex min-h-[calc(100dvh-env(safe-area-inset-top))] flex-col items-center justify-center overflow-hidden bg-primary">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url('${SPLASH_IMAGE}')` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent z-10" />
      <button type="button" aria-label="Abrir menu" onClick={onOpenMenu} className="store-icon-action absolute top-5 left-5 z-20 text-on-primary">
        <Menu size={24} strokeWidth={1.5} />
      </button>

      <div className="relative z-20 w-full px-6 pb-6 flex flex-col items-center text-center space-y-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-2">
          <div className="flex justify-center">
            <img src="/logo.png" alt="Logo" className="h-28 sm:h-36 w-auto object-contain drop-shadow-2xl brightness-110" />
          </div>
          <p className="text-on-primary/90 text-sm sm:text-base leading-relaxed font-normal max-w-[280px] mx-auto">
            Feitos com carinho para surpreender em cada detalhe.
          </p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="w-full flex flex-col items-center space-y-3">
          {/* Botão */}
          <button onClick={() => onNavigate('home')}
            className="ui-secondary border-gold bg-gold text-on-accent">
            Ver Cardápio
          </button>

          {/* Redes sociais abaixo do botão */}
          <div className="flex justify-center gap-5 pt-1">
            {[
              { icon: Instagram, href: BUSINESS_INFO.instagram, label: 'Instagram' },
              { icon: Facebook, href: BUSINESS_INFO.facebook, label: 'Facebook' },
              { icon: MessageCircle, href: `https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}`, label: 'WhatsApp' },
            ].map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="grid size-11 place-items-center rounded-full text-on-primary hover:bg-surface/15">
                <Icon size={18} />
              </a>
            ))}
          </div>

          <p className="text-on-primary/50 text-xs tracking-widest uppercase">
            © 2026 Presente Doce
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
