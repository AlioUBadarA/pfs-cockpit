import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import KpiCard from '../components/KpiCard'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '—'
const pct = (n) => n != null ? Number(n).toFixed(1) + ' %' : '—'

function getWeekKey(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

function buildDefaultRows() {
  return JOURS.map((j) => ({
    jour: j, zone: '', clients_visiter: '', objectif: '', realise: '', note: '',
  }))
}

export default function Pilotage() {
  const [semaine, setSemaine] = useState(getWeekKey())
  const [rows, setRows] = useState(buildDefaultRows())
  const [actions, setActions] = useState('')
  const [kpis, setKpis] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingActions, setSavingActions] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/api/pilotage/${semaine}`)
      .then((r) => {
        const d = r.data
        setRows(d?.jours?.length ? d.jours : buildDefaultRows())
        setActions(d?.actions_correctives || '')
        setKpis(d?.kpis || {})
      })
      .catch(() => {
        setRows(buildDefaultRows())
        setActions('')
        setKpis({})
      })
      .finally(() => setLoading(false))
  }, [semaine])

  useEffect(() => { load() }, [load])

  const updateRow = (i, field, value) => {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  const ecart = (row) => {
    const obj = Number(row.objectif) || 0
    const real = Number(row.realise) || 0
    return real - obj
  }

  const totalObjectif = rows.reduce((s, r) => s + (Number(r.objectif) || 0), 0)
  const totalRealise = rows.reduce((s, r) => s + (Number(r.realise) || 0), 0)
  const totalEcart = totalRealise - totalObjectif
  const tauxExec = totalObjectif > 0 ? (totalRealise / totalObjectif) * 100 : 0

  const saveSemaine = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put(`/api/pilotage/${semaine}`, { semaine, jours: rows })
      setSuccess('Semaine enregistrée avec succès')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur d'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const saveActions = async () => {
    setSavingActions(true)
    setError('')
    try {
      await api.put(`/api/pilotage/${semaine}/actions`, { actions_correctives: actions })
      setSuccess('Actions correctives enregistrées')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError("Erreur d'enregistrement des actions")
    } finally {
      setSavingActions(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-900">Pilotage hebdomadaire</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Semaine du</label>
          <input
            type="date"
            className="input w-auto text-sm"
            value={semaine}
            onChange={(e) => setSemaine(getWeekKey(e.target.value))}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {success}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Objectif semaine"
          value={fmt(totalObjectif || kpis.objectif_semaine)}
          icon="🎯"
          color="#1B5E20"
        />
        <KpiCard
          title="Réalisé"
          value={fmt(totalRealise || kpis.realise)}
          icon="✅"
          color="#388E3C"
        />
        <KpiCard
          title="Écart"
          value={fmt(totalEcart !== 0 ? totalEcart : kpis.ecart)}
          icon={totalEcart >= 0 ? '📈' : '📉'}
          color={totalEcart >= 0 ? '#1B5E20' : '#CC0000'}
        />
        <KpiCard
          title="Taux d'exécution"
          value={pct(tauxExec || kpis.taux_execution)}
          icon="📊"
          color={tauxExec >= 80 ? '#1B5E20' : '#F9A825'}
        />
      </div>

      {/* Tableau semaine */}
      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-7 h-7 border-4 border-[#388E3C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Jour', 'Zone', 'Clients à visiter', 'Objectif (F)', 'Réalisé (F)', 'Écart', 'Note'].map((h) => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const e = ecart(row)
                return (
                  <tr key={row.jour} className="hover:bg-gray-50">
                    <td className="table-cell font-semibold text-gray-800 whitespace-nowrap">{row.jour}</td>
                    <td className="table-cell">
                      <input
                        className="w-full border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#388E3C] rounded px-1"
                        value={row.zone}
                        onChange={(e) => updateRow(i, 'zone', e.target.value)}
                        placeholder="Zone..."
                      />
                    </td>
                    <td className="table-cell">
                      <input
                        className="w-full border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#388E3C] rounded px-1"
                        value={row.clients_visiter}
                        onChange={(e) => updateRow(i, 'clients_visiter', e.target.value)}
                        placeholder="Noms clients..."
                      />
                    </td>
                    <td className="table-cell">
                      <input
                        type="number"
                        min="0"
                        className="w-full border-0 bg-transparent text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#388E3C] rounded px-1"
                        value={row.objectif}
                        onChange={(e) => updateRow(i, 'objectif', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="table-cell">
                      <input
                        type="number"
                        min="0"
                        className="w-full border-0 bg-transparent text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#388E3C] rounded px-1"
                        value={row.realise}
                        onChange={(e) => updateRow(i, 'realise', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className={`table-cell text-right font-semibold whitespace-nowrap ${e >= 0 ? 'text-[#1B5E20]' : 'text-[#CC0000]'}`}>
                      {row.objectif !== '' || row.realise !== ''
                        ? `${e >= 0 ? '+' : ''}${e.toLocaleString('fr-FR')} F`
                        : '—'}
                    </td>
                    <td className="table-cell">
                      <input
                        className="w-full border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#388E3C] rounded px-1"
                        value={row.note}
                        onChange={(e) => updateRow(i, 'note', e.target.value)}
                        placeholder="Note..."
                      />
                    </td>
                  </tr>
                )
              })}
              {/* Total row */}
              <tr className="bg-gray-50 font-semibold">
                <td className="table-cell" colSpan={3}>Total</td>
                <td className="table-cell text-right">{totalObjectif.toLocaleString('fr-FR')} F</td>
                <td className="table-cell text-right">{totalRealise.toLocaleString('fr-FR')} F</td>
                <td className={`table-cell text-right ${totalEcart >= 0 ? 'text-[#1B5E20]' : 'text-[#CC0000]'}`}>
                  {totalEcart >= 0 ? '+' : ''}{totalEcart.toLocaleString('fr-FR')} F
                </td>
                <td className="table-cell" />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={saveSemaine}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saving ? 'Enregistrement...' : 'Sauvegarder la semaine'}
        </button>
      </div>

      {/* Actions correctives */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions correctives</h3>
        <textarea
          className="input resize-none"
          rows={4}
          placeholder="Décrire les actions correctives pour cette semaine..."
          value={actions}
          onChange={(e) => setActions(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={saveActions}
            disabled={savingActions}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {savingActions && <span className="w-4 h-4 border-2 border-[#1B5E20] border-t-transparent rounded-full animate-spin" />}
            {savingActions ? 'Enregistrement...' : 'Sauvegarder les actions'}
          </button>
        </div>
      </div>
    </div>
  )
}
