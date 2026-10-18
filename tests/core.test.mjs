import test from "node:test";
import assert from "node:assert/strict";
import {
  safeReturn,
  safeImage,
  contactLink,
  subtotal,
  readCart,
  distanceLabel,
} from "../src/lib/core.mjs";
test("redirecionamento interno sem open redirect", () => {
  for (const value of [
    "//evil.test",
    "https://evil.test",
    "/\\evil.test",
    "/auth/callback",
    null,
  ])
    assert.equal(safeReturn(value), "/");
  assert.equal(safeReturn("/finalizar"), "/finalizar");
});
test("URLs e WhatsApp seguros", () => {
  assert.equal(safeImage("javascript:alert(1)"), "");
  assert.equal(safeImage("http://unsafe.test"), "");
  assert.equal(contactLink(""), "");
  assert.match(
    contactLink("5547992739983", "Olá"),
    /^https:\/\/wa.me\/5547992739983/,
  );
  assert.equal(distanceLabel(null), "");
});
test("preço por prato e por kg, ofertas e preparo", () => {
  const item = {
    quantity: 2,
    option_id: "limpo",
    product: { price: 15, sale_mode: "UNIT", options: [], price_tiers: [] },
  };
  assert.equal(subtotal(item), 30);
  item.product.sale_mode = "KG";
  item.product.average_weight = 1.5;
  assert.equal(subtotal(item), 45);
  item.product.options = [{ id: "limpo", fee_per_kg: 2 }];
  assert.equal(subtotal(item), 51);
  item.product.price_tiers = [{ quantity: 2, total_price: 40 }];
  assert.equal(subtotal(item), 46);
});
test("carrinho inválido é descartado", () => {
  for (const data of ["{", '{"tenant_id":"other"}', '[{"quantity":-1}]'])
    assert.deepEqual(readCart({ getItem: () => data }, "key"), []);
});
