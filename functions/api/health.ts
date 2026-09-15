// Cloudflare Pages Function: /api/health
export async function onRequestGet(context: any) {
  const { env } = context;
  return new Response(
    JSON.stringify({
      status: 'ok',
      platform: 'cloudflare-pages',
      hasGeminiKey: !!env.GEMINI_API_KEY,
      timestamp: Date.now(),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
