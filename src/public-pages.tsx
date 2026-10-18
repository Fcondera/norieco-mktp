import { useEffect, useState, useRef } from "react";
import { rpc } from "./lib/api";
import { Link, navigate } from "./lib/router";
import { brl, contactLink, subtotal, orderStatus } from "./lib/core.mjs";
import type {
  Business,
  Category,
  Product,
  CartItem,
  Address,
} from "./lib/types";
import { BusinessCard, Empty, Field, Icon, Loading, Notice, Photo } from "./ui";
import { useApp } from "./state";
import { discoverySections } from "./lib/discovery.mjs";
export const categoryNames = [
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
];
export function Home({
  query,
  city,
  onQuery,
}: {
  query: string;
  city: string;
  onQuery: (s: string) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]),
    [category, setCategory] = useState(""),
    [rows, setRows] = useState<Business[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    rpc<Category[]>("marketplace_categories")
      .then(setCategories)
      .catch(() => {});
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(
      () =>
        rpc<Business[]>("marketplace_search", {
          p_query: query,
          p_city: city,
          p_category: category,
        })
          .then((data) => {
            if (active) {
              setRows(data);
              setError("");
            }
          })
          .catch((e) => active && setError(e.message))
          .finally(() => active && setLoading(false)),
      350,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, city, category]);
  const discovery = discoverySections(rows);
  const section = (
    title: string,
    description: string,
    list: Business[],
    icon: string,
  ) =>
    list.length ? (
      <section className="home-section">
        <div className="section-heading">
          <div>
            <span className={`eyebrow ${icon}`}>
              <Icon name={icon} size={18} />
              {description}
            </span>
            <h2>{title}</h2>
          </div>
        </div>
        <div className="business-grid">
          {list.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      </section>
    ) : null;
  return (
    <div className="mkt-home">
      <section className="intro mkt-hero">
        <div className="intro-copy">
          <span className="eyebrow">COMPRE LOCAL. VALORIZE QUEM É DAQUI.</span>
          <h1>
            Tudo o que você procura
            <br />
            <span>no comércio da sua cidade</span>
          </h1>
          <p>Lojas, sabores, serviços e experiências em um só lugar.</p>
          <label className="hero-search">
            <Icon name="search" />
            <span className="sr-only">Buscar lojas, produtos ou serviços</span>
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Buscar lojas, produtos ou serviços"
              maxLength={100}
            />
            <button
              className="button primary"
              onClick={() =>
                document
                  .getElementById("resultados")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Buscar
            </button>
          </label>
          <small>
            <Icon name="pin" size={15} />
            {city || "Explore todas as cidades do Amazonas"}
          </small>
          <Link className="mkt-how" href="/ajuda">Como funciona o marketplace <Icon name="arrow" size={14} /></Link>
        </div>
        <div className="intro-art">
          <img
            src={`${import.meta.env.BASE_URL}nori-logo.png`}
            alt="NoriEco — descubra o que está perto"
          />
          <span>Da nossa região. Para o seu dia.</span>
        </div>
      </section>
      <div className="mkt-category-title"><h2>Categorias da sua cidade</h2><p>Da refeição de hoje ao serviço que você precisa.</p></div>
      <nav className="categories mkt-categories" aria-label="Categorias">
        <button
          className={!category ? "selected" : ""}
          onClick={() => setCategory("")}
        >
          <Icon name="shop" />
          Explorar
        </button>
        {(categories.length
          ? categories
          : categoryNames.map((name, i) => ({
              id: name,
              name,
              icon: i < 3 ? "food" : i > 5 && i < 10 ? "sun" : "shop",
            }))
        ).map((c) => (
          <button
            key={c.id}
            className={category === c.id ? "selected" : ""}
            onClick={() => setCategory(category === c.id ? "" : c.id)}
          >
            <Icon name={c.icon} />
            {c.name}
          </button>
        ))}
      </nav>
      <div id="resultados">
        {loading ? (
          <Loading />
        ) : error ? (
          <Notice error>
            {error}
            <button className="text-button" onClick={() => location.reload()}>
              Tentar novamente
            </button>
          </Notice>
        ) : query || category ? (
          <section className="home-section">
            <h2>
              {query
                ? `Resultados para “${query}”`
                : categories.find((c) => c.id === category)?.name || category}
            </h2>
            {rows.length ? (
              <div className="business-grid">
                {rows.map((b) => (
                  <BusinessCard key={b.id} business={b} />
                ))}
              </div>
            ) : (
              <Empty title="Nenhum resultado">
                Tente outro termo, categoria ou cidade.
              </Empty>
            )}
          </section>
        ) : !rows.length ? (
          <section className="home-section">
            <Empty title="Ainda não há empresas publicadas nesta seleção">
              Os perfis aparecem aqui após a verificação dos cadastros.
            </Empty>
          </section>
        ) : (
          <>
            {section("Em destaque", "UMA VITRINE DO COMÉRCIO LOCAL", discovery.featured, "star")}
            <section className="home-section mkt-ranking">
              <div className="section-heading"><div><span className="eyebrow"><Icon name="star" size={18} /> QUEM MOVIMENTA A REGIÃO</span><h2>Top 3 vendedores</h2><p>Os mais avaliados entre as lojas desta seleção. A ordem considera a quantidade de avaliações publicadas.</p></div></div>
              {discovery.topReviewed.length ? <div className="mkt-podium">{discovery.topReviewed.map((b,i) => <Link key={b.id} href={`/loja/${b.slug}`} className="mkt-rank-card"><span className="mkt-rank-number">{String(i+1).padStart(2,"0")}</span><Photo src={b.logo_url} alt={b.name} /><div><h3>{b.name}</h3><p>{b.category_name} · {b.city}</p><span className="mkt-rating"><Icon name="star" size={14} /> {Number(b.rating).toFixed(1)} <small>· {b.review_count} avaliações</small></span></div><Icon name="arrow" size={17} /></Link>)}</div> : <p className="mkt-pending">O ranking aparece quando as lojas receberem avaliações publicadas.</p>}
            </section>
            {section("Melhores lojas", "MAIORES NOTAS NESTA SELEÇÃO · DESEMPATE POR AVALIAÇÕES", discovery.bestRated, "check")}
            {section("Explore as lojas", city || "COMPRE DE QUEM ESTÁ PERTO", rows, "shop")}
          </>
        )}
      </div>
      <section className="business-cta">
        <div>
          <span className="eyebrow">SEU NEGÓCIO TEM LUGAR AQUI</span>
          <h2>Mais gente descobrindo o que você faz.</h2>
          <p>Cadastre sua empresa e conecte-se com clientes da sua região.</p>
        </div>
        <Link className="button primary" href="/cadastrar-empresa">
          Cadastrar minha empresa
          <Icon name="arrow" size={18} />
        </Link>
      </section>
    </div>
  );
}
export function BusinessPage({ slug }: { slug: string }) {
  const { cart, setCart, requireLogin, profile } = useApp();
  const [business, setBusiness] = useState<Business | null>(null),
    [products, setProducts] = useState<Product[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState<Product | null>(null),
    [quantity, setQuantity] = useState(1),
    [option, setOption] = useState(""),
    [notes, setNotes] = useState(""),
    [message, setMessage] = useState("");
  const dialogTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!selected) dialogTrigger.current?.focus();
  }, [selected]);
  useEffect(() => {
    setLoading(true);
    setError("");
    rpc<{ business: Business | null; products: Product[] }>(
      "marketplace_business",
      { p_slug: slug },
    )
      .then((d) => {
        setBusiness(d.business);
        setProducts(d.products || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);
  if (loading) return <Loading />;
  if (error) return <Notice error>{error}</Notice>;
  if (!business)
    return (
      <Empty title="Empresa indisponível">
        Este perfil ainda não está publicado ou não foi encontrado.
      </Empty>
    );
  const b = business;
  const contact = async () => {
    const url = contactLink(
      b.whatsapp,
      `Olá! Encontrei ${b.name} na NoriEco e gostaria de saber mais.`,
    );
    if (!url) return;
    const win = window.open("about:blank", "_blank");
    if (win) win.opener = null;
    try {
      await rpc("marketplace_lead", { p_slug: slug });
      if (win) win.location.href = url;
      else location.href = url;
    } catch (e) {
      win?.close();
      setMessage((e as Error).message);
    }
  };
  const add = () => {
    if (!selected) return;
    if (
      cart.length &&
      cart[0].business_slug !== slug &&
      !confirm(
        "Seu carrinho é de outra loja. Substituir pelos itens desta loja?",
      )
    )
      return;
    const base = cart[0]?.business_slug === slug ? cart : [];
    const key = `${selected.id}:${option}:${notes.trim()}`;
    const existing = base.find((i) => i.key === key);
    setCart(
      existing
        ? base.map((i) =>
            i.key === key
              ? { ...i, quantity: Math.min(999, i.quantity + quantity) }
              : i,
          )
        : [
            ...base,
            {
              key,
              business_slug: slug,
              product: selected,
              quantity,
              option_id: option,
              notes: notes.trim(),
            },
          ],
    );
    setSelected(null);
    setMessage("Produto adicionado ao carrinho.");
  };
  const draft: CartItem | null = selected
    ? {
        key: "",
        business_slug: slug,
        product: selected,
        quantity,
        option_id: option,
        notes,
      }
    : null;
  return (
    <>
      <Link className="back" href="/">
        ← Explorar empresas
      </Link>
      <Photo
        className="profile-cover"
        src={b.cover_url}
        alt={`Capa de ${b.name}`}
      />
      <section className="business-profile">
        <Photo
          className="profile-logo"
          src={b.logo_url}
          alt={`Logo ${b.name}`}
        />
        <div>
          <span className="eyebrow">{b.category_name}</span>
          <h1>
            {b.name}
            <span className="verified" title="Empresa verificada">
              <Icon name="check" size={17} />
            </span>
          </h1>
          <p>{b.description}</p>
          <div className="business-meta">
            <span className={b.is_open ? "open" : ""}>
              {b.is_open ? "Aberto agora" : "Fechado no momento"}
            </span>
            {b.rating != null && (
              <span>
                ★ {Number(b.rating).toFixed(1)} ({b.review_count} avaliações)
              </span>
            )}
            <span>
              {b.neighborhood}
              {b.neighborhood && " · "}
              {b.city}/{b.state}
            </span>
          </div>
        </div>
        {profile?.completed_at && (
          <button
            className="button secondary"
            onClick={async () => {
              if (requireLogin()) {
                try {
                  await rpc("marketplace_toggle_favorite", {
                    p_business: b.id,
                  });
                  setMessage("Favoritos atualizados.");
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }
            }}
          >
            <Icon name="heart" size={18} />
            Salvar
          </button>
        )}
      </section>
      {message && <Notice>{message}</Notice>}
      {b.listing_type === "INTEGRATED" ? (
        <>
          <div className="section-heading">
            <div>
              <h2>Cardápio</h2>
              <p>
                Integrado ao Nori Gestão ·{" "}
                {b.accepts_delivery
                  ? `Entrega a partir de ${brl(b.delivery_fee)} ou retirada`
                  : "Retirada na loja"}
              </p>
            </div>
          </div>
          {!b.is_open && (
            <Notice>
              A loja está fechada. Você pode consultar o cardápio e voltar
              quando abrir.
            </Notice>
          )}
          <div className="product-grid">
            {products.map((p) => (
              <article className="product-card" key={p.id}>
                <Photo src={p.image_url} alt={p.name} />
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <strong>
                    {brl(p.price)}
                    {p.sale_mode === "KG" ? "/kg" : ""}
                  </strong>
                  {p.sale_mode === "KG" && (
                    <small>
                      Peso médio {p.average_weight.toLocaleString("pt-BR")} kg
                    </small>
                  )}
                  <button
                    className="button primary"
                    disabled={!b.is_open}
                    onClick={(event) => {
                      dialogTrigger.current = event.currentTarget;
                      setSelected(p);
                      setQuantity(p.min_quantity || 1);
                      setNotes("");
                      setOption(p.options[0]?.id || "");
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!products.length && (
            <Empty title="Sem produtos disponíveis">
              O cardápio é atualizado pela loja.
            </Empty>
          )}
        </>
      ) : (
        <section>
          <button className="button primary" onClick={contact}>
            Falar no WhatsApp
            <Icon name="arrow" size={18} />
          </button>
          <h2>Serviços</h2>
          <div className="business-grid">
            {b.services?.map((s) => (
              <article className="panel" key={s.id}>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <button className="button secondary" onClick={contact}>
                  Solicitar orçamento
                </button>
              </article>
            ))}
          </div>
          {!b.services?.length && (
            <p>Entre em contato para conhecer as opções.</p>
          )}
        </section>
      )}
      <div className="details-grid">
        <section className="panel">
          <h2>Informações</h2>
          <p>
            <Icon name="pin" size={18} />
            {b.address} · {b.city}/{b.state}
          </p>
          {b.address && (
            <a
              className="text-link"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address + ", " + b.city + ", " + b.state)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver no mapa ↗
            </a>
          )}
          {contactLink(b.whatsapp) && (
            <p>
              <a
                className="text-link"
                href={`tel:+${new URL(contactLink(b.whatsapp)).pathname.slice(1)}`}
              >
                Telefone: {b.whatsapp}
              </a>
            </p>
          )}
          {/^https:\/\/(www\.)?instagram\.com\//i.test(b.instagram || "") && (
            <p>
              <a
                className="text-link"
                href={b.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram ↗
              </a>
            </p>
          )}
          <h3>Horários</h3>
          {b.opening_hours?.length ? (
            b.opening_hours.map((h) => (
              <p key={h.day}>
                {
                  [
                    "Domingo",
                    "Segunda",
                    "Terça",
                    "Quarta",
                    "Quinta",
                    "Sexta",
                    "Sábado",
                  ][h.day]
                }{" "}
                <strong>
                  {h.enabled ? `${h.open}–${h.close}` : "Fechado"}
                </strong>
              </p>
            ))
          ) : (
            <p>Consulte a empresa para confirmar os horários.</p>
          )}
          <button className="text-button" onClick={contact}>
            WhatsApp da empresa
          </button>
        </section>
        <section className="panel">
          <h2>Avaliações</h2>
          {b.reviews?.length ? (
            b.reviews.map((r) => (
              <article className="review" key={r.id}>
                <strong>
                  {r.display_name} · {r.rating} ★
                </strong>
                <p>{r.body}</p>
              </article>
            ))
          ) : (
            <p>Ainda não há avaliações publicadas.</p>
          )}
          {profile?.completed_at && (
            <>
              <Link
                href={`/conta/avaliacoes?loja=${encodeURIComponent(b.id)}`}
                className="text-link"
              >
                Escrever avaliação
              </Link>
              <br />
            </>
          )}
          {profile?.completed_at ? (
            <Link
              className="text-link"
              href={`/conta/denunciar?loja=${encodeURIComponent(b.id)}`}
            >
              Reportar um problema
            </Link>
          ) : (
            <a
              className="text-link"
              href={contactLink(
                import.meta.env.VITE_SUPPORT_WHATSAPP || "5547992739983",
                `Olá! Quero reportar um problema no perfil ${b.name} na NoriEco.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Reportar um problema no WhatsApp ↗
            </a>
          )}
        </section>
      </div>
      {selected && (
        <div className="dialog-backdrop" onClick={() => setSelected(null)}>
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSelected(null);
              if (e.key === "Tab") {
                const nodes = [
                  ...e.currentTarget.querySelectorAll<HTMLElement>(
                    "button:not(:disabled), input, select, textarea",
                  ),
                ];
                if (e.shiftKey && document.activeElement === nodes[0]) {
                  e.preventDefault();
                  nodes.at(-1)?.focus();
                } else if (
                  !e.shiftKey &&
                  document.activeElement === nodes.at(-1)
                ) {
                  e.preventDefault();
                  nodes[0]?.focus();
                }
              }
            }}
          >
            <button
              className="close"
              aria-label="Fechar produto"
              autoFocus
              onClick={() => setSelected(null)}
            >
              <Icon name="close" />
            </button>
            <h2 id="product-title">{selected.name}</h2>
            <p>{selected.description}</p>
            {selected.sale_mode !== "COMBO" && selected.options.length > 0 && (
              <Field label="Preparo">
                <select
                  value={option}
                  onChange={(e) => setOption(e.target.value)}
                >
                  {selected.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                      {o.fee_per_kg ? ` (+${brl(o.fee_per_kg)})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Quantidade">
              <input
                type="number"
                min={selected.min_quantity || 1}
                max={999}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(
                      selected.min_quantity || 1,
                      Math.min(999, Math.trunc(Number(e.target.value))),
                    ),
                  )
                }
              />
            </Field>
            <Field label="Observações (opcional)">
              <textarea
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: retirar a cebola"
              />
            </Field>
            <button className="button primary wide" onClick={add}>
              Adicionar · {draft && brl(subtotal(draft))}
            </button>
          </section>
        </div>
      )}
    </>
  );
}
export function CartPage() {
  const { cart, setCart, total, requireLogin } = useApp();
  if (!cart.length)
    return (
      <Empty title="Seu carrinho está vazio">
        <Link href="/">Encontre uma loja para começar.</Link>
      </Empty>
    );
  return (
    <section className="narrow">
      <h1>Seu carrinho</h1>
      <Link href={`/loja/${cart[0].business_slug}`} className="text-link">
        Voltar ao cardápio
      </Link>
      <div className="panel">
        {cart.map((i) => (
          <div key={i.key} className="cart-row">
            <Photo src={i.product.image_url} alt={i.product.name} />
            <div>
              <h3>{i.product.name}</h3>
              {i.notes && <p>{i.notes}</p>}
              <strong>{brl(subtotal(i))}</strong>
              <div className="quantity">
                <button
                  aria-label={`Diminuir ${i.product.name}`}
                  onClick={() =>
                    setCart(
                      cart.flatMap((x) =>
                        x.key === i.key
                          ? x.quantity > (x.product.min_quantity || 1)
                            ? [{ ...x, quantity: x.quantity - 1 }]
                            : []
                          : [x],
                      ),
                    )
                  }
                >
                  −
                </button>
                <span>{i.quantity}</span>
                <button
                  aria-label={`Aumentar ${i.product.name}`}
                  onClick={() =>
                    setCart(
                      cart.map((x) =>
                        x.key === i.key
                          ? { ...x, quantity: Math.min(999, x.quantity + 1) }
                          : x,
                      ),
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>
            <button
              className="text-button"
              onClick={() => setCart(cart.filter((x) => x.key !== i.key))}
              aria-label={`Remover ${i.product.name}`}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        ))}
        <div className="total">
          <span>Subtotal</span>
          <strong>{brl(total)}</strong>
        </div>
        <p>
          Entrega calculada na próxima etapa. Preços e disponibilidade serão
          conferidos ao finalizar.
        </p>
        {cart.some((i) => i.product.sale_mode === "KG") && (
          <p>
            Produtos por kg usam o peso médio para estimar o valor. A loja
            confirma a pesagem.
          </p>
        )}
        <button
          className="button primary wide"
          onClick={() => requireLogin("/finalizar") && navigate("/finalizar")}
        >
          Continuar pedido
        </button>
      </div>
    </section>
  );
}
export function Checkout() {
  const { cart, setCart, total, requireLogin, profile } = useApp();
  const [addresses, setAddresses] = useState<Address[]>([]),
    [address, setAddress] = useState(""),
    [receiving, setReceiving] = useState("pickup"),
    [payment, setPayment] = useState("Pix"),
    [business, setBusiness] = useState<Business | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notes, setNotes] = useState("");
  const [key] = useState(() => {
    const stored = sessionStorage.getItem("norieco-checkout-key");
    const k = stored || crypto.randomUUID();
    sessionStorage.setItem("norieco-checkout-key", k);
    return k;
  });
  useEffect(() => {
    if (!requireLogin("/finalizar")) return;
    rpc<Address[]>("marketplace_addresses")
      .then(setAddresses)
      .catch((e) => setError(e.message));
    if (cart[0])
      rpc<{ business: Business }>("marketplace_business", {
        p_slug: cart[0].business_slug,
      })
        .then((d) => setBusiness(d.business))
        .catch((e) => setError(e.message));
  }, []);
  if (!cart.length)
    return (
      <Empty title="Carrinho vazio">
        <Link href="/">Explorar lojas</Link>
      </Empty>
    );
  const fee =
    receiving === "delivery" ? Number(business?.delivery_fee || 0) : 0;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin("/finalizar")) return;
    setBusy(true);
    setError("");
    try {
      const result = await rpc<{ id: string }>("marketplace_checkout", {
        p_slug: cart[0].business_slug,
        p_key: key,
        p_expected_total: total + fee,
        p_items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          preparationId: i.option_id,
          notes: i.notes,
        })),
        p_receiving: receiving,
        p_address: receiving === "delivery" ? address : null,
        p_payment: payment,
        p_notes: notes,
      });
      setCart([]);
      sessionStorage.removeItem("norieco-checkout-key");
      navigate(`/conta/pedidos?pedido=${result.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="narrow" onSubmit={submit}>
      <h1>Revisar pedido</h1>
      {error && <Notice error>{error}</Notice>}
      <div className="panel">
        <h2>{business?.name || "Sua compra"}</h2>
        <p>Pedido de {profile?.full_name}</p>
        <Field label="Como deseja receber?">
          <select
            value={receiving}
            onChange={(e) => setReceiving(e.target.value)}
          >
            <option value="pickup">Retirada na loja</option>
            {business?.accepts_delivery && (
              <option value="delivery">Entrega</option>
            )}
          </select>
        </Field>
        {receiving === "delivery" && (
          <>
            <Field label="Endereço de entrega">
              <select
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              >
                <option value="">Selecione um endereço</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}: {a.street}, {a.number} · {a.neighborhood}
                  </option>
                ))}
              </select>
            </Field>
            <Link
              className="text-link"
              href="/conta/enderecos?voltar=finalizar"
            >
              Adicionar endereço
            </Link>
            <p>
              A loja confirmará a área atendida. Não é calculada uma distância
              estimada.
            </p>
          </>
        )}
        <Field label="Forma de pagamento">
          <select value={payment} onChange={(e) => setPayment(e.target.value)}>
            {["Pix", "Dinheiro", "Cartão na entrega/retirada"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <p>
          Pagamento combinado com a loja. A NoriEco não realiza cobranças
          online.
        </p>
        <Field label="Observações do pedido (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
          />
        </Field>
        <hr />
        {cart.map((i) => (
          <p className="summary-row" key={i.key}>
            <span>
              {i.quantity} × {i.product.name}
            </span>
            <strong>{brl(subtotal(i))}</strong>
          </p>
        ))}
        <p className="summary-row">
          <span>Entrega</span>
          <span>{receiving === "pickup" ? "Retirada sem taxa" : brl(fee)}</span>
        </p>
        <div className="total">
          <strong>Total</strong>
          <strong>{brl(total + fee)}</strong>
        </div>
        <button
          className="button primary wide"
          disabled={busy || !business?.is_open}
        >
          {busy
            ? "Enviando pedido…"
            : business && !business.is_open
              ? "Loja fechada"
              : `Confirmar pedido · ${brl(total + fee)}`}
        </button>
      </div>
    </form>
  );
}
