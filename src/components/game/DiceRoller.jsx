import { motion } from 'framer-motion'

function Die({ value, keyHint }) {
  return (
    <motion.div
      key={keyHint}
      initial={{ rotate: -180, scale: 0.4 }}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 250, damping: 14 }}
      className="h-12 w-12 sm:h-14 sm:w-14 bg-white rounded-xl shadow-md flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-amber-900"
    >
      {value ?? '?'}
    </motion.div>
  )
}

export default function DiceRoller({ lastRoll, onRoll, disabled, color }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        <Die value={lastRoll?.d1} keyHint={`d1-${lastRoll?.d1 ?? 0}`} />
        <Die value={lastRoll?.d2} keyHint={`d2-${lastRoll?.d2 ?? 0}`} />
      </div>
      <button
        onClick={onRoll}
        disabled={disabled}
        className={`px-6 py-3 text-white rounded-xl font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-105 ${color || 'bg-amber-600 hover:bg-amber-700'}`}
      >
        🎲 주사위 굴리기
      </button>
    </div>
  )
}
