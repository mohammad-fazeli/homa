import { motion } from "framer-motion";

export default function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="relative z-10 w-full max-w-lg p-6 bg-white rounded-2xl shadow-2xl"
      >
        {children}
      </motion.div>
    </div>
  );
}
