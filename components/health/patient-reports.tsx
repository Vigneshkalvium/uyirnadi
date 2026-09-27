'use client';
import {useState} from 'react';
import {useRecords} from '@/hooks/use-records';
import {api} from '@/lib/firestore/client';
import {Card,PageHeader,Button,EmptyState,ErrorState,Modal,Badge} from '@/components/ui';
import {AIResponse} from '@/components/health/ai-response';
import type {RecordData,AIResult} from '@/types';

export function PatientReports(){
  const appointments=useRecords('appointments');
  const patients=Array.from(new Map(appointments.records.filter(a=>['confirmed','completed'].includes(String(a.status))).map(a=>[String(a.userId),a])).values());
  const [reports,setReports]=useState<RecordData[]>([]);
  const [patient,setPatient]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [view,setView]=useState<RecordData|null>(null);
  async function load(uid:string){setPatient(uid);setReports([]);setError('');if(!uid)return;setBusy(true);try{const data=await api<{records:RecordData[]}>(`/api/patients?userId=${uid}`);setReports(data.records);}catch(e){setError(e instanceof Error?e.message:'Could not load reports.');}finally{setBusy(false);}}
  return <><PageHeader eyebrow="DOCTOR WORKSPACE" title="Patient reports" description="Only reports explicitly shared with you by patients with a confirmed care relationship are visible."/><select aria-label="Choose patient" className="input mb-6 max-w-md" value={patient} onChange={e=>load(e.target.value)}><option value="">Choose a patient</option>{patients.map(p=><option key={String(p.userId)} value={String(p.userId)}>{String(p.patientName)}</option>)}</select>{error&&<ErrorState message={error} retry={()=>load(patient)}/>}<Card>{busy?<p role="status" className="p-8">Loading shared reports...</p>:reports.length?reports.map(r=><div key={r.id} className="flex items-center justify-between border-b border-border p-5"><div><h2>{String(r.name)}</h2>{Boolean(r.demo)&&<Badge tone="gray">Sample record</Badge>}</div><Button variant="outline" onClick={()=>setView(r)}>Review summary</Button></div>):<EmptyState title={patient?'No shared reports':'Choose a patient'} description="Patients control report sharing from their document library."/>}</Card><Modal open={!!view} onOpenChange={()=>setView(null)} title={String(view?.name||'Shared report')}>{view?.analysis?<AIResponse result={view.analysis as AIResult}/>:<p className="text-sm text-muted-foreground">No summary is available for this report.</p>}</Modal></>;
}
