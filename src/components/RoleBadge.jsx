const CONFIG = {
  rizier:     { label: 'Rizier',     cls: 'bg-green-100 text-green-800 border border-green-300' },
  directeur:  { label: 'Directeur',  cls: 'bg-purple-100 text-purple-800 border border-purple-300' },
  manager:    { label: 'Manager',    cls: 'bg-blue-100 text-blue-800 border border-blue-300' },
  vendeur:    { label: 'Commercial', cls: 'bg-gray-100 text-gray-700 border border-gray-300' },
  superadmin: { label: 'Super-admin','cls': 'bg-red-100 text-red-800 border border-red-300' },
  support:    { label: 'Support',    cls: 'bg-orange-100 text-orange-800 border border-orange-300' },
  comptable:  { label: 'Comptable',  cls: 'bg-teal-100 text-teal-800 border border-teal-300' },
}

export default function RoleBadge({ role }) {
  const { label, cls } = CONFIG[role] || { label: role, cls: 'bg-gray-100 text-gray-600 border border-gray-200' }
  return (
    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}
