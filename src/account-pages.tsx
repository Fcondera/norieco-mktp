import { useEffect, useState, type FormEvent } from "react";
import { rpc, supabase } from "./lib/api";
import { Link, navigate } from "./lib/router";
import { brl, orderStatus, safeReturn, safeImage } from "./lib/core.mjs";
import type { Address, Business, Order, Review } from "./lib/types";
import { useApp } from "./state";
import {ManagementLink} from './management-link';
import { BusinessCard, Empty, Field, Loading, Notice } from "./ui";
export function Login() {
  const { user, profile, authLoading } = useApp();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!authLoading && user)
      navigate(
        profile?.completed_at
          ? safeReturn(sessionStorage.getItem("norieco-return"))
          : "/primeiro-acesso",
      );
  }, [authLoading, user, profile]);
  const login = async () => {
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  };
  return (
    <section className="auth-card panel">
      <img
        className="auth-logo"
        src={`${import.meta.env.BASE_URL}nori-logo.png`}
        alt="NoriEco"
      />
      <h1>Que bom ter você por aqui.</h1>
      <p>
        Entre para finalizar sua compra e acompanhar seus pedidos. Você pode
        continuar explorando sem cadastro.
      </p>
      {error && <Notice error>{error}</Notice>}
      <button className="button google wide" disabled={busy} onClick={login}>
        <span aria-hidden="true">G</span>
        {busy ? "Conectando…" : "Continuar com Google"}
      </button>
      <p>
        <small>
          Ao continuar, consulte nossos{" "}
          <Link href="/termos">Termos de uso</Link> e a{" "}
          <Link href="/privacidade">Política de privacidade</Link>.
        </small>
      </p>
      <Link href="/" className="text-link">
        Continuar explorando
      </Link>
      <ManagementLink className="text-link">Criar loja e testar o Gestão por 15 dias</ManagementLink>
    </section>
  );
}
export function AuthCallback() {
  const { user, profile, authLoading } = useApp();
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("error_description"))
      setError(params.get("error_description")!);
    const timer = setTimeout(() => {
      if (!user)
        setError("Não foi possível concluir o acesso. Tente entrar novamente.");
    }, 15000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!authLoading && user)
      navigate(
        profile?.completed_at
          ? safeReturn(sessionStorage.getItem("norieco-return"))
          : "/primeiro-acesso",
      );
  }, [user, profile, authLoading]);
  return error ? (
    <Notice error>
      {error} <Link href="/entrar">Voltar ao acesso</Link>
    </Notice>
  ) : (
    <Loading />
  );
}
export function ProfileForm({ onboarding = false }: { onboarding?: boolean }) {
  const { user, profile, refreshProfile } = useApp();
  const [name, setName] = useState(
      profile?.full_name || user?.user_metadata.full_name || "",
    ),
    [phone, setPhone] = useState(profile?.whatsapp || ""),
    [city, setCity] = useState(profile?.city || ""),
    [neighborhood, setNeighborhood] = useState(profile?.neighborhood || ""),
    [terms, setTerms] = useState(Boolean(profile?.completed_at)),
    [news, setNews] = useState(
      profile?.notification_preferences?.news || false,
    ),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await rpc("marketplace_save_profile", {
        p_data: {
          full_name: name,
          whatsapp: phone,
          city,
          state: "AM",
          neighborhood,
          terms,
          notification_preferences: { orders: true, news },
        },
      });
      await refreshProfile();
      if (onboarding) {
        const back = safeReturn(sessionStorage.getItem("norieco-return"));
        sessionStorage.removeItem("norieco-return");
        navigate(back);
      } else setMessage("Seus dados foram atualizados.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="panel form-stack" onSubmit={save}>
      {onboarding && (
        <>
          <span className="eyebrow">PRIMEIRO ACESSO · ÚLTIMA ETAPA</span>
          <h1>Falta só conhecer você.</h1>
          <p>
            Confira seus dados. O endereço completo pode ficar para a primeira
            entrega.
          </p>
        </>
      )}
      {safeImage(profile?.avatar_url || user?.user_metadata.avatar_url) && (
        <img
          className="avatar large"
          src={profile?.avatar_url || user?.user_metadata.avatar_url}
          alt="Sua foto do Google"
        />
      )}
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <Field label="Nome completo">
        <input
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={3}
          maxLength={120}
        />
      </Field>
      <Field label="WhatsApp com DDD">
        <input
          autoComplete="tel"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          maxLength={20}
          placeholder="(92) 99999-9999"
        />
      </Field>
      <div className="form-grid">
        <Field label="Cidade">
          <input
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            maxLength={80}
          />
        </Field>
        <Field label="Estado">
          <select value="AM" onChange={() => {}}>
            <option value="AM">Amazonas</option>
          </select>
        </Field>
      </div>
      <Field label="Bairro">
        <input
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          required
          maxLength={100}
        />
      </Field>
      <label className="check">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          required
        />
        Li e aceito os <Link href="/termos">Termos de uso</Link> e a{" "}
        <Link href="/privacidade">Política de privacidade</Link>.
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={news}
          onChange={(e) => setNews(e.target.checked)}
        />
        Quero receber novidades da NoriEco (opcional).
      </label>
      <button className="button primary" disabled={busy}>
        {busy
          ? "Salvando…"
          : onboarding
            ? "Concluir cadastro"
            : "Salvar alterações"}
      </button>
    </form>
  );
}
export function Account({ tab }: { tab: string }) {
  const { profile, logout } = useApp();
  const [hasBusiness, setHasBusiness] = useState(false);
  useEffect(() => {
    rpc<unknown[]>("marketplace_my_businesses")
      .then((rows) => setHasBusiness(rows.length > 0))
      .catch(() => setHasBusiness(false));
  }, []);
  const links = [
    ["", "Visão geral"],
    ["dados", "Meus dados"],
    ["enderecos", "Endereços"],
    ["pedidos", "Pedidos"],
    ["favoritos", "Favoritos"],
    ["avaliacoes", "Avaliações"],
    ["preferencias", "Notificações"],
  ];
  return (
    <div className="account-layout">
      <aside>
        <h2>Minhas compras</h2>
        <nav className="account-nav">
          <ManagementLink>Acessar Nori Gestão ↗</ManagementLink>
          {links.map(([key, name]) => (
            <Link
              key={key}
              className={tab === key ? "active" : ""}
              href={`/conta/${key || "compras"}`}
            >
              {name}
            </Link>
          ))}
          <button onClick={logout}>Sair da conta</button>
        </nav>
      </aside>
      <section className="account-content">
        {!tab ? (
          <>
            <h1>Olá, {profile?.full_name.split(" ")[0]}.</h1>
            <p>Seus pedidos e lugares favoritos, sempre por perto.</p>
            <ManagementLink className="button primary">Acessar Nori Gestão</ManagementLink>
            <div className="details-grid">
              <Link className="panel" href="/conta/pedidos">
                <h3>Meus pedidos →</h3>
                <p>Acompanhe suas compras.</p>
              </Link>
              <Link className="panel" href="/conta/favoritos">
                <h3>Favoritos →</h3>
                <p>Volte aos lugares de que gosta.</p>
              </Link>
            </div>
            {hasBusiness && (
              <Link className="text-link" href="/empresa">
                Área da minha empresa
              </Link>
            )}
            {profile?.is_admin && (
              <p>
                <Link className="text-link" href="/administracao">
                  Administração NoriEco
                </Link>
              </p>
            )}
          </>
        ) : tab === "dados" || tab === "preferencias" ? (
          <>
            <h1>
              {tab === "dados" ? "Meus dados" : "Preferências de contato"}
            </h1>
            <ProfileForm />
          </>
        ) : tab === "enderecos" ? (
          <Addresses />
        ) : tab === "pedidos" ? (
          <Orders />
        ) : tab === "favoritos" ? (
          <Favorites />
        ) : tab === "avaliacoes" || tab === "denunciar" ? (
          <Feedback report={tab === "denunciar"} />
        ) : (
          <Empty title="Página não encontrada" />
        )}
      </section>
    </div>
  );
}
const blankAddress = {
  label: "Casa",
  recipient: "",
  postal_code: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "AM",
  reference: "",
};
function Addresses() {
  const [rows, setRows] = useState<Address[]>([]),
    [form, setForm] = useState<Record<string, string> | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = () =>
    rpc<Address[]>("marketplace_addresses")
      .then(setRows)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await rpc("marketplace_save_address", { p_data: form });
      setForm(null);
      await load();
      if (new URLSearchParams(location.search).get("voltar") === "finalizar")
        navigate("/finalizar");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="section-heading">
        <h1>Endereços</h1>
        <button
          className="button primary"
          onClick={() => setForm(blankAddress)}
        >
          Adicionar endereço
        </button>
      </div>
      {error && <Notice error>{error}</Notice>}
      {form ? (
        <form className="panel" onSubmit={save}>
          <div className="form-grid">
            {[
              ["label", "Nome do endereço"],
              ["recipient", "Quem recebe"],
              ["postal_code", "CEP"],
              ["street", "Rua"],
              ["number", "Número"],
              ["complement", "Complemento (opcional)"],
              ["neighborhood", "Bairro"],
              ["city", "Cidade"],
              ["reference", "Referência (opcional)"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  value={form[key] || ""}
                  required={!["complement", "reference"].includes(key)}
                  maxLength={160}
                  inputMode={key === "postal_code" ? "numeric" : "text"}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          <p>Estado: Amazonas. Confira o CEP e os dados antes de salvar.</p>
          <div className="actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => setForm(null)}
            >
              Cancelar
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? "Salvando…" : "Salvar endereço"}
            </button>
          </div>
        </form>
      ) : (
        rows.map((a) => (
          <article className="panel address" key={a.id}>
            <h3>{a.label}</h3>
            <p>
              {a.street}, {a.number} · {a.neighborhood}
              <br />
              {a.city}/{a.state} · {a.postal_code}
            </p>
            <div className="actions">
              <button className="text-button" onClick={() => setForm({ ...a })}>
                Editar
              </button>
              <button
                className="text-button danger"
                onClick={async () => {
                  if (confirm("Excluir este endereço?"))
                    try {
                      await rpc("marketplace_delete_address", { p_id: a.id });
                      load();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                }}
              >
                Excluir
              </button>
            </div>
          </article>
        ))
      )}
      {!form && !rows.length && (
        <Empty title="Nenhum endereço salvo">
          Adicione quando precisar de uma entrega.
        </Empty>
      )}
    </>
  );
}
function Orders() {
  const [rows, setRows] = useState<Order[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = () =>
      rpc<Order[]>("marketplace_my_orders")
        .then((d) => active && setRows(d))
        .catch((e) => active && setError(e.message))
        .finally(() => active && setLoading(false));
    load();
    const timer = setInterval(load, 20000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  return (
    <>
      <h1>Meus pedidos</h1>
      {error && <Notice error>{error}</Notice>}
      {loading ? (
        <Loading />
      ) : !rows.length ? (
        <Empty title="Você ainda não fez pedidos">
          <Link href="/">Descubra uma loja para começar.</Link>
        </Empty>
      ) : (
        rows.map((o) => (
          <article className="panel order-card" key={o.id}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">{o.number}</span>
                <h3>{o.business_name}</h3>
              </div>
              <span className="status">
                {orderStatus[o.status] || "Em acompanhamento"}
              </span>
            </div>
            <p>
              {new Date(o.created_at).toLocaleString("pt-BR")} ·{" "}
              {o.receiving_type}
            </p>
            {o.items?.map((i, index) => (
              <p className="summary-row" key={index}>
                <span>
                  {i.quantity} × {i.product_name}
                </span>
                <span>{brl(i.subtotal)}</span>
              </p>
            ))}
            <div className="total">
              <span>Total</span>
              <strong>{brl(o.total)}</strong>
            </div>
            <Link className="text-link" href={`/loja/${o.business_slug}`}>
              Ver loja
            </Link>
          </article>
        ))
      )}
    </>
  );
}
function Favorites() {
  const [rows, setRows] = useState<Business[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    rpc<Business[]>("marketplace_favorites")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <h1>Favoritos</h1>
      {error && <Notice error>{error}</Notice>}
      <div className="business-grid">
        {rows.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </div>
      {!rows.length && (
        <Empty title="Seus favoritos ficam aqui">
          Toque em Salvar no perfil de uma empresa.
        </Empty>
      )}
    </>
  );
}
function Feedback({ report }: { report: boolean }) {
  const [rows, setRows] = useState<Review[]>([]),
    [body, setBody] = useState(""),
    [rating, setRating] = useState(5),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const business = new URLSearchParams(location.search).get("loja");
  useEffect(() => {
    if (!report)
      rpc<Review[]>("marketplace_my_reviews")
        .then(setRows)
        .catch((e) => setError(e.message));
  }, [report]);
  const send = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await rpc(report ? "marketplace_report" : "marketplace_review", {
        p_business: business,
        p_body: body,
        ...(report ? {} : { p_rating: rating }),
      });
      setBody("");
      setMessage(
        report ? "Recebemos seu relato." : "Avaliação enviada para moderação.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <>
      <h1>{report ? "Reportar um problema" : "Avaliações"}</h1>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      {business && (
        <form className="panel" onSubmit={send}>
          {!report && (
            <Field label="Sua nota">
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} estrelas
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field
            label={report ? "O que aconteceu?" : "Como foi sua experiência?"}
          >
            <textarea
              required
              minLength={10}
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <button className="button primary">Enviar</button>
        </form>
      )}
      {!report &&
        rows.map((r) => (
          <article className="panel" key={r.id}>
            <strong>{r.rating} ★</strong>
            <p>{r.body}</p>
            <small>
              {r.status === "PUBLISHED"
                ? "Publicada"
                : r.status === "REJECTED"
                  ? "Não publicada"
                  : "Em análise"}
            </small>
          </article>
        ))}
      {!report && !rows.length && !business && (
        <Empty title="Conte sua experiência">
          Abra o perfil de uma empresa para avaliar.
        </Empty>
      )}
    </>
  );
}
