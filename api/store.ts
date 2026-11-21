import { handleGateway } from "../server/storeGateway";
export const maxDuration = 30;
export function POST(request: Request) {
  return handleGateway(request, {
    url: process.env.VITE_CATALOG_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    publicKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function GET() {
 const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(process.env.VITE_CATALOG_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '') && (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').startsWith('sb_publishable_');
 return Response.json({ready:configured,method:'POST'},{status:configured?405:503,headers:{'Cache-Control':'no-store'}});
}
