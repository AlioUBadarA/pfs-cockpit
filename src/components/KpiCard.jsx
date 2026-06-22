export default function KpiCard({ title, value, sub, color = '#1b75bc', icon }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
        {title}
        {icon && <span className="ml-auto text-base">{icon}</span>}
      </div>
      <div className="kpi-value" style={{ color }}>
        {value}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
