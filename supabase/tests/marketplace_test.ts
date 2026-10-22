let helper: URL | null = null;
for (const path of [
  "../../../vendapeixe/supabase/tests/helpers/saas_database.ts",
  "../../../../supabase/tests/helpers/saas_database.ts",
]) {
  const candidate = new URL(path, import.meta.url);
  try {
    await Deno.stat(candidate);
    helper = candidate;
    break;
  } catch {
    /* other checkout layout */
  }
}
if (!helper)
  throw Error(
    "Os testes de integração precisam do checkout original do Nori Gestão.",
  );
const { saasDatabase } = (await import(helper.href)) as {
  saasDatabase: () => Promise<import("npm:@electric-sql/pglite@0.3.14").PGlite>;
};
const assert = (value: unknown, message: string) => {
  if (!value) throw Error(message);
};
Deno.test(
  "marketplace: RLS, documentos, verificação, pedido idempotente e cozinha em dois tenants",
  async () => {
    const db = await saasDatabase();
    const admin = "10000000-0000-4000-8000-000000000201",
      ownerB = "10000000-0000-4000-8000-000000000202",
      buyer = "10000000-0000-4000-8000-000000000203",
      stranger = "10000000-0000-4000-8000-000000000204";
    const bA = "20000000-0000-4000-8000-000000000201",
      bB = "20000000-0000-4000-8000-000000000202",
      productA = "30000000-0000-4000-8000-000000000201",
      productB = "30000000-0000-4000-8000-000000000202",
      supply = "40000000-0000-4000-8000-000000000202";
    const value = async (sql: string, args: unknown[] = []) =>
      Object.values(
        (await db.query<Record<string, unknown>>(sql, args)).rows[0],
      )[0];
    const rejects = async (sql: string, args: unknown[] = []) => {
      try {
        await db.query(sql, args);
      } catch {
        return;
      }
      throw Error("Acesso indevido aceito: " + sql);
    };
    const as = async (user: string, role = "authenticated") => {
      await db.exec(`reset role;set role ${role};`);
      await db.query(
        "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
        [user, JSON.stringify(user ? { sub: user, role } : { role })],
      );
    };
    try {
      await db.exec(
        `create or replace function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;`,
      );
      for (const file of [
        "202610170001_direct_product_stock.sql",
        "202610170002_paid_direct_stock.sql",
        "202610170003_dining_sale_movement_type.sql",
        "202610170004_supply_inventory_workflow.sql",
        "202610170005_item_codes.sql",
        "202610170006_kitchen_workflow.sql",
        "202610180001_catalog_recipe_availability.sql",
        "202610180002_invalid_legacy_recipe_availability.sql",
      ])
        await db.exec(
          await Deno.readTextFile(new URL("../../migrations/" + file, helper!)),
        );
      const migration = await Deno.readTextFile(
        new URL("../migrations/202610180003_marketplace.sql", import.meta.url),
      );
      try {
        await db.exec(migration);
      } catch (e) {
        const err = e as { position?: string; where?: string; message: string };
        console.log(
          err.message,
          err.where,
          err.position,
          migration.slice(
            Math.max(0, Number(err.position) - 150),
            Number(err.position) + 150,
          ),
        );
        throw e;
      }
      await db.exec(
        await Deno.readTextFile(
          new URL(
            "../migrations/202610180004_marketplace_access_audit.sql",
            import.meta.url,
          ),
        ),
      );
      await db.exec(
        await Deno.readTextFile(
          new URL(
            "../migrations/202610180005_marketplace_store_validation.sql",
            import.meta.url,
          ),
        ),
      );
      await db.exec(await Deno.readTextFile(new URL('../migrations/202610190001_starter_business_portal.sql', import.meta.url)));
      await db.exec(await Deno.readTextFile(new URL('../migrations/202610200001_pdv_marketplace_publication.sql', import.meta.url)));
      for(const file of ['202610220001_self_service_pdv_trials.sql','202610220002_optional_pdv_verification.sql'])await db.exec(await Deno.readTextFile(new URL('../migrations/'+file,import.meta.url)));
      await db.exec(
        `delete from marketplace_businesses;insert into auth.users(id,email) values('${admin}','superabufari@gmail.com'),('${ownerB}','business@example.test'),('${buyer}','buyer@example.test'),('${stranger}','stranger@example.test');set request.jwt.claim.sub='${admin}';`,
      );
      const tA = await value("select id from tenants where is_default"),
        tB = await value(
          "select create_tenant('Restaurante teste','market-test','RESTAURANT')",
        );
      await db.query(
        "select register_tenant_domain($1,'app.market-test.com.br')",
        [tB],
      );
      await db.exec("set request.jwt.claim.sub='';");
      await db.query(
        "update profiles set role='ADMINISTRATOR',is_active=true,tenant_id=$1 where id=$2",
        [tB, ownerB],
      );
      await db.query(
        `insert into marketplace_businesses(id,slug,name,category_id,listing_type,verification_status,tenant_id,description,city) select $1,'loja-a','Loja A',id,'INTEGRATED','VERIFIED',$2,'Loja de teste A','Manaus' from marketplace_categories limit 1`,
        [bA, tA],
      );
      await db.query(
        `insert into marketplace_businesses(id,slug,name,category_id,listing_type,verification_status,tenant_id,description,city) select $1,'loja-b','Loja B',id,'INTEGRATED','VERIFIED',$2,'Loja de teste B','Manaus' from marketplace_categories limit 1`,
        [bB, tB],
      );
      await db.query(
        "insert into marketplace_members values($1,$2,'OWNER'),($3,$4,'OWNER')",
        [bA, admin, bB, ownerB],
      );
      await db.query(
        "insert into marketplace_verifications(business_id,legal_name,cpf,identity_path,proof_path) values($1,'Responsável','12345678900','private-a','private-a-proof'),($2,'Outro responsável','98765432100','private-b','private-b-proof')",
        [bA, bB],
      );
      const hours = Array.from({ length: 7 }, (_, day) => ({
        day,
        enabled: true,
        open: "00:00",
        close: "00:00",
      }));
      await db.query(
        "update app_settings set marketplace_is_open=true,marketplace_opening_hours=$1::jsonb",
        [JSON.stringify(hours)],
      );
      await db.query(
        "insert into supplies(id,tenant_id,name,unit,current_stock) values($1,$2,'Batata','kg',1)",
        [supply, tB],
      );
      await db.query(
        `insert into products(id,tenant_id,name,slug,species,sale_mode,price_per_kg,physical_stock_kg,online_stock_limit_kg,preparation_options) values($1,$2,'Peixe A','peixe-a','Peixe','UNIT',20,10,10,'[]')`,
        [productA, tA],
      );
      await db.query(
        `insert into products(id,tenant_id,name,slug,species,sale_mode,price_per_kg,recipe_items,preparation_options) values($1,$2,'Batata B','batata-b','Porcao','UNIT',15,$3::jsonb,'[]')`,
        [
          productB,
          tB,
          JSON.stringify([
            {
              source_type: "SUPPLY",
              source_id: supply,
              quantity: 100,
              unit: "g",
            },
          ]),
        ],
      );
      // PDV publication needs platform approval; it never reviews documents or opens a store.
      await db.query("update marketplace_businesses set verification_status='DRAFT' where id=$1", [bB]);
      const categoryB = await value("select id from marketplace_categories where name='Restaurantes'");
      await as(ownerB);
      await rejects("select marketplace_publish_pdv($1,$2)", [bB,categoryB]);
      await rejects("select marketplace_publish_pdv_internal($1,$2)", [bB,categoryB]);
      await as(admin);
      await rejects("select marketplace_publish_pdv($1,gen_random_uuid())", [bB]);
      await db.query("select marketplace_publish_pdv($1,$2)", [bB,categoryB]);
      await db.exec("reset role");
      assert(await value("select reviewed_at is null from marketplace_verifications where business_id=$1",[bB]),"Publication forged document review");
      assert(await value("select marketplace_is_open from app_settings where tenant_id=$1",[tB])===true,"Publication changed opening settings");
      assert(await value("select count(*)::int from marketplace_audit where action='PDV_PUBLICATION_APPROVED' and entity_id=$1",[bB])===1,"Publication missing audit");
      await db.query("update marketplace_businesses set verification_status='SUSPENDED' where id=$1",[bB]);
      await as(admin);await rejects("select marketplace_publish_pdv($1,$2)",[bB,categoryB]);
      await db.exec("reset role");await db.query("update marketplace_businesses set verification_status='VERIFIED' where id=$1",[bB]);
      await as("", "anon");
      await rejects("select marketplace_publish_pdv($1,$2)",[bB,categoryB]);
      const data = (await value("select marketplace_business('loja-b')")) as {
        products: Record<string, unknown>[];
        business: Record<string, unknown>;
      };
      assert(
        data.products.length === 1 && data.products[0].id === productB,
        "Catálogo misturou produtos",
      );
      assert(data.business.document_verified===false,"PDV publication displayed a documentary badge");
      assert(
        !("tenant_id" in data.business) &&
          !("cpf" in data.business) &&
          !("recipe_items" in data.products[0]),
        "Projeção pública vazou dados",
      );
      await rejects("select * from marketplace_verifications");
      await rejects("select marketplace_admin_data()");
      await rejects("select marketplace_public_business($1)", [bB]);
      await as(buyer);
      assert(
        (await value("select count(*)::int from orders")) === 0,
        "Consumidor recebeu acesso ao PDV",
      );
      await rejects(
        "select marketplace_checkout('loja-b',gen_random_uuid(),'[]','pickup',null,'Pix','')",
      );
      const profile = {
        full_name: "Cliente do Amazonas",
        whatsapp: "92999990000",
        city: "Manaus",
        neighborhood: "Centro",
        terms: true,
      };
      await db.query("select marketplace_save_profile($1::jsonb)", [
        JSON.stringify(profile),
      ]);
      await rejects("insert into marketplace_admins values($1)", [buyer]);
      await rejects("select marketplace_admin_data()");
      await rejects("select marketplace_store_settings(null)");
      assert(
        (await value("select count(*)::int from marketplace_verifications")) ===
          0,
        "Cliente leu documentos",
      );
      const items = [{ productId: productB, quantity: 2, notes: "Sem sal" }],
        key = crypto.randomUUID();
      await as(ownerB);
      await db.query("select marketplace_store_settings($1::jsonb)", [
        JSON.stringify({
          enabled: false,
          delivery: false,
          timezone: "America/Manaus",
          hours,
        }),
      ]);
      await rejects(
        "update app_settings set marketplace_timezone='invalid/timezone'",
      );
      await rejects(
        'update app_settings set marketplace_opening_hours=\'[{"day":2,"enabled":true,"open":"broken","close":"18:00"}]\'',
      );
      await as(buyer);
      await rejects(
        "select marketplace_checkout('loja-b',$1,$2::jsonb,'pickup',null,'Pix','Teste',30)",
        [crypto.randomUUID(), JSON.stringify(items)],
      );
      await as(ownerB);
      await db.query("select marketplace_store_settings($1::jsonb)", [
        JSON.stringify({
          enabled: true,
          delivery: false,
          timezone: "America/Manaus",
          hours,
        }),
      ]);
      await as(buyer);
      await rejects(
        "select marketplace_checkout('loja-b',$1,$2::jsonb,'pickup',null,'Pix','Teste',1)",
        [crypto.randomUUID(), JSON.stringify(items)],
      );
      const order = (await value(
        "select marketplace_checkout('loja-b',$1,$2::jsonb,'pickup',null,'Pix','Teste',30)",
        [key, JSON.stringify(items)],
      )) as { id: string };
      assert(
        ((await value("select marketplace_my_orders()")) as unknown[])
          .length === 1,
        "Cliente não vê pedido",
      );
      assert(
        (
          (await value(
            "select marketplace_checkout('loja-b',$1,$2::jsonb,'pickup',null,'Pix','Teste',30)",
            [key, JSON.stringify(items)],
          )) as { id: string }
        ).id === order.id,
        "Repetição duplicou pedido",
      );
      assert(
        (await value("select auth.uid()::text")) === buyer,
        "Checkout não restaurou JWT",
      );
      await rejects(
        "select marketplace_checkout('loja-b',$1,$2::jsonb,'pickup',null,'Pix','Teste')",
        [key, JSON.stringify([{ productId: productB, quantity: 3 }])],
      );
      await rejects(
        "select marketplace_checkout('loja-b',$1,$2::jsonb,'pickup',null,'Pix','')",
        [
          crypto.randomUUID(),
          JSON.stringify([{ productId: productA, quantity: 1 }]),
        ],
      );
      assert(
        (await value("select auth.uid()::text")) === buyer,
        "Falha não restaurou JWT",
      );
      await as(stranger);
      await db.query("select marketplace_save_profile($1::jsonb)", [
        JSON.stringify({ ...profile, full_name: "Outra pessoa" }),
      ]);
      assert(
        ((await value("select marketplace_my_orders()")) as unknown[])
          .length === 0,
        "Outro cliente leu pedido",
      );
      assert(
        (await value("select count(*)::int from marketplace_orders")) === 0,
        "RLS vazou mapa de pedidos",
      );
      await rejects("select marketplace_save_service($1,$2::jsonb,false)", [
        bB,
        JSON.stringify({ name: "Ataque", description: "Sem acesso" }),
      ]);
      await as(ownerB);
      assert(
        (await value("select tenant_id::text from orders where id=$1", [
          order.id,
        ])) === tB,
        "Pedido entrou no tenant errado",
      );
      assert(
        Number(
          await value("select estimated_total from orders where id=$1", [
            order.id,
          ]),
        ) === 30,
        "Preço não veio do PDV",
      );
      assert(
        (await value(
          "select count(*)::int from kitchen_tickets where parent_id=$1",
          [order.id],
        )) === 1,
        "Pedido não foi para cozinha",
      );
      assert(
        (await value("select count(*)::int from marketplace_verifications")) ===
          1,
        "Documentos entre empresas vazaram",
      );
      await rejects("select marketplace_admin_action('approve',$1,'{}')", [bA]);
      await as(admin);
      assert(
        (await value("select count(*)::int from orders where id=$1", [
          order.id,
        ])) === 0,
        "Tenant A leu pedido B",
      );
      await db.query(
        "select marketplace_admin_action('suspend',$1,'{\"reason\":\"Teste de suspensão\"}')",
        [bB],
      );
      await as("", "anon");
      assert(
        (
          (await value("select marketplace_business('loja-b')")) as {
            business: unknown;
          }
        ).business === null,
        "Suspenso continua público",
      );
      await as(buyer);
      await rejects(
        "select marketplace_checkout('loja-b',$1,$2::jsonb,'pickup',null,'Pix','')",
        [crypto.randomUUID(), JSON.stringify(items)],
      );
      await db.exec("reset role");
      assert(
        (await value(
          "select count(*)::int from marketplace_audit where action='suspend'",
        )) === 1,
        "Ação sem auditoria",
      );
      assert(
        (await value("select count(*)::int from marketplace_orders")) === 1,
        "Falha criou pedido parcial",
      );
      await db.exec("grant select,insert on storage.objects to authenticated;");
      await as(stranger);
      const registration = {
        name: "Profissional teste",
        category_id: await value("select (marketplace_categories()->0->>'id')"),
        listing_type: "STANDARD",
        whatsapp: "92999991234",
        email: "comercial@example.test",
        city: "Tefé",
        neighborhood: "Centro",
        address: "Rua teste, 15",
        description: "Somente uma empresa para testar cadastro.",
        legal_name: "Pessoa Teste",
        cpf: "52998224725",
        opening_hours: hours,
      };
      const draft = (await value(
        "select marketplace_save_business($1::jsonb,false)",
        [JSON.stringify(registration)],
      )) as { id: string };
      const identity = `${stranger}/${draft.id}/identity.jpg`,
        proof = `${stranger}/${draft.id}/proof.pdf`;
      await db.query(
        "insert into storage.objects(bucket_id,name) values('marketplace-verifications',$1),('marketplace-verifications',$2)",
        [identity, proof],
      );
      await rejects(
        "insert into storage.objects(bucket_id,name) values('marketplace-verifications',$1)",
        [`${ownerB}/${bB}/attack.pdf`],
      );
      await db.query("select marketplace_save_business($1::jsonb,true)", [
        JSON.stringify({
          ...registration,
          id: draft.id,
          identity_path: identity,
          proof_path: proof,
        }),
      ]);
      const own = (await value("select marketplace_my_businesses()")) as {
        verification_status: string;
      }[];
      assert(
        own[0].verification_status === "PENDING",
        "Empresa não entrou em análise",
      );
      assert(
        (await value("select count(*)::int from storage.objects")) === 2,
        "Dono não lê os próprios documentos",
      );
      await as(buyer);
      assert(
        (await value("select count(*)::int from storage.objects")) === 0,
        "Documentos privados vazaram entre contas",
      );
      await rejects("select marketplace_save_business($1::jsonb,true)", [
        JSON.stringify({
          ...registration,
          id: draft.id,
          identity_path: identity,
          proof_path: proof,
        }),
      ]);
      await as(admin);
      await db.query("select marketplace_admin_action('approve',$1,'{}')", [
        draft.id,
      ]);
      assert(((await value("select marketplace_search('Profissional teste','','')")) as any[])[0].document_verified===true,"Documentary approval lost its badge");
      assert(
        (
          (await value(
            "select marketplace_search('Profissional teste','','')",
          )) as unknown[]
        ).length === 1,
        "Aprovação não publicou empresa",
      );
      await db.query(
        "select marketplace_admin_action('reject',$1,'{\"reason\":\"Documentação incompleta\"}')",
        [draft.id],
      );
      assert(
        (
          (await value(
            "select marketplace_search('Profissional teste','','')",
          )) as unknown[]
        ).length === 0,
        "Reprovação não ocultou empresa",
      );
      await db.exec("reset role");
      assert(
        Number(
          await value(
            "select count(*)::int from marketplace_audit where action='ACCESS_GRANTED'",
          ),
        ) >= 3,
        "Vínculos empresariais não foram auditados",
      );
    } finally {
      await db.close();
    }
  },
);
