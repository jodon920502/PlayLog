const ratings = Array.from({ length: 10 }, (_, index) => (index + 1) / 2)

export default function RatingInput({ value, onChange, disabled = false }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-3 text-sm text-[#a5a7af]">
      <span>評分</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))} disabled={disabled} className="filter-select rounded-lg px-3 py-2 outline-none">
        {ratings.map((rating) => <option key={rating} value={rating}>{rating.toFixed(1)} / 5.0</option>)}
      </select>
    </label>
  )
}
