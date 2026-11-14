import { useEffect, useState } from 'react'
import Modal from './Modal'
import { registerConfirmHost } from '../utils/askConfirm'

export default function ConfirmHost() {
  const [req, setReq] = useState(null)

  useEffect(() => registerConfirmHost(setReq), [])

  const close = (answer) => {
    if (req) req.resolve(answer)
    setReq(null)
  }

  return (
    <Modal open={!!req} onClose={() => close(false)} title={req?.title || 'Confirmation'} width="max-w-md">
      <p className="text-sm text-gray-700 whitespace-pre-line">{req?.message}</p>
      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={() => close(false)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => close(true)}
          className="px-4 py-2 text-sm rounded-lg bg-[#CC0000] text-white hover:bg-[#a80000]"
        >
          {req?.confirmLabel || 'Confirmer'}
        </button>
      </div>
    </Modal>
  )
}
