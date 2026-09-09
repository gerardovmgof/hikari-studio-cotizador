import { getSupabase } from './_supabase.js';

export default async function handler(req, res) {
  const supabase = getSupabase();
  const { error } = await supabase.from('quotes').select('folio').limit(1);
  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true, checkedAt: new Date().toISOString() });
}
