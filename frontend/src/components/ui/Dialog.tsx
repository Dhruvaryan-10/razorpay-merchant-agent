'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { duration, ease } from '@/lib/motion';
import { Button } from './Button';

/** Centred modal: scrim fade, panel scales from 98%. No slide, no blur. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50"
                style={{ backgroundColor: 'rgb(var(--scrim) / var(--scrim-opacity))' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.quick }}
              />
            </RadixDialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
              <RadixDialog.Content asChild forceMount>
                <motion.div
                  className="pointer-events-auto w-full max-w-[420px] rounded-lg bg-sheet p-6 shadow-e2 focus:outline-none"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: duration.quick, ease: ease.out }}
                >
                  <RadixDialog.Title className="text-heading text-ink">{title}</RadixDialog.Title>
                  {description ? (
                    <RadixDialog.Description className="mt-2 text-cell text-ink-2">{description}</RadixDialog.Description>
                  ) : null}
                  <div className="mt-6">{children}</div>
                </motion.div>
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        ) : null}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  busy,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  busy?: boolean;
  error?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
      {error ? <p className="mb-4 text-cell text-critical">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <RadixDialog.Close asChild>
          <Button variant="ghost">Cancel</Button>
        </RadixDialog.Close>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
