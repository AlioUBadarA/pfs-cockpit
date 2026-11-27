import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import PageTabs from '../components/PageTabs'
import { Badge, EtatCompte, STATUT_VERS, Tableau, kg } from '../components/CompteCommun'
import { formatCFA as fmt, formatDate as fmtDate } from '../utils/format'

// Compte d'un producteur de paddy : ses contrats, ce que la rizerie lui doit et ce qu'elle a payé.

export default function ProducteurCompte() {
  const [params] = useSearchParams()
  const nom = params.get('nom') || ''
  const telephone = params.get('telephone') || ''
  const [compte, setCompte] = useState(null)
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState('releve')

  useEffect(() => {
    setCompte(null); setErreur('')
    api.get('/api/comptes/producteur', { params: { nom, ...(telephone ? { telephone } : {}) } })
      .then((r) => setCompte(r.data))
      .catch((err) => setErreur(err.response?.data?.error || 'Compte introuvable'))
  }, [nom, telephone])

  if (!compte) return <EtatCompte erreur={erreur} retour="/contrats-paddy" libelleRetour="Contrats paddy" />
  const { producteur: p, resume: r } = compte

  return (
    <div className="space-y-5">
      <Link to="/contrats-paddy" className="text-sm text-[#1b75bc]">← Contrats paddy</Link>
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">{p.nom}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {['Producteur de paddy', p.zone, p.telephone, r.varietes.length ? `Variétés : ${r.varietes.join(', ')}` : null].filter(Boolean).join(' · ')}
        </p>
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
      ]} active={onglet} setActive={setOnglet} />

      {onglet === 'releve' && (
        <Panel title="Relevé" sub="Contrats en dû, paiements validés en réglé. Le solde est ce que la rizerie doit encore.">
          <Tableau entetes={['Date', 'Opération', 'Dû', 'Réglé', 'Solde']} alignDroite={[2, 3, 4]} vide="Aucune opération."
            lignes={compte.releve.map((l) => [fmtDate(l.date), l.libelle, l.du ? fmt(l.du) : '', l.paye ? fmt(l.paye) : '', <strong key="s">{fmt(l.solde)}</strong>])} />
        </Panel>
      )}
      {onglet === 'contrats' && (
        <Panel title="Contrats">
          <Tableau entetes={['N°', 'Période', 'Variété', 'Quantité', 'Prix', 'Montant', 'Payé', 'Statut']} alignDroite={[3, 4, 5, 6]} vide="Aucun contrat."
            lignes={compte.contrats.map((c) => [c.numero || '-', `${fmtDate(c.debut)} → ${fmtDate(c.fin)}`, c.variete || '-', kg(c.quantite_kg), `${fmt(c.prix_kg)}/kg`, fmt(c.montant), fmt(c.total_paye), c.statut])} />
        </Panel>
      )}
      {onglet === 'paiements' && (
        <Panel title="Paiements">
          <Tableau entetes={['Date', 'Contrat', 'Mode', 'Montant', 'Statut']} alignDroite={[3]} vide="Aucun paiement."
            lignes={compte.paiements.map((x) => [fmtDate(x.date), x.piece || '-', x.mode || '-', fmt(x.montant), <Badge key="b" def={STATUT_VERS[x.statut_validation]} />])} />
        </Panel>
      )}
    </div>
  )
}
