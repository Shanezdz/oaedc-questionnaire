import { getDb } from '../../../db';
import { responses } from '../../../db/schema';
import fields from './fields.json';
export async function POST(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return Response.json({error:'Origin refusée'},{status:403});
  try {
    const raw = await request.text();
    if (raw.length > 200000) return Response.json({error:'Réponse trop longue'},{status:413});
    const payload = JSON.parse(raw);
    if (!/^[0-9a-f-]{36}$/.test(payload.id || '') || !payload.answers || typeof payload.answers !== 'object' || Array.isArray(payload.answers)) return Response.json({error:'Format invalide'},{status:400});
    const clean:Record<string,string|string[]>={};
    for(const [name,spec] of Object.entries(fields) as [string,{type:string;required:boolean;values?:string[];max?:number}][]) {
      const value = payload.answers[name];
      if(spec.required && (value===undefined || value==='' || (Array.isArray(value)&&!value.length))) return Response.json({error:'Champ obligatoire',field:name},{status:400});
      if(value===undefined) continue;
      if(spec.type==='checkbox') {
        const values=Array.isArray(value)?value:[value];
        if(values.length>(spec.max??99) || new Set(values).size!==values.length || values.some(v=>typeof v!=='string'||!spec.values?.includes(v))) return Response.json({error:'Choix invalide',field:name},{status:400});
        clean[name]=values;
      } else {
        if(typeof value!=='string'||value.length>10000||(spec.required&&!value.trim())||(spec.values&&!spec.values.includes(value))) return Response.json({error:'Réponse invalide',field:name},{status:400});
        clean[name]=value.trim();
      }
    }
    await getDb().insert(responses).values({id:payload.id,createdAt:new Date().toISOString(),answers:JSON.stringify(clean)}).onConflictDoNothing();
    return Response.json({saved:true},{status:201});
  } catch { return Response.json({error:'Enregistrement impossible. Veuillez réessayer.'},{status:500}); }
}
