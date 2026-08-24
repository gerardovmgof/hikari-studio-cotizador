import { getSupabase } from './_supabase.js';

function rowToQuote(row) {
  return {
    folio: row.folio,
    cliente: row.cliente,
    servicios: row.servicios,
    descuentoPct: row.descuento_pct,
    total: Number(row.total),
    fecha: row.fecha,
    items: row.items || [],
    subtotal: Number(row.subtotal),
    descuentoMonto: Number(row.descuento_monto),
    ivaOn: row.iva_on,
    ivaMonto: Number(row.iva_monto),
    createdAt: row.created_at,
  };
}

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { from, to } = req.query;
    let query = supabase.from('quotes').select('*').order('folio', { ascending: false });
    if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`);
    if (to) query = query.lte('created_at', `${to}T23:59:59.999Z`);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const { data: maxRow } = await supabase
      .from('quotes')
      .select('folio')
      .order('folio', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextFolio = maxRow ? maxRow.folio + 1 : 1;

    return res.status(200).json({ quotes: data.map(rowToQuote), nextFolio });
  }

  if (req.method === 'POST') {
    const q = req.body;
    if (!q || !q.folio || !Number.isInteger(q.folio) || q.folio < 1) {
      return res.status(400).json({ error: 'Folio inválido.' });
    }

    const { error } = await supabase.from('quotes').insert({
      folio: q.folio,
      cliente: q.cliente || 'Sin nombre',
      servicios: q.servicios || 'Sin servicio',
      items: q.items || [],
      subtotal: q.subtotal || 0,
      descuento_pct: q.descuentoPct || 0,
      descuento_monto: q.descuentoMonto || 0,
      iva_on: !!q.ivaOn,
      iva_monto: q.ivaMonto || 0,
      total: q.total || 0,
      fecha: q.fecha || '',
    });

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ese folio ya existe en el registro.' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('quotes').delete().gte('folio', 0);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Método no permitido.' });
}
