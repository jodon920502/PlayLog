import { Star } from 'lucide-react'

export default function GameScore({ score, compact = false }: { score: number; compact?: boolean }) {
  return <div className={`flex items-center gap-1.5 ${compact ? 'text-sm' : 'text-base'}`}><Star size={compact ? 14 : 16} fill="#f2c544" color="#f2c544" /><span className="font-bold text-[#f2c544]">{score.toFixed(1)}</span></div>
}
