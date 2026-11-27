import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import PageTabs from '../components/PageTabs'
import { Badge, EtatCompte, STATUT_TACHE, Tableau } from '../components/CompteCommun'
import { formatCFA as fmt, formatDate as fmtDate } from '../utils/format'

// Compte d'un prospect : tout ce que l'équipe a fait avec lui avant qu'il devienne client.

export default function ProspectCompte() {
  const { id } = useParams()
  const [compte, setCompte] = useState(null)
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState('activites')

  useEffect(() => {
    setCompte(null); setErreur('')
    api.get(`/api/comptes/prospect/${id}`)
      .then((r) => setCompte(r.data))
      .catch((err) => setErreur(err.response?.data?.error || 'Compte introuvable'))
  }, [id])

  if (!compte) return <EtatCompte erreur={erreur} retour="/prospection" libelleRetour="Prospects" />
  const { prospect: p, resume: r } = compte
  const prochaine = r.prochaine_tache

  return (
    <div className="space-y-5">
      <Link to="/prospection" className="text-sm text-[#1b75bc]">← Prospects</Link>
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">{p.nom}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {[p.type_client, p.zone, p.region, p.telephone, p.source ? `Source : ${p.source}` : null, p.vendeur_nom ? `Suivi par ${p.vendeur_nom}` : null].filter(Boolean).join(' · ')}
        </p>
        {p.client_id && (
          <p className="text-sm mt-2">Devenu client : <Link to={`/clients/${p.client_id}`} className="text-[#1b75bc] font-medium hover:underline">{p.client_nom || 'ouvrir le compte client'}</Link></p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Étape" value={p.statut} sub={p.priorite ? `Priorité ${p.priorite.toLowerCase()}` : ''} color="#1b75bc" />
        <KpiCard title="Valeur estimée" value={fmt(r.valeur_estimee)} sub="par an" color="#1B5E20" />
        <KpiCard title="Contacts" value={r.nb_activites} sub={r.derniere_activite ? `dernier le ${fmtDate(r.derniere_activite)}` : 'aucun contact'} />
        <KpiCard title="Prochaine action" value={prochaine ? fmtDate(prochaine.date) : '-'} sub={prochaine ? prochaine.type : 'rien de prévu'} color={prochaine ? '#e08e0b' : '#CC0000'} />
      </div>

      {p.note && <Panel title="Note"><p className="text-sm text-gray-700 whitespace-pre-line">{p.note}</p></Panel>}

      <PageTabs tabs={[
        { key: 'activites', label: `Activités (${compte.activites.length})` },
        { key: 'taches', label: `Tâches (${compte.taches.length})` },
      ]} active={onglet} setActive={setOnglet} />

      {onglet === 'activites' && (
        <Panel title="Activités" sub="Visites, appels, démonstrations et relances">
          <Tableau entetes={['Date', 'Type', 'Résultat', 'Note', 'Par']} vide="Aucune activité."
            lignes={compte.activites.map((a) => [fmtDate(a.date), a.type, a.resultat || '-', a.note || '-', a.auteur || '-'])} />
        </Panel>
      )}
      {onglet === 'taches' && (
        <Panel title="Tâches" sub="Planifiées ou assignées">
          <Tableau entetes={['Date', 'Action', 'Statut', 'Détail', 'Commercial']} vide="Aucune tâche."
            lignes={compte.taches.map((t) => [fmtDate(t.date), t.type, <Badge key="b" def={STATUT_TACHE[t.statut]} />, t.compte_rendu || t.consigne || '-', t.commercial_nom || '-'])} />
        </Panel>
      )}
    </div>
  )
}
