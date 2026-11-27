import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import PageTabs from '../components/PageTabs'
import FicheProducteurForm from '../components/FicheProducteurForm'
import { Badge, EtatCompte, LienCompte, STATUT_VERS, Tableau, kg } from '../components/CompteCommun'
import { formatCFA as fmt, formatDate as fmtDate } from '../utils/format'
import { useAuth } from '../context/AuthContext'

// Fiche et compte d'un producteur de paddy : qui il est, ses contrats, ce que la rizerie lui doit.

export default function ProducteurCompte() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [compte, setCompte] = useState(null)
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState('releve')
  const [edition, setEdition] = useState(false)

  // Ancien lien par nom (/producteurs/compte?nom=) : toujours accepté.
  const chemin = id && id !== 'compte' ? `/api/comptes/producteur/${id}` : '/api/comptes/producteur'
  const requete = id && id !== 'compte' ? {} : { nom: params.get('nom') || '', ...(params.get('telephone') ? { telephone: params.get('telephone') } : {}) }
  const cleRequete = JSON.stringify(requete)

  const charger = useCallback(() => {
    setErreur('')
    api.get(chemin, { params: JSON.parse(cleRequete) })
      .then((r) => setCompte(r.data))
      .catch((err) => setErreur(err.response?.data?.error || 'Compte introuvable'))
  }, [chemin, cleRequete])
  useEffect(() => { setCompte(null); charger() }, [charger])

  if (!compte) return <EtatCompte erreur={erreur} retour="/producteurs" libelleRetour="Producteurs" />
  const { producteur: p, resume: r } = compte

  return (
    <div className="space-y-5">
      <Link to="/producteurs" className="text-sm text-[#1b75bc]">← Producteurs</Link>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">{p.nom}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {['Producteur de paddy', p.telephone, p.zone, p.village, p.groupement].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role !== 'comptable' && <Link to={`/contrats-paddy?producteur=${p.id}`} className="btn-primary text-sm">+ Nouveau contrat</Link>}
          {user?.role !== 'comptable' && <button className="btn-secondary text-sm" onClick={() => setEdition(true)}>Modifier la fiche</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Paddy contracté" value={kg(r.volume_kg)} sub={`${r.nb_contrats} contrat(s)`} color="#1b75bc" />
        <KpiCard title="Montant des contrats" value={fmt(r.total_du)} sub="à payer au producteur" />
        <KpiCard title="Payé" value={fmt(r.total_paye)} sub={r.en_attente_validation ? `${fmt(r.en_attente_validation)} à valider` : 'validé'} color="#1B5E20" />
        <KpiCard title="Reste à payer" value={fmt(r.reste_a_payer)} sub={r.reste_a_payer ? 'dû par la rizerie' : 'tout est réglé'} color={r.reste_a_payer ? '#e08e0b' : '#1B5E20'} />
      </div>

      <PageTabs tabs={[
        { key: 'releve', label: 'Relevé' },
        { key: 'contrats', label: `Contrats (${compte.contrats.length})` },
        { key: 'paiements', label: `Paiements (${compte.paiements.length})` },
        { key: 'fiche', label: 'Fiche' },
      ]} active={onglet} setActive={setOnglet} />

      {onglet === 'releve' && (
        <Panel title="Relevé" sub="Contrats en dû, paiements validés en réglé. Le solde est ce que la rizerie doit encore.">
          <Tableau entetes={['Date', 'Opération', 'Dû', 'Réglé', 'Solde']} alignDroite={[2, 3, 4]} vide="Aucune opération."
            lignes={compte.releve.map((l) => [fmtDate(l.date), l.libelle, l.du ? fmt(l.du) : '', l.paye ? fmt(l.paye) : '', <strong key="s">{fmt(l.solde)}</strong>])} />
        </Panel>
      )}
      {onglet === 'contrats' && (
        <Panel title="Contrats">
          <Tableau entetes={['N°', 'Période', 'Variété', 'Quantité', 'Prix', 'Montant', 'Payé', 'Commercial', 'Statut']} alignDroite={[3, 4, 5, 6]} vide="Aucun contrat."
            lignes={compte.contrats.map((c) => [c.numero || '-', `${fmtDate(c.debut)} → ${fmtDate(c.fin)}`, c.variete || '-', kg(c.quantite_kg), `${fmt(c.prix_kg)}/kg`, fmt(c.montant), fmt(c.total_paye),
              c.user_id ? <LienCompte key="u" to={`/agents/${c.user_id}`}>{c.vendeur_nom}</LienCompte> : '-', c.statut])} />
        </Panel>
      )}
      {onglet === 'paiements' && (
        <Panel title="Paiements">
          <Tableau entetes={['Date', 'Contrat', 'Mode', 'Montant', 'Statut']} alignDroite={[3]} vide="Aucun paiement."
            lignes={compte.paiements.map((x) => [fmtDate(x.date), x.piece || '-', x.mode || '-', fmt(x.montant), <Badge key="b" def={STATUT_VERS[x.statut_validation]} />])} />
        </Panel>
      )}
      {onglet === 'fiche' && (
        <Panel title="Fiche du producteur">
          <Tableau entetes={['Rubrique', 'Valeur']} vide=""
            lignes={[
              ['Nom', p.nom], ['Téléphone', p.telephone || '-'], ['Zone', p.zone || '-'], ['Village', p.village || '-'],
              ['Superficie', p.superficie_ha ? `${Number(p.superficie_ha).toLocaleString('fr-FR')} ha` : '-'],
              ['Variétés', r.varietes.length ? r.varietes.join(', ') : '-'], ['Groupement', p.groupement || '-'],
              ['Note', p.note || '-'], ['Fiche créée par', p.cree_par_nom || '-'], ['Fiche créée le', fmtDate(p.created_at)],
            ]} />
        </Panel>
      )}

      <FicheProducteurForm open={edition} fiche={p} onClose={() => setEdition(false)} onSaved={() => { setEdition(false); charger() }} />
    </div>
  )
}
