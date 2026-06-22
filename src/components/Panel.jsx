export default function Panel({ title, sub, right, footer, children }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">{title}</div>
          {sub && <div className="panel-sub">{sub}</div>}
        </div>
        {right || null}
      </div>
      {children}
      {footer || null}
    </section>
  )
}
