import {loadEnvConfig} from '@next/env';
import {cert} from 'firebase-admin/app';
import {readFile} from 'node:fs/promises';
async function main(){
  loadEnvConfig(process.cwd());
  const credential=cert({projectId:process.env.FIREBASE_ADMIN_PROJECT_ID,clientEmail:process.env.FIREBASE_ADMIN_CLIENT_EMAIL,privateKey:process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g,'\n')});
  const {access_token}=await credential.getAccessToken();
  const config=JSON.parse(await readFile('firestore.indexes.json','utf8')) as {indexes:{collectionGroup:string;queryScope:string;fields:unknown[]}[]};
  for(const {collectionGroup,...definition} of config.indexes){
    const response=await fetch(`https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_ADMIN_PROJECT_ID}/databases/(default)/collectionGroups/${collectionGroup}/indexes`,{method:'POST',headers:{Authorization:`Bearer ${access_token}`,'Content-Type':'application/json'},body:JSON.stringify(definition)});
    const data=await response.json();
    console.log(collectionGroup, response.ok?'Index creation requested':response.status===409?'Index already exists':data.error?.message||response.status);
    if(!response.ok&&response.status!==409)process.exitCode=1;
  }
}
main().catch(()=>{console.error('Index deployment failed. No credential details are logged.');process.exitCode=1;});
