import {loadEnvConfig} from '@next/env';
import {cert,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';

async function main(){
  loadEnvConfig(process.cwd());
  const app=initializeApp({credential:cert({projectId:process.env.FIREBASE_ADMIN_PROJECT_ID,clientEmail:process.env.FIREBASE_ADMIN_CLIENT_EMAIL,privateKey:process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g,'\n')}),storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET});
  const db=getFirestore(app);
  const accounts=await getAuth(app).listUsers(100);
  console.log('Firebase Auth:',accounts.users.length,'accounts');
  const patient=accounts.users.find(u=>u.customClaims?.role==='user');
  const checks=[['doctors',()=>db.collection('doctors').where('active','==',true).limit(1).get()],['healthTips',()=>db.collection('healthTips').where('published','==',true).limit(1).get()],['appointments',()=>db.collection('appointments').where('userId','==',patient?.uid||'none').limit(1).get()],['storage',()=>getStorage(app).bucket().getMetadata()]] as const;
  for(const [name,run] of checks){try{await run();console.log(name+': OK');}catch(e){console.log(name+': '+(e instanceof Error?e.message:'failed'));}}
  console.log('Gemini configured:',Boolean(process.env.GEMINI_API_KEY));
}
main().catch(()=>{console.error('Service verification failed. Check server configuration.');process.exitCode=1;});
