import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import PageTabs from '../components/PageTabs'
import FicheProducteurForm from '../components/FicheProducteurForm'
import { LivraisonForm, PaiementProducteurForm, ouvrirPreuvePaddy } from '../components/AchatPaddy'
import { EtatCompte, LienCompte, Tableau, kg } from '../components/CompteCommun'
import { formatCFA as fmt, formatDate as fmtDate } from '../utils/format'
import { useAuth } from '../context/AuthContext'

// Fiche et compte d'un producteur de paddy. La rizerie lui achète du paddy :
// elle doit le paddy reçu (kg × prix du contrat) et le comptable le paie avec une preuve.

export default function ProducteurCompte() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [compte, setCompte] = useState(null)
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState('releve')
  const [edition, setEdition] = useState(false)
  const [livraison, setLivraison] = useState(false)
  const [paiement, setPaiement] = useState(false)
  const [peutPayer, setPeutPayer] = useState(false)
  const [modes, setModes] = useState(undefined)

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
  useEffect(() => {
    api.get('/api/paddy/a-payer').then((r) => setPeutPayer(!!r.data?.peut_payer)).catch(() => {})
    api.get('/api/rizerie').then((r) => setModes(r.data?.parametres?.modes_paiement)).catch(() => {})
  }, [])

  if (!compte) return <EtatCompte erreur={erreur} retour="/producteurs" libelleRetour="Producteurs" />
  const { producteur: p, resume: r } = compte
  const saisit = user?.role !== 'comptable'
  const contratsOuverts = compte.contrats.filter((c) => c.statut !== 'Terminé')
  const voirPreuve = async (pid) => { try { await ouvrirPreuvePaddy(pid) } catch { setErreur('Preuve indisponible') } }

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
        <div className="flex gap-2 flex-wrap">
          {peutPayer && compte.contrats.length > 0 && <button className="btn-primary text-sm" onClick={() => setPaiement(true)}>Payer le producteur</button>}
          {saisit && contratsOuverts.length > 0 && <button className="btn-primary text-sm" onClick={() => setLivraison(true)}>+ Paddy reçu</button>}
          {saisit && <Link to={`/contrats-paddy?producteur=${p.id}`} className="btn-secondary text-sm">+ Nouveau contrat</Link>}
          {saisit && <button className="btn-secondary text-sm" onClick={() => setEdition(true)}>Modifier la fiche</button>}
        </div>
      </div>

      {r.prochaine_echeance && (
        <div className={`text-sm rounded-lg px-4 py-3 border ${r.prochaine_echeance.date < new Date().toISOString().slice(0, 10) ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          Prochain paiement : {fmt(r.prochaine_echeance.montant)} prévu le {fmtDate(r.prochaine_echeance.date)}.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Paddy reçu" value={kg(r.livre_kg)} sub={`sur ${kg(r.volume_kg)} contractés`} color="#1b75bc" />
        <KpiCard title="Dû pour le paddy reçu" value={fmt(r.total_du)} sub={`${r.nb_contrats} contrat(s) · ${fmt(r.valeur_contrats)} au total`} />
        <KpiCard title="Payé par la rizerie" value={fmt(r.total_paye)} sub={r.avance ? `dont ${fmt(r.avance)} d'avance` : `${compte.paiements.length} paiement(s)`} color="#1B5E20" />
        <KpiCard title="Reste à payer" value={fmt(r.reste_a_payer)} sub={r.reste_a_payer ? 'dû au producteur' : 'tout est réglé'} color={r.reste_a_payer ? '#e08e0b' : '#1B5E20'} />
      </div>

      <PageTabs tabs={[
        { key: 'releve', label: 'Relevé' },
        { key: 'livraisons', label: `Paddy reçu (${compte.livraisons.length})` },
        { key: 'paiements', label: `Paiements (${compte.paiements.length})` },
        { key: 'contrats', label: `Contrats (${compte.contrats.length})` },
        { key: 'fiche', label: 'Fiche' },
      ]} active={onglet} setActive={setOnglet} />

      {onglet === 'releve' && (
        <Panel title="Relevé" sub="Le paddy reçu crée une dette de la rizerie. Chaque paiement la réduit. Le solde est ce que la rizerie doit encore.">
          <Tableau entetes={['Date', 'Opération', 'Dû', 'Payé', 'Solde']} alignDroite={[2, 3, 4]} vide="Aucune opération."
            lignes={compte.releve.map((l) => [fmtDate(l.date), l.libelle, l.du ? fmt(l.du) : '', l.paye ? fmt(l.paye) : '', <strong key="s">{fmt(l.solde)}</strong>])} />
        </Panel>
      )}
      {onglet === 'livraisons' && (
        <Panel title="Paddy reçu" sub="Chaque livraison a sa date de paiement prévue">
          <Tableau entetes={['Reçu le', 'Contrat', 'Quantité', 'Humidité', 'Montant', 'Paiement prévu', 'Reste', 'Saisi par']} alignDroite={[2, 4, 6]} vide="Aucune livraison."
            lignes={compte.livraisons.map((l) => [fmtDate(l.date), l.piece || '-', kg(l.quantite_kg), l.humidite_pct != null ? `${Number(l.humidite_pct)} %` : '-', fmt(l.montant),
              fmtDate(l.date_paiement_prevue), l.reste_a_payer > 0 ? <strong key="r" className="text-amber-700">{fmt(l.reste_a_payer)}</strong> : <span key="r" className="text-green-700">Payé</span>, l.saisi_par || '-'])} />
        </Panel>
      )}
      {onglet === 'paiements' && (
        <Panel title="Paiements faits au producteur">
          <Tableau entetes={['Date', 'Contrat', 'Mode', 'Référence', 'Montant', 'Payé par', 'Preuve']} alignDroite={[4]} vide="Aucun paiement."
            lignes={compte.paiements.map((x) => [fmtDate(x.date), x.piece || '-', x.mode, x.reference || '-', fmt(x.montant), x.paye_par_nom || '-',
              x.a_preuve ? <button key="p" type="button" onClick={() => voirPreuve(x.id)} className="text-xs font-medium text-[#1b75bc] underline">Voir</button> : <span key="p" className="text-xs text-red-600">Manquante</span>])} />
        </Panel>
      )}
      {onglet === 'contrats' && (
        <Panel title="Contrats">
          <Tableau entetes={['N°', 'Période', 'Variété', 'Contracté', 'Reçu', 'Prix', 'Dû', 'Payé', 'Commercial', 'Statut']} alignDroite={[3, 4, 5, 6, 7]} vide="Aucun contrat."
            lignes={compte.contrats.map((c) => [c.numero || '-', `${fmtDate(c.debut)} → ${fmtDate(c.fin)}`, c.variete || '-', kg(c.quantite_kg), kg(c.livre_kg), `${fmt(c.prix_kg)}/kg`, fmt(c.du), fmt(c.total_paye),
              c.user_id ? <LienCompte key="u" to={`/agents/${c.user_id}`}>{c.vendeur_nom}</LienCompte> : '-', c.statut])} />
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
      <LivraisonForm open={livraison} contrats={contratsOuverts} onClose={() => setLivraison(false)} onSaved={() => { setLivraison(false); charger() }} />
      <PaiementProducteurForm open={paiement} producteurNom={p.nom} modes={modes} montantPropose={r.reste_a_payer || undefined}
        contrats={compte.contrats.filter((c) => c.total_paye < Math.max(c.du, c.valeur))}
        onClose={() => setPaiement(false)} onSaved={() => { setPaiement(false); charger() }} />
    </div>
  )
}
