import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Logo } from '@/app/(dashboard)/_components/logo';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export function WelcomeModal({ isOpen, onClose, userName }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="relative mx-auto py-2 pb-4 flex justify-center h-18 w-18">
            <Logo />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="mb-6 text-muted-foreground text-left">
              Termina de configurar tu cuenta y aprende más sobre la plataforma de Saber Ver:
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 text-left text-sm">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <motion.div whileHover={{ scale: 1.1 }}>🎨</motion.div>
                </div>
                <span>Edita tu perfil</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <motion.div whileHover={{ scale: 1.1 }}>📚</motion.div>
                </div>
                <span>Accesa nuestras guías de uso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <motion.div whileHover={{ scale: 1.1 }}>🚀</motion.div>
                </div>
                <span>Comienza con tu primer curso</span>
              </div>
            </div>

            <Button onClick={onClose} className="w-full" size="lg">
              Comencemos
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
