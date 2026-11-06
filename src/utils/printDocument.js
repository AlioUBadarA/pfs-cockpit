const fmt  = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '-'
const fmtN = (n) => n != null ? Number(n).toLocaleString('fr-FR') : '-'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

const STATUT_LABEL = { Paye: 'Payé', 'En cours': 'En cours', 'En retard': 'En retard', Actif: 'Actif' }
const STATUT_COLOR = { Paye: '#1B5E20', 'En cours': '#F9A825', 'En retard': '#CC0000' }

function css() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 32px 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .emetteur-name { font-size: 22px; font-weight: 800; color: #1b75bc; letter-spacing: -0.5px; }
    .emetteur-info { font-size: 11px; color: #666; margin-top: 5px; line-height: 1.6; }
    .doc-block { text-align: right; }
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
    .total-row { display: flex; justify-content: space-between; padding: 7px 14px; font-size: 12px; border-bottom: 1px solid #e8e8e8; }
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
    @media print {
      body { padding: 16px 24px; }
      @page { margin: 12mm; }
    }
  `
}

function emetteurBlock(user) {
  const lines = [user?.rizerie || user?.nom]
  if (user?.ville) lines.push(user.ville)
  if (user?.telephone) lines.push(`Tél : ${user.telephone}`)
  return `
    <div class="emetteur-name">${user?.rizerie || 'PFS'}</div>
    <div class="emetteur-info">${lines.slice(1).join('<br>')}</div>
  `
}

function wrap(title, body, user) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${css()}</style>
</head>
<body onload="window.print()">
  ${body}
</body>
</html>`
}

// ─── BON DE COMMANDE ─────────────────────────────────────────────────────────

export function printBonCommande(vente, user) {
  const statut = STATUT_LABEL[vente.statut_paiement] || vente.statut_paiement
  const sColor = STATUT_COLOR[vente.statut_paiement] || '#555'

  const body = `
    <div class="header">
      <div>${emetteurBlock(user)}</div>
      <div class="doc-block">
        <div class="doc-type">Bon de commande</div>
        <div class="doc-meta">
          N° <strong>${vente.numero || '-'}</strong><br>
          Date : ${fmtDate(vente.date_vente)}<br>
          ${vente.date_echeance ? `Échéance : ${fmtDate(vente.date_echeance)}<br>` : ''}
          <span class="statut-badge" style="background:${sColor}22;color:${sColor}">${statut}</span>
        </div>
      </div>
    </div>
    <hr class="separator">

    <div class="two-col">
      <div>
        <div class="section-label">Client</div>
        <div class="client-name">${vente.client_nom}</div>
        ${vente.client_telephone ? `<div class="client-info">Tél : ${vente.client_telephone}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div class="section-label">Commercial</div>
        <div class="client-name">${vente.vendeur_nom || user?.nom || '-'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="r">Quantité</th>
          <th class="r">Prix unit.</th>
          <th class="r">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${vente.produit}</td>
          <td class="r">${fmtN(vente.quantite)} kg</td>
          <td class="r">${fmt(vente.prix_unitaire)} / kg</td>
          <td class="r"><strong>${fmt(vente.montant)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-box">
        <div class="total-row"><span>Sous-total HT</span><span>${fmt(vente.montant)}</span></div>
        <div class="total-row"><span>Total à régler</span><span>${fmt(vente.montant)}</span></div>
      </div>
    </div>

    ${vente.mode ? `<p style="font-size:11px;color:#555;margin-bottom:20px">Mode de paiement : <strong>${vente.mode}</strong></p>` : ''}

    ${vente.note ? `<div class="note-box"><div class="note-label">Note</div>${vente.note}</div>` : ''}

    <div class="footer">
      <div class="sign-box">
        <div class="sign-label">Signature client</div>
        <div class="sign-space"></div>
        <div class="sign-name">${vente.client_nom}</div>
      </div>
      <div class="sign-box">
        <div class="sign-label">Signature émetteur</div>
        <div class="sign-space"></div>
        <div class="sign-name">${vente.vendeur_nom || user?.nom || ''}</div>
      </div>
    </div>
  `

  const win = window.open('', '_blank')
  win.document.write(wrap(`Bon de commande - ${vente.numero}`, body, user))
  win.document.close()
}

// ─── REÇU DE PAIEMENT ────────────────────────────────────────────────────────

export function printRecu(transaction, versement, totalVerse, resteAdu, user) {
  const statut = resteAdu <= 0 ? 'Soldé' : 'Partiellement réglé'
  const sColor = resteAdu <= 0 ? '#1B5E20' : '#F9A825'

  const body = `
    <div class="header">
      <div>${emetteurBlock(user)}</div>
      <div class="doc-block">
        <div class="doc-type">Reçu de paiement</div>
        <div class="doc-meta">
          Réf. <strong>${transaction.numero || '-'}</strong><br>
          Date : ${fmtDate(versement.date || new Date())}<br>
          <span class="statut-badge" style="background:${sColor}22;color:${sColor}">${statut}</span>
        </div>
      </div>
    </div>
    <hr class="separator">

    <div class="two-col" style="margin-bottom:28px">
      <div>
        <div class="section-label">Client</div>
        <div class="client-name">${transaction.client_nom}</div>
      </div>
      <div style="text-align:right">
        <div class="section-label">Émis par</div>
        <div class="client-name">${user?.nom || '-'}</div>
      </div>
    </div>

    <div class="total-box" style="margin-bottom:24px;max-width:340px;margin-left:auto;margin-right:auto">
      <div class="total-row"><span>Montant total de la transaction</span><span>${fmt(transaction.montant_total)}</span></div>
      <div class="total-row paid"><span>Montant encaissé ce jour</span><span>${fmt(versement.montant)}</span></div>
      ${versement.mode ? `<div class="total-row" style="background:#f8f8f8"><span>Mode de paiement</span><span>${versement.mode}</span></div>` : ''}
      <div class="total-row paid"><span>Total encaissé à ce jour</span><span>${fmt(totalVerse)}</span></div>
      <div class="total-row ${resteAdu > 0 ? 'due' : ''}">
        <span>${resteAdu > 0 ? 'Reste à payer' : 'Compte soldé'}</span>
        <span>${resteAdu > 0 ? fmt(resteAdu) : '✓'}</span>
      </div>
    </div>

    <div class="footer">
      <div class="sign-box">
        <div class="sign-label">Signature client</div>
        <div class="sign-space"></div>
        <div class="sign-name">${transaction.client_nom}</div>
      </div>
      <div class="sign-box">
        <div class="sign-label">Cachet émetteur</div>
        <div class="sign-space"></div>
        <div class="sign-name">${user?.rizerie || user?.nom || ''}</div>
      </div>
    </div>

    <p style="font-size:10px;color:#bbb;text-align:center;margin-top:32px">
      Document généré le ${new Date().toLocaleDateString('fr-FR')} · ${user?.rizerie || 'PFS'}
    </p>
  `

  const win = window.open('', '_blank')
  win.document.write(wrap(`Reçu - ${transaction.numero}`, body, user))
  win.document.close()
}

// ─── FACTURE ─────────────────────────────────────────────────────────────────

export function printFacture(vente, versements, user) {
  const statut  = STATUT_LABEL[vente.statut_paiement] || vente.statut_paiement
  const sColor  = STATUT_COLOR[vente.statut_paiement] || '#555'
  const totalVerse = (versements || []).reduce((s, v) => s + Number(v.montant || 0), 0)
  const resteAdu   = Math.max(0, Number(vente.montant || 0) - totalVerse)

  const versementsRows = (versements || []).length
    ? (versements || []).map(v => `
        <tr>
          <td>${fmtDate(v.date)}</td>
          <td>${v.mode || '-'}</td>
          <td style="text-align:right"><strong>${fmt(v.montant)}</strong></td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="color:#aaa;text-align:center">Aucun versement enregistré</td></tr>`

  const body = `
    <div class="header">
      <div>${emetteurBlock(user)}</div>
      <div class="doc-block">
        <div class="doc-type">Facture</div>
        <div class="doc-meta">
          N° <strong>${vente.numero || '-'}</strong><br>
          Date : ${fmtDate(vente.date_vente)}<br>
          ${vente.date_echeance ? `Échéance : ${fmtDate(vente.date_echeance)}<br>` : ''}
          <span class="statut-badge" style="background:${sColor}22;color:${sColor}">${statut}</span>
        </div>
      </div>
    </div>
    <hr class="separator">

    <div class="two-col">
      <div>
        <div class="section-label">Facturé à</div>
        <div class="client-name">${vente.client_nom}</div>
        ${vente.client_telephone ? `<div class="client-info">Tél : ${vente.client_telephone}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div class="section-label">Émis par</div>
        <div class="client-name">${vente.vendeur_nom || user?.nom || '-'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="r">Quantité</th>
          <th class="r">Prix unit.</th>
          <th class="r">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${vente.produit}</td>
          <td class="r">${fmtN(vente.quantite)} kg</td>
          <td class="r">${fmt(vente.prix_unitaire)} / kg</td>
          <td class="r"><strong>${fmt(vente.montant)}</strong></td>
        </tr>
      </tbody>
    </table>

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

    ${vente.note ? `<div class="note-box"><div class="note-label">Note</div>${vente.note}</div>` : ''}

    <div class="footer">
      <div class="sign-box">
        <div class="sign-label">Signature client</div>
        <div class="sign-space"></div>
        <div class="sign-name">${vente.client_nom}</div>
      </div>
      <div class="sign-box">
        <div class="sign-label">Cachet émetteur</div>
        <div class="sign-space"></div>
        <div class="sign-name">${user?.rizerie || user?.nom || ''}</div>
      </div>
    </div>
  `

  const win = window.open('', '_blank')
  win.document.write(wrap(`Facture - ${vente.numero}`, body, user))
  win.document.close()
}
