import { hardwareProduct } from '../../src/lib/hardware.mjs';

const json = (data, status = 200) => Response.json(data, {status, headers: {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}});
export function shippingSettings(env) {
  let packages = [], fees = [];
  try { packages = JSON.parse(env.HARDWARE_PACKAGES_JSON || '[]'); } catch { /* Incomplete merchant setup uses quotation by the team. */ }
  try { fees = JSON.parse(env.HARDWARE_FEES_JSON || '[]'); } catch { fees = null; }
  const validFees = Array.isArray(fees) && fees.length <= 10 && fees.every(f => typeof f.label === 'string' && f.label.trim() && f.label.length <= 80 && Number.isSafeInteger(f.amountCents) && f.amountCents >= 0 && f.amountCents <= 1000000);
  const validPackages = Array.isArray(packages) && packages.length > 0 && packages.length <= 10 && packages.every(p => ['width','height','length','weight','insurance'].every(k => typeof p[k] === 'number' && Number.isFinite(p[k]) && p[k] > 0)) && Math.round(packages.reduce((sum,p) => sum + p.insurance, 0) * 100) === hardwareProduct.priceCents;
  return {
    fees: validFees ? fees.map(f => ({label: f.label.trim(), amountCents: f.amountCents})) : [],
    feesConfirmed: validFees && env.HARDWARE_FEES_CONFIRMED === 'true',
    ready: env.HARDWARE_SHIPPING_ENABLED === 'true' && (env.MELHOR_ENVIO_SANDBOX !== 'true' || ['deploy-preview','branch-deploy'].includes(env.CONTEXT)) && /^\d{8}$/.test(env.HARDWARE_ORIGIN_POSTAL_CODE || '') && !!env.MELHOR_ENVIO_TOKEN && !!env.MELHOR_ENVIO_CONTACT && validPackages,
    packages,
  };
}

export function createShippingHandler({env = process.env, fetcher = fetch} = {}) {
  return async request => {
    if (request.method !== 'POST') return json({error: 'Método não permitido.'}, 405);
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return json({error: 'Origem não permitida.'}, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error: 'Envie os dados em JSON.'}, 415);
    try {
      if (Number(request.headers.get('content-length') || 0) > 1024) return json({error: 'Requisição muito grande.'}, 413);
      const text = await request.text();
      if (new TextEncoder().encode(text).length > 1024) return json({error: 'Requisição muito grande.'}, 413);
      let body; try { body = JSON.parse(text); } catch { return json({error: 'Dados inválidos.'}, 400); }
      const cep = body?.cep;
      if (typeof cep !== 'string' || !/^\d{8}$/.test(cep)) return json({error: 'Informe um CEP com 8 dígitos.'}, 400);
      const lookup = await fetcher(`https://viacep.com.br/ws/${cep}/json/`, {signal: AbortSignal.timeout(6000)});
      if (!lookup.ok) return json({error: 'Não foi possível consultar o CEP. Tente novamente.'}, 502);
      const address = await lookup.json();
      if (address.erro || !/^[A-Z]{2}$/.test(address.uf || '') || !address.localidade) return json({error: 'CEP não encontrado. Confira o número informado.'}, 422);
      const settings = shippingSettings(env);
      const result = {cep, address: {street: address.logradouro || '', district: address.bairro || '', city: address.localidade, state: address.uf}, origin: 'São Paulo / SP', fees: settings.fees, feesConfirmed: settings.feesConfirmed, options: [], mode: 'manual', expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()};
      if (!settings.ready) return json({...result, message: 'A equipe confirma o frete e o prazo para este CEP antes do pagamento.'});
      try {
        const host = env.MELHOR_ENVIO_SANDBOX === 'true' ? 'https://sandbox.melhorenvio.com.br' : 'https://www.melhorenvio.com.br';
        const response = await fetcher(host + '/api/v2/me/shipment/calculate', {
          method: 'POST', signal: AbortSignal.timeout(8000),
          headers: {Authorization: 'Bearer ' + env.MELHOR_ENVIO_TOKEN, Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': `NoriEco (${env.MELHOR_ENVIO_CONTACT})`},
          body: JSON.stringify({from: {postal_code: env.HARDWARE_ORIGIN_POSTAL_CODE}, to: {postal_code: cep}, volumes: settings.packages.map(p => ({width:p.width,height:p.height,length:p.length,weight:p.weight,insurance:p.insurance})), options: {receipt:false,own_hand:false}}),
        });
        if (!response.ok) throw Error('Shipping provider unavailable');
        const data = await response.json();
        const options = (Array.isArray(data) ? data : []).filter(row => !row.error && row.id && row.name && Number.isFinite(Number(row.custom_price ?? row.price)) && Number(row.custom_price ?? row.price) > 0).map(row => ({
          id: String(row.id), name: String(row.name).slice(0,80), company: String(row.company?.name || 'Transportadora').slice(0,80), amountCents: Math.round(Number(row.custom_price ?? row.price) * 100),
          days: Number.isFinite(Number(row.custom_delivery_time ?? row.delivery_time)) && Number(row.custom_delivery_time ?? row.delivery_time) > 0 ? Math.ceil(Number(row.custom_delivery_time ?? row.delivery_time)) : null,
        })).sort((a,b) => a.amountCents - b.amountCents);
        return json({...result, options, mode: options.length ? 'quoted' : 'manual', message: options.length ? (env.MELHOR_ENVIO_SANDBOX === 'true' ? 'Simulação de teste. Estes valores não são uma oferta de frete real.' : 'Prazo estimado após a postagem. A equipe confirma a data de envio.') : 'Consulte a equipe sobre a entrega para este CEP.'});
      } catch { return json({...result, message: 'A cotação automática está indisponível. A equipe confirma o frete antes do pagamento.'}); }
    } catch { return json({error: 'Não foi possível consultar a entrega agora. Tente novamente ou fale com a equipe.'}, 502); }
  };
}
