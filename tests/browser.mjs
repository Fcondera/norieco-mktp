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
  document_verified: false,
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
  services: [{id:"offer-test",business_id:"20000000-0000-4000-8000-000000000002",name:"Atendimento local",description:"Oferta apenas de testes",kind:"SERVICE",price:20,image_url:""}],
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
let inquiry = null;
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
      case "marketplace_send_inquiry":
        inquiry = args;
        data = null;
        break;
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
  await page.route('https://gestao.norieco.com.br/inicio',route=>route.fulfill({contentType:'text/html',body:'<h1>Nori Gestao inicial</h1>'}));
  await page.context().route('https://gestao.norieco.com.br/auth/bridge**',route=>route.fulfill({contentType:'text/html',body:`<h1>Abrindo painel</h1><script>const nonce=new URLSearchParams(location.search).get('state')||location.hash.slice(1);addEventListener('message',e=>{if(e.data.type==='norieco-auth-session'&&e.data.nonce===nonce){if('refresh_token'in e.data)throw Error('Refresh token transferred');opener.postMessage({type:'norieco-auth-complete',nonce},${JSON.stringify(new URL(origin).origin)});document.querySelector('h1').textContent='Nori Gestao inicial';}});opener.postMessage({type:'norieco-auth-ready',nonce},${JSON.stringify(new URL(origin).origin)});</script>`}));

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
    await page.locator(".eco-hero .is-active h1").waitFor();
    await noOverflow(page, `institucional ${width}`);
    await page.screenshot({path: `test-results/landing-${width}.png`, fullPage:true});
    assert.equal(await page.locator('.eco-header a[href="https://gestao.norieco.com.br/inicio"]').count(), 1);
    for (const name of ["Nori Gestão", "Catálogo online", "Marketplace regional"])
      await page.getByRole("heading", { name, exact: true }).waitFor();
    assert.equal(await page.locator('.eco-solutions a[href^="https://wa.me/"]').count(), 2);
    assert.equal(await page.locator('.eco-solutions a[href="/marketplace"]').count(), 1);
    assert.equal(await page.locator('.eco-site').getByText(/Controle de ponto|NoriEco Sites|Sites e landing pages/).count(), 0);
    await page.locator(".eco-header").getByRole("link", {name: "Marketplace", exact: true}).click();
    assert.equal(new URL(page.url()).pathname, "/marketplace");
    await page.getByRole("heading", { name: /Tudo o que/ }).waitFor();
    await page
      .getByRole("link", { name: /Restaurante de teste/ })
      .first()
      .waitFor();
    await noOverflow(page, `home ${width}`);
    await page.getByRole("heading", {name:"Em destaque",exact:true}).waitFor();
    assert.equal(await page.locator('.business-card .verified').count(),0,'PDV listing received documentary badge');
    await page.getByRole("heading", {name:"Top 3 vendedores",exact:true}).waitFor();
    await page.getByRole("heading", {name:"Melhores lojas",exact:true}).waitFor();
    assert.equal(await page.locator('.mkt-rank-card').count(),2);
    for (const name of ["Acesso rápido", "Nori Gestão", "Suporte", "Informações legais"])
      assert.equal(await page.locator('.marketplace-footer').getByRole('navigation',{name,exact:true}).count(),1);
    const accountIcon = page.locator(".header").getByRole("link", {name: "Acessar Nori Gestão", exact: true});
    assert.equal(await accountIcon.isVisible(), true, "Ícone da conta oculto no celular");
    const accountBox = await accountIcon.boundingBox();
    const cartBox = await page.locator(".header .cart-top").boundingBox();
    assert.ok(accountBox && cartBox && Math.abs(accountBox.y - cartBox.y) < 8, "Carrinho quebrou a linha do cabeçalho");
    assert.equal((await accountIcon.innerText()).trim(), "", "Cabeçalho exibiu texto de login");
    assert.equal(await page.locator(".header").getByText("Cadastrar empresa", {exact:true}).count(), 0);
    await accountIcon.click();
    await page.getByRole("heading", {name: "Nori Gestao inicial"}).waitFor();
    assert.equal(new URL(page.url()).origin, "https://gestao.norieco.com.br");
    assert.equal(new URL(page.url()).pathname, "/inicio");
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
    await page.goto(base + '/conta');
    await page.getByRole('heading', {name:'Nori Gestao inicial'}).waitFor();
    assert.equal(new URL(page.url()).origin, 'https://gestao.norieco.com.br');
    for (const route of ["/conta/compras", "/conta/pedidos"]) {
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
    await page.getByRole('button',{name:'Ver todas categorias',exact:true}).click();
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
    const offer = page.locator('article').filter({has:page.getByRole('heading',{name:'Atendimento local',exact:true})});
    await offer.getByRole('button',{name:'Enviar solicitação',exact:true}).click();
    await offer.getByLabel('Seu nome').fill('Cliente Teste');
    await offer.getByLabel('WhatsApp com DDD').fill('92999990000');
    await offer.getByLabel('O que você precisa?').fill('Quero mais informações');
    await offer.getByRole('button',{name:'Enviar para a empresa',exact:true}).click();
    await offer.getByText('Solicitação enviada para a empresa. Aguarde o contato dela.').waitFor();
    assert.equal(inquiry.p_slug,standard.slug);
    assert.equal(inquiry.p_offer,'offer-test');
    assert.ok(!('tenant_id' in inquiry));
    await page.goto(`${base}/loja/${business.slug}`);
    assert.equal(new URL(page.url()).pathname,"/marketplace/loja/"+business.slug);
    await page.getByRole('heading',{name:business.name,exact:true}).waitFor();
    assert.equal(await page.locator('.business-profile .verified').count(),0,'PDV profile received documentary badge');
    assert.equal(
      await page.getByRole("button", { name: "Salvar", exact: true }).count(),
      0,
      "Favoritos pediu login durante navegação",
    );
    assert.equal(
      await page.getByRole("link", { name: "Escrever avaliação" }).count(),
      0,
    );
    assert.equal(await page.getByRole('button',{name:'Adicionar',exact:true}).count(),0,'Marketplace profile must not duplicate the catalog');
    assert.equal(await page.getByRole('link',{name:'Abrir catálogo',exact:true}).getAttribute('href'),'/'+business.slug);
    // Existing buyer carts can still be completed after the catalog moves.
    await page.evaluate(({product,slug})=>localStorage.setItem('norieco-cart-v1',JSON.stringify([{key:product.id+'::',business_slug:slug,product,quantity:1,option_id:'',notes:''}])) ,{product,slug:business.slug});
    await page.goto(base+'/carrinho');
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
  await page.getByRole('link',{name:'Abrir catálogo',exact:true}).waitFor();
  await page.evaluate(({product,slug})=>localStorage.setItem('norieco-cart-v1',JSON.stringify([{key:product.id+'::',business_slug:slug,product,quantity:1,option_id:'',notes:''}])) ,{product,slug:business.slug});
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
  await p2.getByRole('heading',{name:'Sua loja começa com 15 dias grátis.'}).waitFor();
  assert.equal(await p2.getByRole('heading',{name:'Minha conta',exact:true}).count(),0);
  assert.equal(await p2.getByRole('heading',{name:'Falta só conhecer você.',exact:true}).count(),0,'Seller access required a buyer profile');
  const sellerPopup=c2.waitForEvent('page');
  await p2.getByRole('link',{name:'Abrir meu painel',exact:true}).click();
  const panel=await sellerPopup;await panel.getByRole('heading',{name:'Nori Gestao inicial'}).waitFor();await panel.close();
  await p2.goto(base+'/primeiro-acesso');
  await p2.getByRole('heading',{name:'Falta só conhecer você.'}).waitFor();
  assert.equal(
    await p2.getByLabel("Nome completo").inputValue(),
    "Cliente Teste",
  );
  await p2.getByLabel("WhatsApp com DDD").fill("92999990000");
  await p2.getByLabel("Cidade", { exact: true }).fill("Manaus");
  await p2.getByLabel("Bairro", { exact: true }).fill("Centro");
  await p2.getByRole("checkbox").first().check();
  await p2.getByRole("button", { name: "Concluir cadastro" }).click();
  await p2.getByRole("heading", { name: /Tudo o que/ }).waitFor();
  await p2.goto(`${base}/conta`);
  await p2.getByRole('heading',{name:'Sua loja começa com 15 dias grátis.'}).waitFor();
  await p2.goto(`${base}/conta/compras`);
  await p2.getByRole("heading", { name: "Olá, Cliente." }).waitFor();
  assert.equal(await p2.locator('.account-layout aside h2').textContent(),'Minhas compras');
  const accountPopup=c2.waitForEvent('page');
  await p2.locator('.header').getByRole('link',{name:'Acessar Nori Gestão',exact:true}).click();
  const accountPanel=await accountPopup;
  await accountPanel.getByRole('heading',{name:'Nori Gestao inicial'}).waitFor();
  assert.equal(new URL(accountPanel.url()).pathname,'/auth/bridge');
  await accountPanel.close();
  await p2.goto(`${base}/conta/dados`);
  await p2.getByLabel("Nome completo").fill("Cliente Atualizado");
  await p2.getByRole("button", { name: "Salvar alterações" }).click();
  await p2.getByText("Seus dados foram atualizados.").waitFor();
  await p2.goto(`${base}/cadastrar-empresa`);
  await p2.getByRole('heading',{name:'Sua loja começa com 15 dias grátis.'}).waitFor();
  await p2.goto(`${base}/administracao`);
  await p2.getByRole("heading", { name: "Acesso restrito" }).waitFor();
  await p2.goto(`${base}/conta/compras`);
  // A delayed focus refresh must not resurrect the profile after logout.
  await p2.getByRole('button', {name:'Sair da conta'}).waitFor();
  let finishProfile;
  const pendingProfile = new Promise(resolve => { finishProfile = resolve; });
  await p2.route('**/rest/v1/rpc/marketplace_my_profile', async route => {
    await pendingProfile;
    await route.fulfill({json:{...profile,avatar_url:'https://example.test/old-profile.png'}});
  });
  const profileRequest=p2.waitForRequest('**/rest/v1/rpc/marketplace_my_profile');
  await p2.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await profileRequest;
  await p2.getByRole("button", { name: "Sair da conta" }).click();
  await p2.getByRole("heading", { name: /Tudo o que/ }).waitFor();
  const staleResponse=p2.waitForResponse('**/rest/v1/rpc/marketplace_my_profile');
  finishProfile();
  await staleResponse;
  await p2.waitForTimeout(150);
  assert.equal(await p2.locator('.header .avatar').count(),0,'Resposta atrasada restaurou o perfil encerrado');
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
  await p3.getByPlaceholder('Buscar lojas, produtos ou serviços').fill('Restaurante');
  await p3.getByRole('alert').waitFor();
  await p3.route('**/rest/v1/rpc/marketplace_search',route=>route.fulfill({json:[business]}));
  await p3.getByRole('button',{name:'Tentar novamente'}).click();
  await p3.getByRole('link',{name:/Restaurante de teste/}).first().waitFor();
  assert.equal(await p3.getByPlaceholder('Buscar lojas, produtos ou serviços').inputValue(),'Restaurante');
  await p3.getByPlaceholder('Buscar lojas, produtos ou serviços').press('Enter');
  await p3.waitForFunction(()=>document.getElementById('resultados').getBoundingClientRect().top<200);
  await p3.locator('.city-button').click();
  await p3.getByLabel('Cidade no Amazonas').fill('Manaus');
  await p3.getByRole('button',{name:'Aplicar',exact:true}).click();
  await p3.locator('.city-button').click();
  await p3.getByRole('button',{name:'Todo o Amazonas',exact:true}).click();
  assert.equal(await p3.evaluate(()=>localStorage.getItem('norieco-city')),'');
  assert.equal(await p3.locator('.city-picker').count(),0);
  await p3.route('**/rest/v1/rpc/marketplace_business',route=>route.fulfill({status:503,json:{message:'temporarily unavailable'}}));
  await p3.goto(base+'/loja/'+business.slug);
  await p3.getByRole('alert').waitFor();
  await p3.route('**/rest/v1/rpc/marketplace_business',route=>route.fulfill({json:{business,products:[]}}));
  await p3.getByRole('button',{name:'Tentar novamente'}).click();
  await p3.getByRole('heading',{name:business.name,exact:true}).waitFor();
  assert.equal(await p3.title(),business.name+' · NoriEco');
  assert.equal(await p3.locator('.profile-cover').count(),0,'Capa vazia ocupou espaço no perfil');
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
  await p4.getByRole("heading", { name: "Nori Gestao inicial" }).waitFor();
  assert.equal(new URL(p4.url()).hostname,"gestao.norieco.com.br");
  await c4.close();
  console.log(
    "OK: desktop 1440, mobile 390/320, filtros, perfis padrão, carrinho persistente, acesso, onboarding, checkout e erros. Login Google real exige conta interativa.",
  );
} finally {
  await browser.close();
}
