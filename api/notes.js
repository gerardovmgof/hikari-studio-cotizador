import { getSupabase } from './_supabase.js';

const KEY = 'notas_importantes';
const DEFAULT_NOTES = [
  'Precios en MXN. Pueden variar según ubicación y complejidad del proyecto.',
  'Se requiere anticipo del 50% para apartar la fecha.',
  'El saldo se liquida al entregar el material final.',
  'Precios base no incluyen IVA (16%), salvo que se active la opción correspondiente.',
  'Esta cotización es válida por 30 días a partir de su emisión.',
];

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('settings').select('value').eq('key', KEY).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ notes: data && Array.isArray(data.value) ? data.value : DEFAULT_NOTES });
  }

  if (req.method === 'POST') {
    const notes = req.body && Array.isArray(req.body.notes) ? req.body.notes.filter(n => typeof n === 'string' && n.trim()) : null;
    if (!notes) return res.status(400).json({ error: 'Formato inválido.' });

    const { error } = await supabase.from('settings').upsert({ key: KEY, value: notes, updated_at: new Date().toISOString() });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método no permitido.' });
}
