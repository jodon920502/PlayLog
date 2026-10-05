export default function RatingBar({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center gap-2 text-[10px] text-[#888b96]"><span className="w-9">{label}</span><div className="h-1 flex-1 overflow-hidden rounded-full bg-[#2b2e38]"><div className="h-full rounded-full bg-[#f2c544]" style={{ width: `${value * 20}%` }} /></div><span className="w-5 text-right text-[#c5c3bb]">{value.toFixed(1)}</span></div>
}
