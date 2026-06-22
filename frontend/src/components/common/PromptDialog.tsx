import { useEffect, useState } from 'react'
import { Modal, useModalTitleId } from './Modal'
import { useLanguage } from '../../i18n/LanguageProvider'

export function PromptDialog(props: { open:boolean; title:string; message:string; placeholder?:string; initialValue?:string; confirmLabel?:string; cancelLabel?:string; onSubmit:(value:string)=>void; onCancel:()=>void }) {
  const { t } = useLanguage(); const titleId=useModalTitleId('prompt-dialog'); const [value,setValue]=useState('')
  useEffect(()=>{ if(props.open) setValue(props.initialValue??'') },[props.open,props.initialValue])
  return <Modal open={props.open} onClose={props.onCancel} titleId={titleId}>
    <div className="card overflow-hidden shadow-xl"><div className="card-body space-y-4 p-5 sm:p-6">
      <div><h2 id={titleId} className="text-lg font-semibold text-slate-900">{props.title}</h2><p className="mt-2 text-sm text-slate-600">{props.message}</p></div>
      <textarea autoFocus className="input min-h-24 py-2" value={value} placeholder={props.placeholder} onChange={e=>setValue(e.target.value)} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="btn btn-secondary h-11" onClick={props.onCancel}>{props.cancelLabel??t.common.cancel}</button><button className="btn btn-primary h-11" onClick={()=>props.onSubmit(value)}>{props.confirmLabel??t.common.confirm}</button></div>
    </div></div></Modal>
}
