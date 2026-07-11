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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 40 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="bg-white px-12 py-10 rounded-[1.75rem] shadow-2xl ring-1 ring-amber-900/5 flex flex-col items-center gap-4"
          >
            <div className="relative">
              <motion.div
                className={`absolute inset-0 rounded-full ${player.color} opacity-40 blur-md`}
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className={`relative h-24 w-24 rounded-full shadow-lg ring-4 ring-white ${player.color} flex items-center justify-center text-5xl`}>
                {player.avatar || '●'}
              </div>
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-amber-900">{player.name}</div>
            <div className="text-xl sm:text-2xl text-amber-700 font-medium">차례입니다!</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
