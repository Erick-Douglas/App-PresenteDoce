import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, HeartHandshake } from 'lucide-react';
import { BUSINESS_INFO } from '../config/constants';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

export function ExitIntentModal({ isOpen, onClose, onConfirmExit }: ExitIntentModalProps) {
  const handleWhatsApp = () => {
    const text = encodeURIComponent('Olá! Estava a navegar no site e tenho uma dúvida. Pode ajudar-me?');
    window.open(`https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}?text=${text}`, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                <HeartHandshake size={32} />
              </div>
              
              <h2 className="font-headline font-black text-2xl text-primary leading-tight">
                Espere um<br />momento! 🥺
              </h2>
              
              <p className="font-body text-black/60 text-[14px]">
                Está com alguma dúvida ou teve algum problema? Não vá embora sem falar connosco!
              </p>

              <div className="pt-4 space-y-3">
                <button
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-[0_4px_15px_rgba(37,211,102,0.3)] active:scale-95"
                >
                  <MessageCircle size={20} />
                  Falar com Atendente
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full bg-primary/5 text-primary py-3 rounded-xl font-bold hover:bg-primary/10 transition-colors"
                >
                  Continuar a ver doces
                </button>
              </div>

              <button
                onClick={onConfirmExit}
                className="mt-4 text-[12px] text-black/40 hover:text-black/60 hover:underline transition-colors"
              >
                Não, quero mesmo sair
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-black/40 hover:text-black hover:bg-black/5 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
