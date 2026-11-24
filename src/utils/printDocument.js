const fmt  = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const fmtN = (n) => n != null ? Number(n).toLocaleString('fr-FR') : '-'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

const STATUT_LABEL = { Paye: 'Payé', 'En cours': 'En cours', 'En retard': 'En retard', Actif: 'Actif' }
const STATUT_COLOR = { Paye: '#1B5E20', 'En cours': '#F9A825', 'En retard': '#CC0000' }

function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Seul un logo PNG ou JPG en data URL est accepté dans le document (pas d'URL externe).
const LOGO_RE = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/

function css() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 32px 40px; }
    /* En-tête centré : logo, nom et coordonnées de la rizerie, puis type de document. */
    .header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 20px; gap: 16px; }
    .emetteur { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .emetteur-logo { max-height: 80px; max-width: 180px; object-fit: contain; }
    .emetteur-name { font-size: 20px; font-weight: 800; color: #1b75bc; letter-spacing: -0.5px; }
    .emetteur-info { font-size: 10.5px; color: #666; margin-top: 3px; line-height: 1.55; }
    .doc-block { text-align: center; }
    .doc-type { font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1a1a1a; }
    .doc-meta { font-size: 12px; color: #555; margin-top: 6px; line-height: 1.6; }
    .separator { border: none; border-top: 2.5px solid #1b75bc; margin: 20px 0; }
    .two-col { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 5px; }
    .client-name { font-size: 15px; font-weight: 700; }
    .client-info { font-size: 11px; color: #555; margin-top: 3px; line-height: 1.5; }
    .statut-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #1b75bc; color: #fff; }
    th { padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    th.r, td.r { text-align: right; }
    td { padding: 9px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    tbody tr:last-child td { border-bottom: none; }
    .total-section { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .total-box { min-width: 220px; border: 1.5px solid #1b75bc; border-radius: 6px; overflow: hidden; }
    .total-row { display: flex; justify-content: space-between; gap: 16px; padding: 7px 14px; font-size: 12px; border-bottom: 1px solid #e8e8e8; }
    .total-row:last-child { border-bottom: none; background: #1b75bc; color: #fff; font-weight: 800; font-size: 14px; }
    .total-row.paid { background: #f0fdf4; color: #1B5E20; font-weight: 700; }
    .total-row.due  { background: #fff7ed; color: #d97706; font-weight: 700; }
    .versements-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 8px; }
    .vers-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
    .vers-table th { background: #f5f5f5; color: #555; padding: 6px 10px; text-align: left; }
    .vers-table td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; }
    .footer { display: flex; justify-content: space-between; margin-top: 36px; gap: 20px; }
    .sign-box { border: 1px dashed #ccc; border-radius: 6px; padding: 10px 16px; min-width: 160px; text-align: center; }
    .sign-label { font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
    .sign-space { height: 50px; }
    .sign-name { font-size: 11px; color: #555; font-weight: 600; margin-top: 4px; }
    .note-box { margin-top: 20px; padding: 10px 14px; background: #fafafa; border-left: 3px solid #1b75bc; border-radius: 3px; font-size: 11px; color: #555; }
    .note-label { font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
    .attente { margin-bottom: 18px; padding: 8px 12px; background: #fff7ed; color: #b45309; border-radius: 4px; font-size: 11px; }
    .mentions { font-size: 9.5px; color: #888; text-align: center; margin-top: 28px; line-height: 1.5; }
    .clauses { font-size: 11px; color: #333; line-height: 1.6; margin: 10px 0 20px; }
    .clauses li { margin-left: 18px; margin-bottom: 4px; }
    @media print {
      body { padding: 16px 24px; }
      @page { margin: 12mm; }
    }
  `
}

// Identité de l'émetteur : rizerie paramétrée (page Paramètres) si elle est chargée, sinon les
// informations du compte comme avant.
function nomEmetteur(user) {
  return user?.entreprise?.nom || user?.rizerie || user?.nom || 'PFS'
}

function emetteurBlock(user) {
  const e = user?.entreprise || {}
  const nom = escapeHtml(nomEmetteur(user))
  const lines = []
  if (e.forme_juridique) lines.push(escapeHtml(e.forme_juridique))
  if (e.adresse) lines.push(escapeHtml(e.adresse))
  const lieu = [e.ville || user?.ville, e.pays].filter(Boolean).join(', ')
  if (lieu) lines.push(escapeHtml(lieu))
  const tel = e.telephone || user?.telephone
  if (tel) lines.push(`Tél : ${escapeHtml(tel)}`)
  if (e.email) lines.push(escapeHtml(e.email))
  const ids = [e.ninea && `NINEA : ${e.ninea}`, e.rccm && `RCCM : ${e.rccm}`].filter(Boolean)
  if (ids.length) lines.push(escapeHtml(ids.join(' · ')))
  const logo = typeof e.logo === 'string' && LOGO_RE.test(e.logo)
    ? `<img class="emetteur-logo" src="${e.logo}" alt="">`
    : ''
  return `
    <div class="emetteur">
      ${logo}
      <div>
        <div class="emetteur-name">${nom}</div>
        <div class="emetteur-info">${lines.join('<br>')}</div>
      </div>
    </div>
  `
}

function mentionsBlock(user) {
  const e = user?.entreprise || {}
  const parts = [e.mentions_documents, e.site_web].filter(Boolean)
  const gen = `Document généré le ${new Date().toLocaleDateString('fr-FR')} · ${nomEmetteur(user)}`
  return `<p class="mentions">${parts.map(escapeHtml).join('<br>')}${parts.length ? '<br>' : ''}${escapeHtml(gen)}</p>`
}

function wrap(title, body) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>${css()}</style>
</head>
<body onload="window.print()">
  ${body}
</body>
</html>`
}

function openPrintWindow(title, body) {
  const win = window.open('', '_blank')
  if (!win) {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert("Impossible d'ouvrir l'impression. Veuillez autoriser les fenêtres surgissantes (pop-ups) pour ce site.")
    }
    return
  }
  win.document.open()
  win.document.write(wrap(title, body))
  win.document.close()
}

// Lignes produits d'une vente : `vente.lignes` si présentes, sinon la ligne unique historique.
function lignesDe(vente) {
  const lignes = Array.isArray(vente.lignes) && vente.lignes.length
    ? vente.lignes
    : [{ produit: vente.produit, quantite: vente.quantite, prix_unitaire: vente.prix_unitaire, montant: vente.montant }]
  return lignes.map((l) => ({
    ...l,
    montant: l.montant != null ? l.montant : Number(l.quantite || 0) * Number(l.prix_unitaire || 0),
  }))
}

function tableLignes(vente) {
  const rows = lignesDe(vente).map((l) => `
        <tr>
          <td>${escapeHtml(l.produit || '-')}</td>
          <td class="r">${fmtN(l.quantite)} kg</td>
          <td class="r">${fmt(l.prix_unitaire)} / kg</td>
          <td class="r"><strong>${fmt(l.montant)}</strong></td>
        </tr>`).join('')
  return `
    <table>
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="r">Quantité</th>
          <th class="r">Prix unit.</th>
          <th class="r">Montant</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function signatures(gauche, droite) {
  return `
    <div class="footer">
      <div class="sign-box">
        <div class="sign-label">${escapeHtml(gauche.label)}</div>
        <div class="sign-space"></div>
        <div class="sign-name">${escapeHtml(gauche.nom || '')}</div>
      </div>
      <div class="sign-box">
        <div class="sign-label">${escapeHtml(droite.label)}</div>
        <div class="sign-space"></div>
        <div class="sign-name">${escapeHtml(droite.nom || '')}</div>
      </div>
    </div>`
}

// ─── BON DE COMMANDE ─────────────────────────────────────────────────────────

export function printBonCommande(vente, user) {
  const rawStatut = STATUT_LABEL[vente.statut_paiement] || vente.statut_paiement || ''
  const statut = escapeHtml(rawStatut)
  const sColor = STATUT_COLOR[vente.statut_paiement] || '#555'

  const body = `
    <div class="header">
      <div>${emetteurBlock(user)}</div>
      <div class="doc-block">
        <div class="doc-type">Bon de commande</div>
        <div class="doc-meta">
          N° <strong>${escapeHtml(vente.numero || '-')}</strong><br>
          Date : ${escapeHtml(fmtDate(vente.date_vente))}<br>
          ${vente.date_echeance ? `Échéance : ${escapeHtml(fmtDate(vente.date_echeance))}<br>` : ''}
          ${vente.conditions_paiement ? `Conditions : ${escapeHtml(vente.conditions_paiement)}<br>` : ''}
          <span class="statut-badge" style="background:${sColor}22;color:${sColor}">${statut}</span>
        </div>
      </div>
    </div>
    <hr class="separator">

    <div class="two-col">
      <div>
        <div class="section-label">Client</div>
        <div class="client-name">${escapeHtml(vente.client_nom || '-')}</div>
        ${vente.client_telephone ? `<div class="client-info">Tél : ${escapeHtml(vente.client_telephone)}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div class="section-label">Commercial</div>
        <div class="client-name">${escapeHtml(vente.vendeur_nom || user?.nom || '-')}</div>
      </div>
    </div>

    ${tableLignes(vente)}

    <div class="total-section">
      <div class="total-box">
        <div class="total-row"><span>Sous-total HT</span><span>${fmt(vente.montant)}</span></div>
        <div class="total-row"><span>Total à régler</span><span>${fmt(vente.montant)}</span></div>
      </div>
    </div>

    ${vente.mode ? `<p style="font-size:11px;color:#555;margin-bottom:20px">Mode de paiement : <strong>${escapeHtml(vente.mode)}</strong></p>` : ''}

    ${vente.note ? `<div class="note-box"><div class="note-label">Note</div>${escapeHtml(vente.note)}</div>` : ''}

    ${signatures({ label: 'Signature client', nom: vente.client_nom }, { label: 'Signature émetteur', nom: vente.vendeur_nom || user?.nom })}
    ${mentionsBlock(user)}
  `

  openPrintWindow(`Bon de commande - ${vente.numero || ''}`, body)
}

// ─── REÇU DE PAIEMENT ────────────────────────────────────────────────────────
// Le reçu atteste l'argent remis par le client. Il peut être envoyé dès la déclaration,
// avant la validation du comptable (contrairement à la facture).

export function printRecu(transaction, versement, totalVerse, resteAdu, user) {
  const rawStatut = resteAdu <= 0 ? 'Soldé' : 'Partiellement réglé'
  const statut = escapeHtml(rawStatut)
  const sColor = resteAdu <= 0 ? '#1B5E20' : '#F9A825'
  const enAttente = versement.statut_validation === 'declare'

  const body = `
    <div class="header">
      <div>${emetteurBlock(user)}</div>
      <div class="doc-block">
        <div class="doc-type">Reçu de paiement</div>
        <div class="doc-meta">
          Réf. <strong>${escapeHtml(transaction.numero || '-')}</strong><br>
          Date : ${escapeHtml(fmtDate(versement.date || new Date()))}<br>
          <span class="statut-badge" style="background:${sColor}22;color:${sColor}">${statut}</span>
        </div>
      </div>
    </div>
    <hr class="separator">

    <div class="two-col" style="margin-bottom:28px">
      <div>
        <div class="section-label">Client</div>
        <div class="client-name">${escapeHtml(transaction.client_nom || '-')}</div>
      </div>
      <div style="text-align:right">
        <div class="section-label">Émis par</div>
        <div class="client-name">${escapeHtml(user?.nom || '-')}</div>
      </div>
    </div>

    ${enAttente ? '<p class="attente">Paiement reçu par le commercial. Il sera confirmé après le contrôle comptable.</p>' : ''}

    <div class="total-box" style="margin-bottom:24px;max-width:360px;margin-left:auto;margin-right:auto">
      <div class="total-row"><span>Montant total de la transaction</span><span>${fmt(transaction.montant_total)}</span></div>
      <div class="total-row paid"><span>Montant reçu ce jour</span><span>${fmt(versement.montant)}</span></div>
      ${versement.mode ? `<div class="total-row" style="background:#f8f8f8"><span>Mode de paiement</span><span>${escapeHtml(versement.mode)}</span></div>` : ''}
      ${versement.reference ? `<div class="total-row" style="background:#f8f8f8"><span>Référence</span><span>${escapeHtml(versement.reference)}</span></div>` : ''}
      <div class="total-row paid"><span>Total reçu à ce jour</span><span>${fmt(totalVerse)}</span></div>
      <div class="total-row ${resteAdu > 0 ? 'due' : ''}">
        <span>${resteAdu > 0 ? 'Reste à payer' : 'Compte soldé'}</span>
        <span>${resteAdu > 0 ? fmt(resteAdu) : '✓'}</span>
      </div>
    </div>

    ${signatures({ label: 'Signature client', nom: transaction.client_nom }, { label: 'Cachet émetteur', nom: nomEmetteur(user) })}
    ${mentionsBlock(user)}
  `

  openPrintWindow(`Reçu - ${transaction.numero || ''}`, body)
}

// ─── FACTURE ─────────────────────────────────────────────────────────────────
// `versements` : seulement les encaissements validés (voir GET /api/ventes/:id/facture).

export function printFacture(vente, versements, user) {
  const rawStatut = STATUT_LABEL[vente.statut_paiement] || vente.statut_paiement || ''
  const statut  = escapeHtml(rawStatut)
  const sColor  = STATUT_COLOR[vente.statut_paiement] || '#555'
  const totalVerse = (versements || []).reduce((s, v) => s + Number(v.montant || 0), 0)
  const resteAdu   = Math.max(0, Number(vente.montant || 0) - totalVerse)

  const versementsRows = (versements || []).map(v => `
        <tr>
          <td>${escapeHtml(fmtDate(v.date))}</td>
          <td>${escapeHtml(v.mode || '-')}</td>
          <td style="text-align:right"><strong>${fmt(v.montant)}</strong></td>
        </tr>`).join('')

  const body = `
    <div class="header">
      <div>${emetteurBlock(user)}</div>
      <div class="doc-block">
        <div class="doc-type">Facture</div>
        <div class="doc-meta">
          N° <strong>${escapeHtml(vente.numero || '-')}</strong><br>
          Date : ${escapeHtml(fmtDate(vente.date_vente))}<br>
          ${vente.date_echeance ? `Échéance : ${escapeHtml(fmtDate(vente.date_echeance))}<br>` : ''}
          <span class="statut-badge" style="background:${sColor}22;color:${sColor}">${statut}</span>
        </div>
      </div>
    </div>
    <hr class="separator">

    <div class="two-col">
      <div>
        <div class="section-label">Facturé à</div>
        <div class="client-name">${escapeHtml(vente.client_nom || '-')}</div>
        ${vente.client_telephone ? `<div class="client-info">Tél : ${escapeHtml(vente.client_telephone)}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div class="section-label">Émis par</div>
        <div class="client-name">${escapeHtml(vente.vendeur_nom || user?.nom || '-')}</div>
      </div>
    </div>

    ${tableLignes(vente)}

    <div class="total-section">
      <div class="total-box">
        <div class="total-row"><span>Total facturé</span><span>${fmt(vente.montant)}</span></div>
        <div class="total-row paid"><span>Déjà encaissé</span><span>${fmt(totalVerse)}</span></div>
        <div class="total-row ${resteAdu > 0 ? 'due' : ''}">
          <span>${resteAdu > 0 ? 'Reste à payer' : 'Soldé'}</span>
          <span>${resteAdu > 0 ? fmt(resteAdu) : '✓'}</span>
        </div>
      </div>
    </div>

    ${versements?.length ? `
      <div class="versements-title">Historique des paiements</div>
      <table class="vers-table">
        <thead><tr><th>Date</th><th>Mode</th><th style="text-align:right">Montant</th></tr></thead>
        <tbody>${versementsRows}</tbody>
      </table>
    ` : ''}

    ${vente.note ? `<div class="note-box"><div class="note-label">Note</div>${escapeHtml(vente.note)}</div>` : ''}

    ${signatures({ label: 'Signature client', nom: vente.client_nom }, { label: 'Cachet émetteur', nom: nomEmetteur(user) })}
    ${mentionsBlock(user)}
  `

  openPrintWindow(`Facture - ${vente.numero || ''}`, body)
}

// ─── BON DE DÉPÔT (dépôt-vente, un ou plusieurs produits) ────────────────────

export function printBonDepot(depots, user) {
  const liste = Array.isArray(depots) ? depots : [depots]
  if (!liste.length) return
  const d0 = liste[0]
  const total = liste.reduce((s, d) => s + Number(d.quantite_deposee || 0) * Number(d.prix_unitaire || 0), 0)
  const rows = liste.map((d) => `
        <tr>
          <td>${escapeHtml(d.produit || '-')}<br><span style="color:#999;font-size:10px">${escapeHtml(d.numero || '')}</span></td>
          <td class="r">${fmtN(d.quantite_deposee)} kg</td>
          <td class="r">${fmt(d.prix_unitaire)} / kg</td>
          <td class="r"><strong>${fmt(Number(d.quantite_deposee || 0) * Number(d.prix_unitaire || 0))}</strong></td>
        </tr>`).join('')

  const body = `
    <div class="header">
      <div>${emetteurBlock(user)}</div>
      <div class="doc-block">
        <div class="doc-type">Bon de dépôt</div>
        <div class="doc-meta">
          N° <strong>${escapeHtml(d0.lot || d0.numero || '-')}</strong><br>
          Date : ${escapeHtml(fmtDate(d0.date_depot))}
        </div>
      </div>
    </div>
    <hr class="separator">
    <div class="two-col">
      <div>
        <div class="section-label">Distributeur</div>
        <div class="client-name">${escapeHtml(d0.client_nom || '-')}</div>
      </div>
      <div style="text-align:right">
        <div class="section-label">Commercial</div>
        <div class="client-name">${escapeHtml(d0.vendeur_nom || user?.nom || '-')}</div>
      </div>
    </div>
    <table>
      <thead><tr><th>Produit</th><th class="r">Quantité déposée</th><th class="r">Prix unit.</th><th class="r">Valeur</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total-section">
      <div class="total-box">
        <div class="total-row"><span>Valeur totale déposée</span><span>${fmt(total)}</span></div>
      </div>
    </div>
    <p style="font-size:11px;color:#555">Le distributeur règle seulement les quantités vendues. Les invendus sont repris par la rizerie.</p>
    ${d0.note ? `<div class="note-box"><div class="note-label">Note</div>${escapeHtml(d0.note)}</div>` : ''}
    ${signatures({ label: 'Signature distributeur', nom: d0.client_nom }, { label: 'Cachet émetteur', nom: nomEmetteur(user) })}
    ${mentionsBlock(user)}
  `
  openPrintWindow(`Bon de dépôt - ${d0.lot || d0.numero || ''}`, body)
}

// ─── CONTRAT CLIENT (commande récurrente) ────────────────────────────────────

export function printContrat(contrat, user) {
  const produits = Array.isArray(contrat.produits) && contrat.produits.length
    ? contrat.produits.join(', ')
    : contrat.produit
  const mensuel = Number(contrat.quantite_mensuelle || 0) * Number(contrat.prix_unitaire || 0)
  const body = `
    <div class="header">
      <div>${emetteurBlock(user)}</div>
      <div class="doc-block">
        <div class="doc-type">Contrat</div>
        <div class="doc-meta">
          N° <strong>${escapeHtml(contrat.numero || '-')}</strong><br>
          Du ${escapeHtml(fmtDate(contrat.date_debut))} au ${escapeHtml(fmtDate(contrat.date_fin))}
        </div>
      </div>
    </div>
    <hr class="separator">
    <div class="two-col">
      <div>
        <div class="section-label">Fournisseur</div>
        <div class="client-name">${escapeHtml(nomEmetteur(user))}</div>
      </div>
      <div style="text-align:right">
        <div class="section-label">Client</div>
        <div class="client-name">${escapeHtml(contrat.client_nom || '-')}</div>
      </div>
    </div>
    <table>
      <thead><tr><th>Produit</th><th class="r">Quantité par mois</th><th class="r">Prix unit.</th><th class="r">Montant mensuel</th></tr></thead>
      <tbody><tr>
        <td>${escapeHtml(produits || '-')}</td>
        <td class="r">${fmtN(contrat.quantite_mensuelle)} kg</td>
        <td class="r">${fmt(contrat.prix_unitaire)} / kg</td>
        <td class="r"><strong>${fmt(mensuel)}</strong></td>
      </tr></tbody>
    </table>
    <ul class="clauses">
      <li>Le fournisseur livre chaque mois la quantité indiquée.</li>
      <li>Le client règle chaque livraison selon l'échéancier du contrat.</li>
      <li>Chaque paiement donne lieu à un reçu.</li>
    </ul>
    ${contrat.note ? `<div class="note-box"><div class="note-label">Conditions particulières</div>${escapeHtml(contrat.note)}</div>` : ''}
    ${signatures({ label: 'Signature client', nom: contrat.client_nom }, { label: 'Signature fournisseur', nom: nomEmetteur(user) })}
    ${mentionsBlock(user)}
  `
  openPrintWindow(`Contrat - ${contrat.numero || ''}`, body)
}
