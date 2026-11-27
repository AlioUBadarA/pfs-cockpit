import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import PageTabs from '../components/PageTabs'
import { formatCFA as fmt, formatDate as fmtDate } from '../utils/format'
import { emetteur } from '../utils/entreprise'
import { printReleveClient } from '../utils/printDocument'
import { Badge, EtatCompte, LienCompte, STATUT_TACHE, STATUT_VENTE, STATUT_VERS, Tableau, kg } from '../components/CompteCommun'

// Compte d'un client : tout ce qu'il a fait avec la rizerie, comme un compte en banque.


export default function ClientCompte() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [compte, setCompte] = useState(null)
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState('releve')

  useEffect(() => {
    setCompte(null); setErreur('')
    api.get(`/api/clients/${id}/compte`)
      .then((r) => setCompte(r.data))
      .catch((err) => setErreur(err.response?.data?.error || 'Compte introuvable'))
  }, [id])

  if (!compte) return <EtatCompte erreur={erreur} retour="/clients" libelleRetour="Clients" />

  const { client: c, resume: r } = compte
  const onglets = [
    { key: 'releve', label: 'Relevé', badge: 0 },
    { key: 'ventes', label: `Ventes (${compte.ventes.length})` },
    { key: 'encaissements', label: `Encaissements (${compte.encaissements.length})` },
    { key: 'contrats', label: `Contrats (${compte.contrats.length})` },
    { key: 'depots', label: `Dépôts (${compte.depots.length})` },
    { key: 'activites', label: `Activités (${compte.activites.length})` },
    { key: 'taches', label: `Tâches (${compte.taches.length})` },
  ]

  return (
    <div className="space-y-5">
      <Link to="/clients" className="text-sm text-[#1b75bc]">← Clients</Link>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">{c.nom}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {[c.type, c.zone, c.telephone, c.statut].filter(Boolean).join(' · ')}
            {c.vendeur_nom && <> · {c.user_id === user?.id ? 'Mon client' : <>Suivi par <LienCompte to={`/agents/${c.user_id}`}>{c.vendeur_nom}</LienCompte></>}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={async () => printReleveClient(compte, await emetteur(user))}>⎙ Relevé de compte</button>
          <button className="btn-secondary text-sm" onClick={() => navigate(`/clients?modifier=${c.id}`)}>Modifier la fiche</button>
        </div>
      </div>

      {compte.restreint && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
          Ce client est suivi par {c.vendeur_nom || 'un autre commercial'}. Seules vos propres actions s'affichent ici.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total des achats" value={fmt(r.total_achats)} sub={`${r.nb_ventes} vente(s) · panier moyen ${fmt(r.panier_moyen)}`} color="#1b75bc" />
        <KpiCard title="Encaissé" value={fmt(r.total_encaisse)} sub={r.en_attente_validation ? `${fmt(r.en_attente_validation)} à valider` : 'validé'} color="#1B5E20" />
        <KpiCard title="Solde dû" value={fmt(r.solde_du)} sub={r.en_retard ? `dont ${fmt(r.en_retard)} en retard` : 'aucun retard'} color={r.en_retard ? '#CC0000' : '#e08e0b'} />
        {r.nb_depots
          ? <KpiCard title="Stock en dépôt" value={kg(r.stock_en_depot)} sub={`${fmt(r.valeur_stock_en_depot)} · ${r.nb_depots} dépôt(s)`} color="#6a1b9a" />
          : <KpiCard title="Client depuis" value={r.premiere_vente ? fmtDate(r.premiere_vente) : '-'} sub={r.derniere_vente ? `dernier achat le ${fmtDate(r.derniere_vente)}` : 'aucun achat'} />}
      </div>

      <PageTabs tabs={onglets} active={onglet} setActive={setOnglet} />

      {onglet === 'releve' && (
        <Panel title="Relevé de compte" sub="Ventes et échéances au débit, encaissements validés au crédit">
          <Tableau entetes={['Date', 'Opération', 'Débit', 'Crédit', 'Solde']} alignDroite={[2, 3, 4]} vide="Aucune opération."
            lignes={compte.releve.map((l) => [fmtDate(l.date), l.libelle, l.debit ? fmt(l.debit) : '', l.credit ? fmt(l.credit) : '', <strong key="s">{fmt(l.solde)}</strong>])} />
        </Panel>
      )}
      {onglet === 'ventes' && (
        <Panel title="Ventes">
          <Tableau entetes={['N°', 'Date', 'Produits', 'Montant', 'Encaissé', 'Reste', 'Échéance', 'Statut']} alignDroite={[3, 4, 5]} vide="Aucune vente."
            lignes={compte.ventes.map((v) => [v.numero || '-', fmtDate(v.date), v.nb_lignes > 1 ? `${v.nb_lignes} produits` : v.produit, fmt(v.montant), fmt(v.total_valide), fmt(v.reste),
              fmtDate(v.date_echeance), v.validation_commande === 'refusee' ? <Badge key="b" def={['Refusée', 'text-red-700 bg-red-50']} /> : <Badge key="b" def={STATUT_VENTE[v.statut_paiement]} />])} />
        </Panel>
      )}
      {onglet === 'encaissements' && (
        <Panel title="Encaissements">
          <Tableau entetes={['Date', 'Pièce', 'Mode', 'Montant', 'Statut']} alignDroite={[3]} vide="Aucun encaissement."
            lignes={compte.encaissements.map((x) => [fmtDate(x.date), x.piece || '-', x.mode || '-', fmt(x.montant), <Badge key="b" def={STATUT_VERS[x.statut_validation]} />])} />
        </Panel>
      )}
      {onglet === 'contrats' && (
        <Panel title="Contrats">
          <Tableau entetes={['N°', 'Période', 'Produits', 'Quantité par mois', 'Prix', 'Échéances payées', 'Statut']} alignDroite={[3, 4]} vide="Aucun contrat."
            lignes={compte.contrats.map((ct) => [ct.numero || '-', `${fmtDate(ct.date_debut)} → ${fmtDate(ct.date_fin)}`, (ct.produits?.length ? ct.produits : [ct.produit]).filter(Boolean).join(', '),
              `${Number(ct.quantite_mensuelle || 0).toLocaleString('fr-FR')} kg`, `${fmt(ct.prix_unitaire)}/kg`,
              `${ct.echeances.filter((e) => e.statut_paiement === 'Paye').length} / ${ct.echeances.length}`, ct.statut])} />
        </Panel>
      )}
      {onglet === 'depots' && (
        <>
          <Panel title="Dépôts-vente" sub="Stock confié au distributeur. Il doit ce qu'il a déclaré vendu.">
            <Tableau entetes={['N°', 'Date', 'Produit', 'Déposé', 'Vendu', 'Retourné', 'En stock', 'Montant dû', 'Encaissé', 'Statut']} alignDroite={[3, 4, 5, 6, 7, 8]} vide="Aucun dépôt."
              lignes={compte.depots.map((d) => [d.numero || '-', fmtDate(d.date), d.produit, kg(d.quantite_deposee), kg(d.quantite_vendue), kg(d.quantite_retournee),
                <strong key="s">{kg(d.stock_restant)}</strong>, fmt(d.montant_du), fmt(d.total_valide), d.statut])} />
          </Panel>
          {compte.depots.some((d) => (d.mouvements || []).length) && (
            <Panel title="Rapports du distributeur" sub="Ventes déclarées et retours, passage par passage">
              <Tableau entetes={['Date', 'Dépôt', 'Mouvement', 'Quantité', 'Montant', 'Note']} alignDroite={[3, 4]} vide="Aucun rapport."
                lignes={compte.depots.flatMap((d) => (d.mouvements || []).map((m) => ({ ...m, d })))
                  .sort((x, y) => (y.date || '').localeCompare(x.date || ''))
                  .map((m) => [fmtDate(m.date), m.d.numero || m.d.produit, m.type === 'vente' ? 'Vendu' : 'Retour', kg(m.quantite),
                    m.type === 'vente' ? fmt(Number(m.quantite) * Number(m.d.prix_unitaire)) : '-', m.note || '-'])} />
            </Panel>
          )}
        </>
      )}
      {onglet === 'activites' && (
        <Panel title="Activités" sub="Visites, appels, relances et comptes rendus">
          <Tableau entetes={['Date', 'Type', 'Résultat', 'Note', 'Par']} vide="Aucune activité."
            lignes={compte.activites.map((a) => [fmtDate(a.date), a.type, a.resultat || '-', a.note || '-', a.auteur || '-'])} />
        </Panel>
      )}
      {onglet === 'taches' && (
        <Panel title="Tâches" sub="Planifiées, assignées ou automatiques">
          <Tableau entetes={['Date', 'Action', 'Statut', 'Détail', 'Commercial']} vide="Aucune tâche."
            lignes={compte.taches.map((t) => [fmtDate(t.date), t.type, <Badge key="b" def={STATUT_TACHE[t.statut]} />, t.compte_rendu || t.consigne || '-', t.commercial_nom || '-'])} />
        </Panel>
      )}
    </div>
  )
}
