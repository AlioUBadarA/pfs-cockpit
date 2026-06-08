export default function StatutBadge({ statut }) {
  const styles = {
    'Payé':      'bg-green-100 text-green-800 border border-green-300',
    'En cours':  'bg-orange-100 text-orange-800 border border-orange-300',
    'En retard': 'bg-red-100 text-red-800 border border-red-300',
    'Actif':     'bg-green-100 text-green-800 border border-green-300',
    'Prospect':  'bg-blue-100 text-blue-800 border border-blue-300',
    'Dormant':   'bg-red-100 text-red-800 border border-red-300',
  }

  const cls = styles[statut] || 'bg-gray-100 text-gray-700 border border-gray-300'

  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {statut}
    </span>
  )
}
