import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import PageTabs from '../components/PageTabs'
import { Badge, EtatCompte, LienCompte, STATUT_TACHE, STATUT_VENTE, STATUT_VERS, Tableau } from '../components/CompteCommun'
import { formatCFA as fmt, formatDate as fmtDate } from '../utils/format'

// Compte d'un agent de la rizerie : commercial, manager, directeur, comptable.
// Ses ventes, ses encaissements, son portefeuille, ses tâches et son équipe.

const ROLES = { vendeur: 'Commercial', manager: 'Manager', directeur: 'Directeur commercial', comptable: 'Comptable', rizier: 'Rizier' }

export default function AgentCompte() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [compte, setCompte] = useState(null)
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState('ventes')

  useEffect(() => {
    setCompte(null); setErreur('')
    api.get(`/api/comptes/agent/${id}`)
      .then((r) => setCompte(r.data))
      .catch((err) => setErreur(err.response?.data?.error || 'Compte introuvable'))
  }, [id])

  if (!compte) return <EtatCompte erreur={erreur} retour="/equipe" libelleRetour="Équipe" />
  const { agent: a, resume: r } = compte
  const onglets = [
    { key: 'ventes', label: `Ventes (${compte.ventes.length})` },
    { key: 'encaissements', label: `Encaissements (${compte.encaissements.length})` },
    { key: 'clients', label: `Clients (${compte.clients.length})` },
    { key: 'prospects', label: `Prospects (${compte.prospects.length})` },
    { key: 'taches', label: `Tâches (${compte.taches.length})` },
    { key: 'activites', label: `Activités (${compte.activites.length})` },
    ...(compte.equipe.length ? [{ key: 'equipe', label: `Équipe (${compte.equipe.length})` }] : []),
  ]

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate(-1)} className="text-sm text-[#1b75bc]">← Retour</button>
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">{a.nom}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {[ROLES[a.role] || a.role, a.zone ? `Zone ${a.zone}` : null, a.telephone, a.responsable_nom ? `Rattaché à ${a.responsable_nom}` : null, a.depuis ? `Depuis le ${fmtDate(a.depuis)}` : null, a.suspended ? 'Compte suspendu' : null].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="CA encaissé cette année" value={fmt(r.ca_encaisse_annee)} sub={r.objectif_annee ? `${r.taux_objectif} % de l'objectif (${fmt(r.objectif_annee)})` : "pas d’objectif fixé"} color="#1B5E20" />
        <KpiCard title="Ventes" value={fmt(r.montant_ventes)} sub={`${r.nb_ventes} vente(s) · ${r.taux_encaissement ?? 0} % encaissé`} color="#1b75bc" />
        <KpiCard title="Reste à encaisser" value={fmt(r.encours)} sub={r.en_retard ? `dont ${fmt(r.en_retard)} en retard` : 'aucun retard'} color={r.en_retard ? '#CC0000' : '#e08e0b'} />
        <KpiCard title="Tâches sur 30 jours" value={`${r.taches_faites_30j} / ${r.taches_30j}`} sub={r.taches_en_retard ? `${r.taches_en_retard} en retard` : `${r.visites_30j} activité(s)`} color={r.taches_en_retard ? '#CC0000' : undefined} />
      </div>
      {a.role === 'comptable' && (
        <p className="text-sm text-gray-600">Encaissements validés : {r.encaissements_valides_par_lui} pour {fmt(r.montant_valide_par_lui)}.</p>
      )}

      <PageTabs tabs={onglets} active={onglet} setActive={setOnglet} />

      {onglet === 'ventes' && (
        <Panel title="Ventes">
          <Tableau entetes={['N°', 'Date', 'Client', 'Montant', 'Encaissé', 'Reste', 'Échéance', 'Statut']} alignDroite={[3, 4, 5]} vide="Aucune vente."
            lignes={compte.ventes.map((v) => [v.numero || '-', fmtDate(v.date), v.client_id ? <LienCompte key="c" to={`/clients/${v.client_id}`}>{v.client_nom}</LienCompte> : v.client_nom,
              fmt(v.montant), fmt(v.total_valide), fmt(v.reste), fmtDate(v.date_echeance),
              v.validation_commande === 'refusee' ? <Badge key="b" def={['Refusée', 'text-red-700 bg-red-50']} /> : <Badge key="b" def={STATUT_VENTE[v.statut_paiement]} />])} />
        </Panel>
      )}
      {onglet === 'encaissements' && (
        <Panel title="Encaissements déclarés">
          <Tableau entetes={['Date', 'Pièce', 'Client', 'Mode', 'Montant', 'Statut']} alignDroite={[4]} vide="Aucun encaissement."
            lignes={compte.encaissements.map((x) => [fmtDate(x.date), x.piece || '-', x.client_nom || '-', x.mode || '-', fmt(x.montant), <Badge key="b" def={STATUT_VERS[x.statut_validation]} />])} />
        </Panel>
      )}
      {onglet === 'clients' && (
        <Panel title="Clients suivis">
          <Tableau entetes={['Client', 'Type', 'Zone', "Chiffre d’affaires", 'Dernier achat']} alignDroite={[3]} vide="Aucun client."
            lignes={compte.clients.map((c) => [<LienCompte key="c" to={`/clients/${c.id}`}>{c.nom}</LienCompte>, c.type || '-', c.zone || '-', fmt(c.ca), fmtDate(c.derniere_vente)])} />
        </Panel>
      )}
      {onglet === 'prospects' && (
        <Panel title="Prospects">
          <Tableau entetes={['Prospect', 'Étape', 'Valeur estimée']} alignDroite={[2]} vide="Aucun prospect."
            lignes={compte.prospects.map((p) => [<LienCompte key="p" to={`/prospects/${p.id}`}>{p.nom}</LienCompte>, p.statut, fmt(p.valeur_estimee)])} />
        </Panel>
      )}
      {onglet === 'taches' && (
        <Panel title="Tâches" sub="Planifiées, assignées ou automatiques">
          <Tableau entetes={['Date', 'Action', 'Pour', 'Statut', 'Détail']} vide="Aucune tâche."
            lignes={compte.taches.map((t) => [fmtDate(t.date), t.type, t.cible_nom || '-',
              t.en_retard ? <Badge key="b" def={['En retard', 'text-red-700 bg-red-50']} /> : <Badge key="b" def={STATUT_TACHE[t.statut]} />, t.compte_rendu || t.consigne || '-'])} />
        </Panel>
      )}
      {onglet === 'activites' && (
        <Panel title="Activités">
          <Tableau entetes={['Date', 'Type', 'Pour', 'Résultat', 'Note']} vide="Aucune activité."
            lignes={compte.activites.map((x) => [fmtDate(x.date), x.type, x.cible || '-', x.resultat || '-', x.note || '-'])} />
        </Panel>
      )}
      {onglet === 'equipe' && (
        <Panel title="Équipe">
          <Tableau entetes={['Nom', 'Rôle']} vide="Personne."
            lignes={compte.equipe.map((u) => [<LienCompte key="u" to={`/agents/${u.id}`}>{u.nom}</LienCompte>, ROLES[u.role] || u.role])} />
        </Panel>
      )}
    </div>
  )
}
