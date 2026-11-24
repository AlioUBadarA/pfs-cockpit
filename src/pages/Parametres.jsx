import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { chargerEntreprise, oublierEntreprise, lireFichierPourApi } from '../utils/entreprise'

const ONGLETS = [
  { key: 'general', label: 'Informations générales' },
  { key: 'adresse', label: 'Adresse et contact' },
  { key: 'documents', label: 'Logo et documents' },
]

const CHAMPS = {
  general: [
    { key: 'nom', label: 'Nom de la rizerie *', max: 150 },
    { key: 'forme_juridique', label: 'Forme juridique', max: 60, placeholder: 'Ex : SARL, GIE, SA' },
    { key: 'ninea', label: 'NINEA', max: 60 },
    { key: 'rccm', label: 'RCCM', max: 60 },
  ],
  adresse: [
    { key: 'adresse', label: 'Adresse', max: 250 },
    { key: 'ville', label: 'Ville', max: 80 },
    { key: 'region', label: 'Région', max: 100 },
    { key: 'pays', label: 'Pays', max: 80 },
    { key: 'telephone', label: 'Téléphone', max: 30 },
    { key: 'email', label: 'E-mail', max: 200, type: 'email' },
    { key: 'site_web', label: 'Site web', max: 200, placeholder: 'https://…' },
  ],
}
const TOUS = [...CHAMPS.general, ...CHAMPS.adresse, { key: 'mentions_documents' }].map((c) => c.key)

// Paramètres de la rizerie : identité affichée sur le reçu, la facture, le bon de commande, le
// bon de dépôt et le contrat. Le rizier et le directeur modifient. Les autres consultent.
export default function Parametres() {
  const [onglet, setOnglet] = useState('general')
  const [data, setData] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [succes, setSucces] = useState('')
  const [logo, setLogo] = useState(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const fileRef = useRef(null)

  const charger = async () => {
    setLoading(true)
    const e = await chargerEntreprise({ forcer: true })
    if (!e) setError('Impossible de charger les paramètres de la rizerie')
    else {
      setData(e)
      setForm(Object.fromEntries(TOUS.map((k) => [k, e[k] || ''])))
      setLogo(e.logo || null)
    }
    setLoading(false)
  }

  useEffect(() => { charger() }, [])

  const peutModifier = !!data?.peut_modifier
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const enregistrer = async (e) => {
    e.preventDefault()
    setSaving(true); setError(''); setSucces('')
    try {
      await api.put('/api/rizerie', form)
      oublierEntreprise()
      await charger()
      setSucces('Paramètres enregistrés. Ils apparaissent sur les prochains documents.')
    } catch (err) {
      setError(err.response?.data?.error || 'Enregistrement impossible')
    } finally { setSaving(false) }
  }

  const envoyerLogo = async (ev) => {
    const file = ev.target.files?.[0]
    if (!file) return
    setLogoBusy(true); setError(''); setSucces('')
    try {
      const fichier = await lireFichierPourApi(file, ['image/png', 'image/jpeg'])
      await api.put('/api/rizerie/logo', { fichier: { nom: fichier.nom, data: fichier.data } })
      oublierEntreprise()
      await charger()
      setSucces('Logo enregistré.')
    } catch (err) {
      setError(err.response?.data?.error || (err.message === 'Type de fichier refusé' ? 'Logo : PNG ou JPG seulement' : err.message) || 'Envoi impossible')
    } finally {
      setLogoBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const retirerLogo = async () => {
    setLogoBusy(true); setError(''); setSucces('')
    try {
      await api.delete('/api/rizerie/logo')
      oublierEntreprise()
      await charger()
    } catch (err) {
      setError(err.response?.data?.error || 'Suppression impossible')
    } finally { setLogoBusy(false) }
  }

  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <span className="w-7 h-7 border-4 border-[#62bb46] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1b75bc]">Rizerie</p>
        <h2 className="font-display text-2xl font-semibold text-gray-900">Paramètres</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Identité de la rizerie. Elle s'affiche sur le reçu, la facture, le bon de commande et le contrat.
        </p>
      </div>

      {!peutModifier && data && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-4 py-3">
          Consultation seule. Le rizier ou le directeur modifie ces informations.
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
      {succes && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{succes}</div>}

      <div className="card p-0">
        <div className="flex gap-6 px-5 border-b border-gray-200 overflow-x-auto">
          {ONGLETS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setOnglet(o.key)}
              className={`py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
                onglet === o.key ? 'border-[#1b75bc] text-[#1b75bc]' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <form onSubmit={enregistrer} className="p-5 space-y-5">
          {onglet !== 'documents' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CHAMPS[onglet].map((c) => (
                <div key={c.key} className={c.key === 'adresse' ? 'sm:col-span-2' : ''}>
                  <label className="label" htmlFor={`p-${c.key}`}>{c.label}</label>
                  <input
                    id={`p-${c.key}`}
                    className="input disabled:bg-gray-50 disabled:text-gray-600"
                    type={c.type || 'text'}
                    maxLength={c.max}
                    placeholder={c.placeholder}
                    value={form[c.key] || ''}
                    onChange={set(c.key)}
                    disabled={!peutModifier}
                    required={c.key === 'nom'}
                  />
                </div>
              ))}
            </div>
          )}

          {onglet === 'documents' && (
            <div className="space-y-6">
              <div>
                <p className="label">Logo</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-24 h-24 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {logo ? <img src={logo} alt="Logo de la rizerie" className="max-w-full max-h-full object-contain" /> : <span className="text-xs text-gray-400">Aucun logo</span>}
                  </div>
                  {peutModifier && (
                    <div className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <button type="button" className="btn-secondary text-sm" disabled={logoBusy} onClick={() => fileRef.current?.click()}>
                          {logoBusy ? 'Envoi…' : logo ? 'Changer le logo' : 'Télécharger un logo'}
                        </button>
                        {logo && (
                          <button type="button" className="text-sm text-red-600 hover:text-red-700 px-2" disabled={logoBusy} onClick={retirerLogo}>
                            Retirer
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">PNG ou JPG, 3 Mo maximum. Un fond transparent rend mieux.</p>
                      <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={envoyerLogo} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="label" htmlFor="p-mentions">Mentions en bas des documents</label>
                <textarea
                  id="p-mentions"
                  className="input disabled:bg-gray-50"
                  rows={3}
                  maxLength={500}
                  placeholder="Ex : Capital de 1 000 000 F CFA. Banque : … Merci de votre confiance."
                  value={form.mentions_documents || ''}
                  onChange={set('mentions_documents')}
                  disabled={!peutModifier}
                />
              </div>

              <div>
                <p className="label">Aperçu de l'en-tête</p>
                <div className="border border-gray-200 rounded-lg p-5 flex flex-col items-center text-center gap-2">
                  {logo && <img src={logo} alt="" className="max-h-16 max-w-[160px] object-contain" />}
                  <div>
                    <p className="font-bold text-[#1b75bc] text-lg leading-tight">{form.nom || 'Nom de la rizerie'}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {[form.forme_juridique, form.adresse, [form.ville, form.pays].filter(Boolean).join(', '),
                        form.telephone && `Tél : ${form.telephone}`, form.email,
                        [form.ninea && `NINEA : ${form.ninea}`, form.rccm && `RCCM : ${form.rccm}`].filter(Boolean).join(' · ')]
                        .filter(Boolean).map((l) => <span key={l} className="block">{l}</span>)}
                    </p>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-800 mt-1">Facture · N° V-2026-0001</p>
                </div>
              </div>
            </div>
          )}

          {peutModifier && (
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
