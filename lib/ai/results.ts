import {aiResultSchema} from '@/lib/validation';
import type {AIKind} from '@/types';

/** Validate provider output before any result reaches a patient or storage. */
export function parseHealthResult(kind:AIKind,raw:string){
  const value=aiResultSchema.parse(JSON.parse(raw));
  if(kind==='prescription'&&!value.medicines) throw new Error('Prescription extraction did not include medicine fields.');
  if(kind==='report'&&value.values) value.values=value.values.map(item=>({...item,range:item.range.trim()||'Reference range not provided in the uploaded report.',flag:item.range.trim()?item.flag:'Not determined'}));
  return value;
}
