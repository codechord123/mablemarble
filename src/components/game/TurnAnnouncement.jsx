import { AnimatePresence, motion } from 'framer-motion'

export default function TurnAnnouncement({ player, show }) {
  return (
    <AnimatePresence>
      {show && player && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 40 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="bg-white px-12 py-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4"
          >
            <div className={`h-20 w-20 rounded-full shadow-lg ${player.color}`} />
            <div className="text-4xl sm:text-5xl font-extrabold text-amber-900">{player.name}</div>
            <div className="text-xl sm:text-2xl text-amber-700">차례입니다!</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
