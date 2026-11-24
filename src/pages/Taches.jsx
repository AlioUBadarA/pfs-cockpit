import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import PageTabs from '../components/PageTabs'
import Panel from '../components/Panel'
import Modal from '../components/Modal'
import AssignerTache, { dateDecalee } from '../components/AssignerTache'
import { formatDate } from '../utils/format'

// Planning et tâches.
// - Le commercial planifie ses tâches au plus tard la veille et voit ses tâches du jour.
// - Il termine chaque tâche avec un commentaire sur son déroulement.
// - Le responsable lit le rapport de son équipe et assigne des tâches.

const STATUTS = {
  a_faire: { libelle: 'À faire', classe: 'bg-blue-50 text-blue-700' },
  terminee: { libelle: 'Terminée', classe: 'bg-green-50 text-green-700' },
  non_realisee: { libelle: 'Non réalisée', classe: 'bg-red-50 text-red-700' },
}

function Statut({ t }) {
  const s = t.en_retard ? { libelle: 'En retard', classe: 'bg-amber-50 text-amber-800' } : STATUTS[t.statut]
  return <span className={`text-[11px] font-semibold rounded px-2 py-0.5 ${s.classe}`}>{s.libelle}</span>
}

function Cible({ t }) {
  return (
    <span>
      <span className="font-medium text-gray-900">{t.cible_nom}</span>
      {t.cible_type === 'prospect' && <span className="ml-1.5 text-[10px] font-semibold uppercase text-amber-700 bg-amber-50 rounded px-1">Prospect</span>}
    </span>
  )
}

function LigneTache({ t, onTerminer, onRetirer, moi }) {
  return (
    <li className="py-3 flex flex-wrap items-start gap-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-[220px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#1b75bc] uppercase tracking-wide">{t.type}</span>
          <Cible t={t} />
          <Statut t={t} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formatDate(t.date_prevue)}
          {t.cible_telephone ? ` · ${t.cible_telephone}` : ''}
          {t.cible_zone ? ` · ${t.cible_zone}` : ''}
          {t.origine === 'assignation' ? ` · Assignée par ${t.createur_nom || 'un responsable'}` : ''}
        </p>
        {t.consigne && <p className="text-sm text-gray-700 mt-1">{t.consigne}</p>}
        {t.compte_rendu && (
          <p className="text-sm text-gray-700 mt-1 bg-gray-50 rounded px-2 py-1">
            <span className="font-semibold">Compte rendu : </span>{t.compte_rendu}{t.resultat ? ` (${t.resultat})` : ''}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {onTerminer && t.statut === 'a_faire' && t.user_id === moi && (
          <button className="btn-primary text-xs" onClick={() => onTerminer(t)}>Terminer</button>
        )}
        {onRetirer && t.statut === 'a_faire' && t.cree_par === moi && (
          <button className="btn-secondary text-xs" onClick={() => onRetirer(t)}>Retirer</button>
        )}
      </div>
    </li>
  )
}

function Terminer({ tache, onClose, onFait }) {
  const [statut, setStatut] = useState('terminee')
  const [resultat, setResultat] = useState('Positif')
  const [texte, setTexte] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  useEffect(() => { setStatut('terminee'); setResultat('Positif'); setTexte(''); setErreur('') }, [tache])

  const envoyer = async (e) => {
    e.preventDefault()
    if (texte.trim().length < 3) { setErreur('Écrivez comment s\'est passée l\'activité.'); return }
    setEnvoi(true)
    try {
      await api.post(`/api/taches/${tache.id}/terminer`, { statut, resultat, compte_rendu: texte.trim() })
      onFait()
      onClose()
    } catch (err) {
      setErreur(err.response?.data?.error || 'Enregistrement impossible')
    } finally { setEnvoi(false) }
  }

  return (
    <Modal open={!!tache} onClose={onClose} title="Terminer la tâche">
      {tache && (
        <form onSubmit={envoyer} className="space-y-3">
          <p className="text-sm text-gray-600">{tache.type} · {tache.cible_nom}</p>
          <div className="flex gap-2" role="radiogroup" aria-label="Issue">
            {[['terminee', 'Faite'], ['non_realisee', 'Pas faite']].map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={statut === v} onClick={() => setStatut(v)}
                className={`flex-1 text-sm rounded-lg border px-3 py-2 ${statut === v ? 'border-[#1b75bc] bg-blue-50 text-[#1b75bc] font-semibold' : 'border-gray-200 text-gray-600'}`}>{l}</button>
            ))}
          </div>
          {statut === 'terminee' && (
            <div>
              <label className="label" htmlFor="tache-resultat">Résultat</label>
              <select id="tache-resultat" className="input" value={resultat} onChange={(e) => setResultat(e.target.value)}>
                {['Positif', 'Neutre', 'Négatif'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label" htmlFor="tache-cr">{statut === 'terminee' ? 'Comment s\'est passée l\'activité ? *' : 'Pourquoi n\'a-t-elle pas été faite ? *'}</label>
            <textarea id="tache-cr" className="input" rows={3} maxLength={2000} value={texte} onChange={(e) => setTexte(e.target.value)} required />
          </div>
          {erreur && <p className="text-sm text-red-600" role="alert">{erreur}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" disabled={envoi} className="btn-primary flex-1">{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default function Taches() {
  const { user, isManager, isDirecteur, isRizier } = useAuth()
  const responsable = isManager || isDirecteur || isRizier
  const [onglet, setOnglet] = useState(responsable ? 'rapport' : 'jour')
  const [jour, setJour] = useState([])
  const [planning, setPlanning] = useState([])
  const [rapport, setRapport] = useState(null)
  const [periode, setPeriode] = useState({ du: dateDecalee(0), au: dateDecalee(0) })
  const [erreur, setErreur] = useState('')
  const [aTerminer, setATerminer] = useState(null)
  const [creation, setCreation] = useState(null)

  const charger = useCallback(async () => {
    setErreur('')
    try {
      const [j, p] = await Promise.all([
        api.get('/api/taches/jour'),
        api.get(`/api/taches?du=${dateDecalee(1)}&user_id=${user.id}`),
      ])
      setJour(j.data)
      setPlanning([...p.data].sort((a, b) => a.date_prevue.localeCompare(b.date_prevue)))
      if (responsable) {
        const r = await api.get(`/api/taches/rapport?du=${periode.du}&au=${periode.au}`)
        setRapport(r.data)
      }
    } catch (err) {
      setErreur(err.response?.data?.error || 'Chargement impossible')
    }
  }, [user.id, responsable, periode])

  useEffect(() => { charger() }, [charger])

  const retirer = async (t) => {
    try { await api.delete(`/api/taches/${t.id}`); charger() } catch (err) { setErreur(err.response?.data?.error || 'Suppression impossible') }
  }

  const aFaire = jour.filter((t) => t.statut === 'a_faire').length
  const onglets = [
    ...(responsable ? [{ key: 'rapport', label: 'Rapport de l\'équipe' }] : []),
    { key: 'jour', label: 'Mes tâches du jour', badge: aFaire },
    { key: 'planning', label: 'Mon planning' },
  ]
  const raccourcis = [
    ['Aujourd\'hui', dateDecalee(0), dateDecalee(0)],
    ['Demain', dateDecalee(1), dateDecalee(1)],
    ['7 derniers jours', dateDecalee(-6), dateDecalee(0)],
    ['7 prochains jours', dateDecalee(0), dateDecalee(6)],
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Planning et tâches</h2>
          <p className="text-sm text-gray-500 mt-0.5">Chaque tâche porte sur un client ou un prospect. Le planning se fait au plus tard la veille.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => setCreation({ mode: 'planning' })}>+ Planifier</button>
          {responsable && <button className="btn-primary text-sm" onClick={() => setCreation({ mode: 'assignation' })}>+ Assigner une tâche</button>}
        </div>
      </div>

      {erreur && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3" role="alert">{erreur}</div>}

      <PageTabs tabs={onglets} active={onglet} setActive={setOnglet} />

      {onglet === 'rapport' && responsable && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label" htmlFor="rapport-du">Du</label>
              <input id="rapport-du" type="date" className="input" value={periode.du} onChange={(e) => setPeriode((p) => ({ ...p, du: e.target.value }))} />
            </div>
            <div>
              <label className="label" htmlFor="rapport-au">Au</label>
              <input id="rapport-au" type="date" className="input" value={periode.au} onChange={(e) => setPeriode((p) => ({ ...p, au: e.target.value }))} />
            </div>
            {raccourcis.map(([l, du, au]) => (
              <button key={l} className="btn-secondary text-xs" onClick={() => setPeriode({ du, au })}>{l}</button>
            ))}
          </div>

          <Panel title="Résumé par commercial" sub="Le planning de demain doit être saisi aujourd'hui">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="py-2 pr-3">Commercial</th><th className="py-2 px-2 text-right">Prévues</th><th className="py-2 px-2 text-right">Terminées</th>
                    <th className="py-2 px-2 text-right">Pas faites</th><th className="py-2 px-2 text-right">En retard</th><th className="py-2 pl-2">Planning de demain</th>
                  </tr>
                </thead>
                <tbody>
                  {(rapport?.resume || []).map((m) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="py-2 pr-3 font-medium">{m.nom}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{m.prevues}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-green-700">{m.terminees}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-red-700">{m.non_realisees}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-amber-700">{m.en_retard}</td>
                      <td className="py-2 pl-2">{m.planning_demain ? <span className="text-green-700">{m.planning_demain} tâche(s)</span> : <span className="text-amber-700 font-medium">Pas encore saisi</span>}</td>
                    </tr>
                  ))}
                  {rapport && !rapport.resume.length && <tr><td colSpan={6} className="py-4 text-gray-500">Aucun commercial dans votre équipe.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Détail" sub="Client ou prospect, action, date, statut et compte rendu">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="py-2 pr-3">Commercial</th><th className="py-2 pr-3">Client ou prospect</th><th className="py-2 pr-3">Action</th>
                    <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Statut</th><th className="py-2">Compte rendu</th>
                  </tr>
                </thead>
                <tbody>
                  {(rapport?.taches || []).map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 align-top">
                      <td className="py-2 pr-3">{t.commercial_nom}</td>
                      <td className="py-2 pr-3"><Cible t={t} /></td>
                      <td className="py-2 pr-3">{t.type}{t.origine === 'assignation' && <div className="text-[10.5px] text-gray-500">Assignée</div>}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{formatDate(t.date_prevue)}</td>
                      <td className="py-2 pr-3"><Statut t={t} /></td>
                      <td className="py-2 text-gray-700">{t.compte_rendu || (t.consigne ? <span className="text-gray-400">Consigne : {t.consigne}</span> : '-')}</td>
                    </tr>
                  ))}
                  {rapport && !rapport.taches.length && <tr><td colSpan={6} className="py-4 text-gray-500">Aucune tâche sur cette période.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {onglet === 'jour' && (
        <Panel title="Mes tâches du jour" sub="Les tâches en retard restent ici jusqu'à leur clôture">
          {jour.length === 0 ? <p className="text-sm text-gray-500 py-4">Aucune tâche aujourd'hui.</p> : (
            <ul>{jour.map((t) => <LigneTache key={t.id} t={t} moi={user.id} onTerminer={setATerminer} />)}</ul>
          )}
        </Panel>
      )}

      {onglet === 'planning' && (
        <Panel title="Mon planning" sub="À partir de demain">
          {planning.length === 0 ? <p className="text-sm text-gray-500 py-4">Rien de prévu. Planifiez vos tâches de demain avant la fin de la journée.</p> : (
            <ul>{planning.map((t) => <LigneTache key={t.id} t={t} moi={user.id} onRetirer={retirer} />)}</ul>
          )}
        </Panel>
      )}

      <Terminer tache={aTerminer} onClose={() => setATerminer(null)} onFait={charger} />
      <AssignerTache open={!!creation} mode={creation?.mode} onClose={() => setCreation(null)} onCree={charger} />
    </div>
  )
}
