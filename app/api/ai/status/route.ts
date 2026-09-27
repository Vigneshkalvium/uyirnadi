import {authorize,apiError} from '@/lib/auth/server';
export async function GET(){try{await authorize();return Response.json({available:Boolean(process.env.GEMINI_API_KEY)});}catch(error){return apiError(error);}}
