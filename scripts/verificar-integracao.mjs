import fs from "node:fs";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const env = fs.readFileSync(".env.local", "utf8");
const get = (key) =>
  env
    .match(new RegExp("^" + key + "=(.*)$", "m"))?.[1]
    .trim()
    .replace(/^['"]|['"]$/g, "");
const url = get("VITE_SUPABASE_URL"),
  key = get("VITE_SUPABASE_ANON_KEY");
if (!url || !key)
  throw Error("Configure somente a URL e a chave pública em .env.local.");
const client = createClient(url, key, { auth: { persistSession: false } });
const categories = await client.rpc("marketplace_categories");
assert.equal(categories.error, null);
assert.equal(categories.data.length, 12);
const search = await client.rpc("marketplace_search", {
  p_query: "",
  p_city: "",
  p_category: "",
});
assert.equal(search.error, null);
assert.ok(Array.isArray(search.data));
const denied = await client.rpc("marketplace_admin_data");
assert.ok(denied.error, "Admin aceitou anônimo");
const privateRows = await client.from("marketplace_verifications").select("*");
assert.ok(privateRows.error, "Anônimo leu documentos");
for (const host of ["app.renatopescados.com.br", "asvluth.norieco.com.br"]) {
  const catalog = createClient(url, key, {
    global: { headers: { "x-catalog-domain": host } },
    auth: { persistSession: false },
  });
  const result = await catalog.rpc("public_catalog_products");
  assert.equal(result.error, null);
  assert.ok(Array.isArray(result.data));
  console.log(
    `${host}: catálogo responde (${result.data.length} produtos disponíveis).`,
  );
}
const oauth = await fetch(`${url}/auth/v1/settings`, {
  headers: { apikey: key },
}).then((r) => r.json());
assert.equal(oauth.external.google, true);
console.log(
  `Integração real OK: ${categories.data.length} categorias; ${search.data.length} empresas publicadas; Google ativo; administração e documentos bloqueados para anônimos. Nenhum pedido foi criado.`,
);
