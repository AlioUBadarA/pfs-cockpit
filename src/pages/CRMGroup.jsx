import { useState } from 'react'
import PageTabs from '../components/PageTabs'
import Clients from './Clients'
import Prospection from './Prospection'
import ContratsClients from './ContratsClients'
import ContratsPaddy from './ContratsPaddy'

const TABS = [
  { key: 'prospection',      label: 'Prospection' },
  { key: 'clients',          label: 'Clients' },
  { key: 'contrats-clients', label: 'Contrats clients' },
  { key: 'contrats-paddy',   label: 'Contrats paddy' },
]

export default function CRMGroup() {
  const [active, setActive] = useState('prospection')
  return (
    <div>
      <PageTabs tabs={TABS} active={active} setActive={setActive} />
      {active === 'clients'          && <Clients />}
      {active === 'prospection'      && <Prospection />}
      {active === 'contrats-clients' && <ContratsClients />}
      {active === 'contrats-paddy'   && <ContratsPaddy />}
    </div>
  )
}
