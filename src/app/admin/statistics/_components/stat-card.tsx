type Props = {
  label: string
  value: number
}

export function StatCard({ label, value }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-bold">{value.toLocaleString()}</span>
    </div>
  )
}
