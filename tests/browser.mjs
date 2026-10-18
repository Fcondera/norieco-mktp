import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:5174";
const base = origin + "/marketplace";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const categories = [
  "Restaurantes",
  "Lanches",
  "Bares",
  "Roupas",
  "Mercados",
  "Farmácias",
  "Balneários",
  "Diversão",
  "Pôr do sol",
  "Passeios",
  "Beleza",
  "Serviços",
].map((name, i) => ({
  id: String(i + 1),
  name,
  icon: i < 3 ? "food" : "shop",
  active: true,
  sort_order: i,
}));
const business = {
  id: "20000000-0000-4000-8000-000000000001",
  slug: "restaurante-teste",
  name: "Restaurante de teste",
  category_id: "1",
  category_name: "Restaurantes",
  listing_type: "INTEGRATED",
  verification_status: "VERIFIED",
  description: "Perfil fictício usado somente nos testes automatizados.",
  logo_url: "",
  cover_url: "",
  city: "Manaus",
  state: "AM",
  neighborhood: "Centro",
  address: "Rua de teste, 10",
  whatsapp: "5592999990000",
  is_open: true,
  rating: 4.8,
  review_count: 12,
  featured: true,
  delivery_fee: 5,
  accepts_delivery: true,
  opening_hours: [],
  services: [],
  reviews: [],
};
const standard = {
  ...business,
  id: "20000000-0000-4000-8000-000000000002",
  slug: "servico-teste",
  name: "Serviço de teste",
  listing_type: "STANDARD",
  category_id: "12",
  category_name: "Serviços",
};
const product = {
  id: "30000000-0000-4000-8000-000000000001",
  name: "Prato de teste",
  category: "Comida",
  image_url: "",
  description: "Prato exclusivo do ambiente de teste.",
  price: 25,
  sale_mode: "UNIT",
  average_weight: 1,
  available: 10,
  min_quantity: 1,
  featured: true,
  options: [],
  price_tiers: [],
};
const user = {
  id: "10000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "teste@example.test",
  app_metadata: { provider: "google" },
  user_metadata: { full_name: "Cliente Teste" },
  created_at: new Date().toISOString(),
};
const profile = {
  user_id: user.id,
  full_name: "Cliente Teste",
  whatsapp: "92999990000",
  city: "Manaus",
  state: "AM",
  neighborhood: "Centro",
  completed_at: new Date().toISOString(),
  notification_preferences: { orders: true, news: false },
  is_admin: false,
};
let orders = [],
  searches = [],
  checkout = null;
let logoutScope = null;
async function mock(
  page,
  { logged = false, onboarding = false, fail = false, empty = false } = {},
) {
  let localProfile = onboarding ? null : profile;
  let businesses = [];
  await page.route("**/storage/v1/object/**", (route) =>
    route.fulfill({ json: { Key: "arquivo-de-teste", Id: "test-file" } }),
  );
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("**/auth/v1/**", async (route) => {
    if (route.request().url().includes("/logout"))
      logoutScope = new URL(route.request().url()).searchParams.get("scope");
    if (route.request().url().includes("/user"))
      await route.fulfill({ json: user });
    else await route.fulfill({ json: {} });
  });
  await page.route("**/rest/v1/rpc/**", async (route) => {
    const name = route.request().url().split("/").at(-1),
      args = route.request().postDataJSON() || {};
    let data = null;
    if (fail && name === "marketplace_search")
      return route.fulfill({
        status: 503,
        json: { message: "Serviço indisponível. Tente novamente." },
      });
    switch (name) {
      case "marketplace_categories":
        data = categories;
        break;
      case "marketplace_search":
        searches.push(args);
        data = (empty ? [] : [business, standard]).filter(
          (b) =>
            (!args.p_city ||
              b.city.toLowerCase() === args.p_city.toLowerCase()) &&
            (!args.p_category || args.p_category === b.category_id) &&
            (!args.p_query ||
              b.name.toLowerCase().includes(args.p_query.toLowerCase())),
        );
        break;
      case "marketplace_business":
        data = {
          business: args.p_slug === standard.slug ? standard : business,
          products: args.p_slug === standard.slug ? [] : [product],
        };
        break;
      case "marketplace_my_profile":
        data = localProfile;
        break;
      case "marketplace_save_profile":
        localProfile = { ...profile, ...args.p_data };
        break;
      case "marketplace_addresses":
        data = [];
        break;
      case "marketplace_my_orders":
        data = orders;
        break;
      case "marketplace_my_businesses":
        data = businesses;
        break;
      case "marketplace_save_business":
        data = { id: "20000000-0000-4000-8000-000000000010" };
        businesses = [
          {
            ...args.p_data,
            id: data.id,
            slug: "empresa-teste",
            verification_status: args.p_submit ? "PENDING" : "DRAFT",
            leads_count: 0,
            services: [],
            integration_status: "NONE",
          },
        ];
        break;
      case "marketplace_my_reviews":
        data = [];
        break;
      case "marketplace_checkout":
        checkout = args;
        data = { id: "order-test" };
        orders = [
          {
            id: "order-test",
            business_slug: business.slug,
            business_name: business.name,
            number: "NE-TESTE",
            status: "PENDING_REVIEW",
            total: 25,
            created_at: new Date().toISOString(),
            receiving_type: "Retirada no local",
            items: [{ product_name: product.name, quantity: 1, subtotal: 25 }],
          },
        ];
        break;
    }
    await route.fulfill({ json: data });
  });
  if (logged)
    await page.addInitScript(
      ({ user }) => {
        const payload = btoa(
          JSON.stringify({
            sub: user.id,
            role: "authenticated",
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        );
        localStorage.setItem(
          "norieco-marketplace-auth-v1",
          JSON.stringify({
            access_token: `header.${payload}.signature`,
            refresh_token: "test-refresh",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            expires_in: 3600,
            token_type: "bearer",
            user,
          }),
        );
      },
      { user },
    );
}
async function noOverflow(page, label) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    `Overflow horizontal: ${label}`,
  );
}
try {
  await fs.mkdir("test-results", { recursive: true });
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({
        viewport: { width, height: 950 },
      }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await mock(page);
    await page.goto(origin);
    await page.locator(".eco-hero h1").waitFor();
    await noOverflow(page, `institucional ${width}`);
    await page.screenshot({path: `test-results/landing-${width}.png`, fullPage:true});
    assert.equal(await page.locator('.eco-header a[href="https://gestao.norieco.com.br/"]').count(), 1);
    for (const name of ["Nori Gestão", "Controle de ponto", "NoriEco Sites"])
      await page.getByRole("heading", { name, exact: true }).waitFor();
    assert.equal(await page.locator('.eco-solutions a[href^="https://wa.me/"]').count(), 3);
    await page.locator(".eco-header").getByRole("link", {name: "Marketplace", exact: true}).click();
    assert.equal(new URL(page.url()).pathname, "/marketplace");
    await page.getByRole("heading", { name: /Tudo o que/ }).waitFor();
    await page
      .getByRole("link", { name: /Restaurante de teste/ })
      .first()
      .waitFor();
    await noOverflow(page, `home ${width}`);
    await page.getByRole("heading", {name:"Em destaque",exact:true}).waitFor();
    await page.getByRole("heading", {name:"Top 3 vendedores",exact:true}).waitFor();
    await page.getByRole("heading", {name:"Melhores lojas",exact:true}).waitFor();
    assert.equal(await page.locator('.mkt-rank-card').count(),2);
    for (const name of ["Acesso rápido", "Minha conta", "Suporte", "Informações legais"])
      assert.equal(await page.locator('.marketplace-footer').getByRole('navigation',{name,exact:true}).count(),1);
    const accountIcon = page.locator(".header").getByRole("link", {name: "Entrar na minha conta", exact: true});
    assert.equal(await accountIcon.isVisible(), true, "Ícone da conta oculto no celular");
    const accountBox = await accountIcon.boundingBox();
    const cartBox = await page.locator(".header .cart-top").boundingBox();
    assert.ok(accountBox && cartBox && Math.abs(accountBox.y - cartBox.y) < 8, "Carrinho quebrou a linha do cabeçalho");
    assert.equal((await accountIcon.innerText()).trim(), "", "Cabeçalho exibiu texto de login");
    assert.equal(await page.locator(".header").getByText("Cadastrar empresa", {exact:true}).count(), 0);
    await accountIcon.click();
    await page.getByRole("button", {name: "Continuar com Google"}).waitFor();
    assert.equal(new URL(page.url()).pathname, "/marketplace/entrar");
    await page.goto(base);
    await page.getByRole("heading", {name:"Top 3 vendedores",exact:true}).waitFor();
    await noOverflow(page, `rankings ${width}`);
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
    await page.locator('.marketplace-footer').getByRole('link',{name:'Central de ajuda',exact:true}).click();
    await page.getByRole('heading',{name:'Compre perto. Entenda cada etapa.'}).waitFor();
    await noOverflow(page, `ajuda ${width}`);
    await page.goto(base);
    for (const route of ["/conta", "/conta/pedidos"]) {
      await page.goto(base + route);
      await page
        .getByRole("heading", { name: "O marketplace é aberto para você." })
        .waitFor();
      assert.equal(
        new URL(page.url()).pathname,
        "/marketplace" + route,
        "Navegação pública forçou login",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Continuar com Google" })
          .count(),
        0,
      );
      await noOverflow(page, `visitante ${route} ${width}`);
    }
    await page.goto(base);
    await page
      .getByPlaceholder("Buscar lojas, produtos ou serviços")
      .fill("Serviço");
    await page
      .getByRole("heading", { name: "Resultados para “Serviço”" })
      .waitFor();
    await page
      .getByRole("link", { name: /Serviço de teste/ })
      .first()
      .waitFor();
    await page.getByPlaceholder("Buscar lojas, produtos ou serviços").fill("");
    await page.getByRole("button", { name: "Serviços", exact: true }).click();
    await page
      .getByRole("heading", { name: "Serviços", exact: true })
      .waitFor();
    await page
      .getByRole("link", { name: /Serviço de teste/ })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Falar no WhatsApp", exact: true })
      .waitFor();
    await context.route("https://wa.me/**", (route) =>
      route.fulfill({ body: "WhatsApp de teste" }),
    );
    const popupPromise = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Falar no WhatsApp", exact: true })
      .click();
    const popup = await popupPromise;
    await popup.waitForURL(/^https:\/\/wa.me\/5592999990000/);
    await popup.close();
    assert.equal(
      await page
        .getByRole("button", { name: "Adicionar", exact: true })
        .count(),
      0,
      "Perfil padrão exibiu checkout",
    );
    await noOverflow(page, `standard ${width}`);
    await page.goto(`${base}/loja/${business.slug}`);
    assert.equal(
      await page.getByRole("button", { name: "Salvar", exact: true }).count(),
      0,
      "Favoritos pediu login durante navegação",
    );
    assert.equal(
      await page.getByRole("link", { name: "Escrever avaliação" }).count(),
      0,
    );
    await page.getByRole("button", { name: "Adicionar", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar · R$ 25,00" }).click();
    await page.getByRole("link", { name: /Ver carrinho/ }).click();
    await page.getByRole("heading", { name: "Seu carrinho" }).waitFor();
    await page.getByRole("button", { name: "Continuar pedido" }).click();
    await page.getByRole("button", { name: "Continuar com Google" }).waitFor();
    assert.equal(
      JSON.parse(
        await page.evaluate(() => localStorage.getItem("norieco-cart-v1")),
      )[0].product.id,
      product.id,
      "Login descartou carrinho",
    );
    await noOverflow(page, `login ${width}`);
    assert.deepEqual(errors, []);
    await context.close();
  }
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    page = await context.newPage();
  await mock(page, { logged: true });
  await page.goto(`${base}/loja/${business.slug}`);
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar · R$ 25,00" }).click();
  await page.goto(`${base}/finalizar`);
  await page
    .getByRole("button", { name: "Confirmar pedido · R$ 25,00" })
    .click();
  await page.getByRole("heading", { name: "Meus pedidos" }).waitFor();
  await page.getByText("NE-TESTE", { exact: true }).waitFor();
  assert.equal(checkout.p_slug, business.slug);
  assert.equal(checkout.p_items[0].productId, product.id);
  assert.ok(!("tenant_id" in checkout));
  assert.deepEqual(
    JSON.parse(
      await page.evaluate(() => localStorage.getItem("norieco-cart-v1")),
    ),
    [],
  );
  await noOverflow(page, "checkout concluído");
  await context.close();
  const c2 = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    p2 = await c2.newPage();
  await mock(p2, { logged: true, onboarding: true });
  await p2.goto(`${base}/conta`);
  await p2
    .getByRole("heading", { name: "O marketplace é aberto para você." })
    .waitFor();
  await p2
    .getByRole("link", { name: "Cadastrar minha empresa", exact: true })
    .click();
  await p2.getByRole("heading", { name: "Falta só conhecer você." }).waitFor();
  assert.equal(
    await p2.getByLabel("Nome completo").inputValue(),
    "Cliente Teste",
  );
  await p2.getByLabel("WhatsApp com DDD").fill("92999990000");
  await p2.getByLabel("Cidade", { exact: true }).fill("Manaus");
  await p2.getByLabel("Bairro", { exact: true }).fill("Centro");
  await p2.getByRole("checkbox").first().check();
  await p2.getByRole("button", { name: "Concluir cadastro" }).click();
  await p2.getByRole("heading", { name: "Cadastrar minha empresa" }).waitFor();
  await p2.goto(`${base}/conta`);
  await p2.getByRole("heading", { name: "Olá, Cliente." }).waitFor();
  await p2.goto(`${base}/conta/dados`);
  await p2.getByLabel("Nome completo").fill("Cliente Atualizado");
  await p2.getByRole("button", { name: "Salvar alterações" }).click();
  await p2.getByText("Seus dados foram atualizados.").waitFor();
  await p2.goto(`${base}/cadastrar-empresa`);
  await p2.getByRole("heading", { name: "Cadastrar minha empresa" }).waitFor();
  for (const [label, value] of [
    ["Nome da empresa", "Negócio automatizado"],
    ["WhatsApp com DDD", "92999991234"],
    ["E-mail comercial", "loja@example.test"],
    ["Cidade", "Manaus"],
    ["Bairro", "Centro"],
    ["Endereço completo", "Rua teste, 10"],
    ["Descrição curta", "Empresa somente de testes automatizados."],
    ["Nome do responsável legal", "Pessoa Teste"],
    ["CPF do responsável", "52998224725"],
  ])
    await p2.getByLabel(label, { exact: true }).fill(value);
  await p2.getByLabel("Categoria", { exact: true }).selectOption("1");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWYQAAAAASUVORK5CYII=",
    "base64",
  );
  await p2.getByLabel(/Documento de identidade/).setInputFiles({
    name: "identidade-teste.png",
    mimeType: "image/png",
    buffer: png,
  });
  await p2.getByLabel(/Registro ou comprovante de atividade/).setInputFiles({
    name: "atividade-teste.png",
    mimeType: "image/png",
    buffer: png,
  });
  await p2.getByRole("checkbox", { name: /Confirmo que os dados/ }).check();
  await noOverflow(p2, "formulário de empresa");
  await p2.evaluate(() => window.scrollTo(0, 0));
  await p2.screenshot({
    path: "test-results/business-form-mobile.png",
    fullPage: true,
  });
  await p2.setViewportSize({ width: 320, height: 844 });
  await noOverflow(p2, "formulário de empresa em 320 px");
  await p2.getByRole("button", { name: "Enviar para análise" }).click();
  await p2.getByText("Em análise", { exact: true }).waitFor();
  await p2.goto(`${base}/administracao`);
  await p2.getByRole("heading", { name: "Acesso restrito" }).waitFor();
  await p2.goto(`${base}/conta`);
  await p2.getByRole("button", { name: "Sair da conta" }).click();
  await p2.getByRole("heading", { name: /Tudo o que/ }).waitFor();
  assert.equal(
    logoutScope,
    "local",
    "Logout do marketplace encerrou outras sessões do ecossistema",
  );
  await c2.close();
  const c3 = await browser.newContext(),
    p3 = await c3.newPage();
  await mock(p3, { fail: true });
  await p3.goto(base);
  await p3.getByRole("alert").waitFor();
  await c3.close();
  const c4 = await browser.newContext({
      viewport: { width: 320, height: 844 },
    }),
    p4 = await c4.newPage();
  await mock(p4, { empty: true });
  await p4.goto(base);
  await p4
    .getByRole("heading", {
      name: "Ainda não há empresas publicadas nesta seleção",
    })
    .waitFor();
  assert.equal(
    await p4.locator(".empty").count(),
    1,
    "Home repetiu mensagens de lista vazia",
  );
  await noOverflow(p4, "home vazia em 320 px");
  await p4
    .getByRole("link", { name: "Cadastrar minha empresa", exact: true })
    .click();
  await p4.getByRole("button", { name: "Continuar com Google" }).waitFor();
  await c4.close();
  console.log(
    "OK: desktop 1440, mobile 390/320, filtros, perfis padrão, carrinho persistente, acesso, onboarding, checkout e erros. Login Google real exige conta interativa.",
  );
} finally {
  await browser.close();
}
