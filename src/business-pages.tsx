import { useEffect, useState, type FormEvent } from "react";
import { rpc, upload, supabase } from "./lib/api";
import { Link, navigate } from "./lib/router";
import type { Category, OwnBusiness, Hours } from "./lib/types";
import { brl, verificationStatus } from "./lib/core.mjs";
import { Empty, Field, Loading, Notice } from "./ui";
import { ManagementLink } from "./management-link";
const defaultHours: Hours = Array.from({ length: 7 }, (_, day) => ({
  day,
  enabled: day !== 0,
  open: "08:00",
  close: "18:00",
}));
const labels: Record<string, string> = {
  CONNECTED: "Conectada",
  REQUESTED: "Solicitada",
  NONE: "Não solicitada",
  PENDING: "Em análise",
  PUBLISHED: "Publicada",
  REJECTED: "Reprovada",
  OPEN: "Em aberto",
  RESOLVED: "Resolvida",
  approve: "Empresa aprovada",
  reject: "Empresa reprovada",
  suspend: "Empresa suspensa",
  feature: "Destaque alterado",
  category: "Categoria alterada",
  review_publish: "Avaliação publicada",
  review_reject: "Avaliação não publicada",
  report_resolve: "Denúncia resolvida",
  INTEGRATION_REQUESTED: "Integração solicitada",
  ACCESS_GRANTED: "Acesso concedido",
  ACCESS_CHANGED: "Acesso alterado",
  ACCESS_REVOKED: "Acesso revogado",
};
export function BusinessDashboard({
  register = false,
}: {
  register?: boolean;
}) {
  const [rows, setRows] = useState<OwnBusiness[]>([]),
    [form, setForm] = useState<Partial<OwnBusiness> | null>(null),
    [categories, setCategories] = useState<Category[]>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [files, setFiles] = useState<Record<string, File>>({});
  const load = () =>
    rpc<OwnBusiness[]>("marketplace_my_businesses")
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
    rpc<Category[]>("marketplace_categories")
      .then(setCategories)
      .catch((e) => setError(e.message));
    if (register)
      setForm({
        name: "",
        listing_type: "STANDARD",
        state: "AM",
        opening_hours: defaultHours,
        timezone: "America/Manaus",
        is_open: false,
      });
  }, []);
  const change = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let data = { ...form };
      const draft = await rpc<{ id: string }>("marketplace_save_business", {
        p_data: data,
        p_submit: false,
      });
      data.id = draft.id;
      setForm(data);
      for (const [kind, file] of Object.entries(files)) {
        const path = await upload(file, draft.id, kind);
        data[
          kind === "identity"
            ? "identity_path"
            : kind === "proof"
              ? "proof_path"
              : kind === "logo"
                ? "logo_url"
                : "cover_url"
        ] = path;
      }
      await rpc("marketplace_save_business", { p_data: data, p_submit: true });
      setForm(null);
      setFiles({});
      setMessage(
        "Cadastro enviado para análise. Sua empresa fica oculta até a aprovação.",
      );
      await load();
      navigate("/empresa");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <Loading />;
  return (
    <section className={form ? "narrow wide-form" : ""}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">PARA QUEM EMPREENDE</span>
          <h1>
            {form
              ? form.id
                ? "Editar empresa"
                : "Cadastrar minha empresa"
              : "Minha empresa"}
          </h1>
        </div>
        {!form && (
          <Link href="/cadastrar-empresa" className="button primary">
            Cadastrar empresa
          </Link>
        )}
      </div>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      {form ? (
        <form className="form-stack" onSubmit={save}>
          <section className="panel">
            <h2>1. Seu negócio</h2>
            <p>O cadastro é analisado antes de aparecer na NoriEco.</p>
            <div className="form-grid">
              {[
                ["name", "Nome da empresa"],
                ["whatsapp", "WhatsApp com DDD"],
                ["email", "E-mail comercial"],
                ["city", "Cidade"],
                ["neighborhood", "Bairro"],
                ["address", "Endereço completo"],
                ["instagram", "Instagram (URL, opcional)"],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    required={key !== "instagram"}
                    type={
                      key === "email"
                        ? "email"
                        : key === "instagram"
                          ? "url"
                          : "text"
                    }
                    value={String(form[key as keyof OwnBusiness] || "")}
                    onChange={(e) => change(key, e.target.value)}
                    maxLength={key === "address" ? 240 : 120}
                  />
                </Field>
              ))}
              <Field label="Categoria">
                <select
                  required
                  value={form.category_id || ""}
                  onChange={(e) => change("category_id", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo de perfil">
                <select
                  value={form.listing_type || "STANDARD"}
                  disabled={Boolean(form.id)}
                  onChange={(e) => change("listing_type", e.target.value)}
                >
                  <option value="STANDARD">Perfil com WhatsApp</option>
                  <option value="INTEGRATED">
                    Loja integrada ao Nori Gestão
                  </option>
                </select>
              </Field>
              <Field label="Fuso horário">
                <select
                  value={form.timezone || "America/Manaus"}
                  onChange={(e) => change("timezone", e.target.value)}
                >
                  <option value="America/Manaus">Manaus (UTC−4)</option>
                  <option value="America/Eirunepe">
                    Oeste do Amazonas (UTC−5)
                  </option>
                </select>
              </Field>
            </div>
            <Field label="Descrição curta">
              <textarea
                required
                minLength={10}
                maxLength={500}
                value={form.description || ""}
                onChange={(e) => change("description", e.target.value)}
              />
            </Field>
          </section>
          <section className="panel">
            <h2>2. Imagens e horários</h2>
            <div className="form-grid">
              {[
                ["logo", "Logo"],
                ["cover", "Imagem de capa"],
              ].map(([kind, label]) => (
                <Field
                  key={kind}
                  label={label}
                  hint="JPG, PNG ou WebP. Até 5 MB."
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      setFiles({ ...files, [kind]: e.target.files[0] })
                    }
                  />
                </Field>
              ))}
            </div>
            <HoursEditor
              value={form.opening_hours || defaultHours}
              onChange={(h) => change("opening_hours", h)}
            />
            {form.listing_type === "STANDARD" && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={form.is_open || false}
                  onChange={(e) => change("is_open", e.target.checked)}
                />
                Aceitar contatos como aberto dentro dos horários acima
              </label>
            )}
            <p>
              Nas lojas integradas, o cardápio, estoque e atendimento são
              controlados pelo Nori Gestão.
            </p>
          </section>
          <section className="panel">
            <h2>3. Verificação</h2>
            <p>
              Documentos são privados. Apenas você e a equipe responsável pela
              análise podem acessá-los.
            </p>
            <div className="form-grid">
              {[
                ["legal_name", "Nome do responsável legal"],
                ["cpf", "CPF do responsável"],
                ["cnpj", "CNPJ (se houver)"],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    required={key !== "cnpj"}
                    value={String(form[key as keyof OwnBusiness] || "")}
                    onChange={(e) => change(key, e.target.value)}
                    maxLength={120}
                  />
                </Field>
              ))}
              {[
                ["identity", "Documento de identidade"],
                ["proof", "Registro ou comprovante de atividade"],
              ].map(([kind, label]) => (
                <Field
                  key={kind}
                  label={label}
                  hint="JPG, PNG ou PDF. Até 5 MB."
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    required={
                      !form[
                        kind === "identity" ? "identity_path" : "proof_path"
                      ]
                    }
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      setFiles({ ...files, [kind]: e.target.files[0] })
                    }
                  />
                </Field>
              ))}
            </div>
            <label className="check">
              <input type="checkbox" required />
              Confirmo que os dados são verdadeiros e que estou autorizado a
              representar esta empresa.
            </label>
          </section>
          <div className="actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setForm(null);
                navigate("/empresa");
              }}
            >
              Cancelar
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? "Enviando com segurança…" : "Enviar para análise"}
            </button>
          </div>
        </form>
      ) : !rows.length ? (
        <Empty title="Sua empresa pode estar aqui">
          Cadastre seu negócio para começar. Seu perfil de cliente permanece
          separado.
        </Empty>
      ) : (
        rows.map((b) => (
          <article className="panel business-dashboard" key={b.id}>
            <div className="section-heading">
              <h2>{b.name}</h2>
              <span className="status">
                {verificationStatus[b.verification_status] || "Em análise"}
              </span>
            </div>
            {b.rejection_reason && <Notice error>{b.rejection_reason}</Notice>}
            <p>
              {b.city}/{b.state} ·{" "}
              {b.listing_type === "INTEGRATED"
                ? "Integração Nori Gestão"
                : "Perfil com WhatsApp"}
            </p>
            <p>
              Cliques no WhatsApp: <strong>{b.leads_count}</strong>
            </p>
            <div className="actions">
              <button
                className="button secondary"
                onClick={() => {
                  setForm(b);
                  setFiles({});
                }}
              >
                Editar perfil
              </button>
              {b.verification_status === "VERIFIED" && (
                <Link className="button secondary" href={`/loja/${b.slug}`}>
                  Ver perfil público
                </Link>
              )}
              {b.listing_type === "INTEGRATED" ? (
                <ManagementLink className="button primary">
                  Acessar Nori Gestão ↗
                </ManagementLink>
              ) : (
                <button
                  className="button secondary"
                  onClick={async () => {
                    try {
                      await rpc("marketplace_request_integration", {
                        p_business: b.id,
                      });
                      setMessage("Solicitação de integração enviada.");
                      load();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Solicitar integração
                </button>
              )}
            </div>
            <p>
              <small>
                Integração:{" "}
                {b.integration_status === "CONNECTED"
                  ? "Conectada"
                  : b.integration_status === "REQUESTED"
                    ? "Solicitada"
                    : "Não solicitada"}
              </small>
            </p>
            {b.listing_type === "STANDARD" && (
              <Services business={b} onSaved={load} />
            )}
          </article>
        ))
      )}
    </section>
  );
}
export function HoursEditor({
  value,
  onChange,
}: {
  value: Hours;
  onChange: (hours: Hours) => void;
}) {
  return (
    <div className="hours">
      {value.map((h, index) => (
        <div className="hours-row" key={h.day}>
          <label className="check">
            <input
              type="checkbox"
              checked={h.enabled}
              onChange={(e) =>
                onChange(
                  value.map((v, i) =>
                    i === index ? { ...v, enabled: e.target.checked } : v,
                  ),
                )
              }
            />
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
            }
          </label>
          <input
            aria-label={`Abre ${h.day}`}
            type="time"
            value={h.open}
            disabled={!h.enabled}
            onChange={(e) =>
              onChange(
                value.map((v, i) =>
                  i === index ? { ...v, open: e.target.value } : v,
                ),
              )
            }
          />
          <span>até</span>
          <input
            aria-label={`Fecha ${h.day}`}
            type="time"
            value={h.close}
            disabled={!h.enabled}
            onChange={(e) =>
              onChange(
                value.map((v, i) =>
                  i === index ? { ...v, close: e.target.value } : v,
                ),
              )
            }
          />
        </div>
      ))}
    </div>
  );
}
function Services({
  business,
  onSaved,
}: {
  business: OwnBusiness;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [message, setMessage] = useState("");
  return (
    <details>
      <summary>Gerenciar serviços</summary>
      {business.services?.map((s) => (
        <p key={s.id}>
          {s.name}{" "}
          <button
            className="text-button danger"
            onClick={async () => {
              if (confirm("Excluir este serviço?"))
                try {
                  await rpc("marketplace_save_service", {
                    p_business: business.id,
                    p_data: { id: s.id },
                    p_delete: true,
                  });
                  setMessage("Serviço excluído.");
                  await onSaved();
                } catch (e) {
                  setMessage((e as Error).message);
                }
            }}
          >
            Excluir
          </button>
        </p>
      ))}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await rpc("marketplace_save_service", {
              p_business: business.id,
              p_data: { name, description },
              p_delete: false,
            });
            setName("");
            setDescription("");
            setMessage("Serviço salvo.");
            await onSaved();
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        <Field label="Nome do serviço">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </Field>
        <Field label="Descrição">
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </Field>
        <button className="button secondary">Salvar serviço</button>
      </form>
      {message && <Notice>{message}</Notice>}
    </details>
  );
}
type AdminData = {
  businesses: (OwnBusiness & { tenant_id: string | null })[];
  reviews: { id: string; body: string; rating: number; status: string }[];
  reports: { id: string; body: string; status: string }[];
  orders: {
    id: string;
    business_name: string;
    number: string;
    total: number;
    created_at: string;
  }[];
  categories: Category[];
  tenants: { id: string; name: string }[];
  audit: { id: string; action: string; created_at: string }[];
};
export function Administration() {
  const [data, setData] = useState<AdminData | null>(null),
    [tab, setTab] = useState("businesses"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reasons, setReasons] = useState<Record<string, string>>({}),
    [publicationCategories, setPublicationCategories] = useState<Record<string, string>>({}),
    [tenants, setTenants] = useState<Record<string, string>>({});
  const load = () =>
    rpc<AdminData>("marketplace_admin_data")
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const act = async (
    action: string,
    id: string,
    payload: Record<string, unknown> = {},
  ) => {
    setBusy(true);
    try {
      await rpc("marketplace_admin_action", {
        p_action: action,
        p_id: id,
        p_data: payload,
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const doc = async (path: string) => {
    const w = window.open("about:blank", "_blank");
    if (w) w.opener = null;
    const { data, error } = await supabase.storage
      .from("marketplace-verifications")
      .createSignedUrl(path, 60);
    if (error || !data) {
      w?.close();
      setError("Não foi possível abrir o documento privado.");
    } else if (w) w.location.href = data.signedUrl;
  };
  const publishPdv = async (b: AdminData['businesses'][number]) => {
    if (!confirm(`Publicar ${b.name} com os produtos do PDV, sem conceder selo documental?`)) return;
    setBusy(true);
    setError("");
    try {
      await rpc("marketplace_publish_pdv", {p_business:b.id,p_category:publicationCategories[b.id] || b.category_id});
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  if (!data) return error ? <Notice error>{error}</Notice> : <Loading />;
  return (
    <>
      <h1>Administração NoriEco</h1>
      <p>Ações de verificação e moderação ficam registradas na auditoria.</p>
      {error && <Notice error>{error}</Notice>}
      <nav className="tabs">
        {[
          ["businesses", "Empresas"],
          ["categories", "Categorias"],
          ["reviews", "Avaliações"],
          ["reports", "Denúncias"],
          ["orders", "Pedidos"],
          ["audit", "Auditoria"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "businesses"
        ? data.businesses.map((b) => (
            <article key={b.id} className="panel">
              <div className="section-heading">
                <h2>{b.name}</h2>
                <span className="status">
                  {verificationStatus[b.verification_status]}
                </span>
              </div>
              <p>
                {b.city} ·{" "}
                {b.listing_type === "INTEGRATED" ? "Integrada" : "WhatsApp"} ·{" "}
                {labels[b.integration_status] || "Em análise"}
              </p>
              <p>
                Responsável: {b.legal_name} · CPF: {b.cpf}{" "}
                {b.cnpj && `· CNPJ: ${b.cnpj}`}
              </p>
              <div className="actions">
                {b.identity_path && (
                  <button
                    className="button secondary"
                    onClick={() => doc(b.identity_path)}
                  >
                    Ver identidade
                  </button>
                )}
                {b.proof_path && (
                  <button
                    className="button secondary"
                    onClick={() => doc(b.proof_path)}
                  >
                    Ver atividade
                  </button>
                )}
              </div>
              {(b.listing_type === "INTEGRATED" ||
                b.integration_status === "REQUESTED") && (
                <Field label="Empresa no Nori Gestão (confira antes de vincular)">
                  <select
                    value={tenants[b.id] ?? b.tenant_id ?? ""}
                    onChange={(e) =>
                      setTenants({ ...tenants, [b.id]: e.target.value })
                    }
                  >
                    <option value="">Selecionar empresa</option>
                    {data.tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {b.listing_type === "INTEGRATED" && b.tenant_id && <Field label="Categoria no marketplace">
                <select value={publicationCategories[b.id] || b.category_id} onChange={e => setPublicationCategories({...publicationCategories,[b.id]:e.target.value})}>
                  {data.categories.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>}
              <Field label="Motivo da decisão (obrigatório para reprovar ou suspender)">
                <input
                  maxLength={500}
                  value={reasons[b.id] || ""}
                  onChange={(e) =>
                    setReasons({ ...reasons, [b.id]: e.target.value })
                  }
                />
              </Field>
              <div className="actions">
                {b.listing_type === "INTEGRATED" && b.tenant_id && <button disabled={busy || b.verification_status === 'SUSPENDED' || b.verification_status === 'REJECTED'} className="button secondary" onClick={() => publishPdv(b)}>Publicar loja do PDV sem selo documental</button>}
                <button
                  disabled={busy}
                  className="button primary"
                  onClick={() =>
                    confirm(
                      `Aprovar ${b.name} e publicar seus dados comerciais?`,
                    ) &&
                    act("approve", b.id, {
                      reason: reasons[b.id],
                      tenant_id: tenants[b.id] ?? b.tenant_id,
                    })
                  }
                >
                  Aprovar documentação
                </button>
                <button
                  disabled={busy}
                  className="button secondary"
                  onClick={() => act("reject", b.id, { reason: reasons[b.id] })}
                >
                  Reprovar
                </button>
                <button
                  disabled={busy}
                  className="button secondary danger"
                  onClick={() =>
                    confirm(`Suspender ${b.name}?`) &&
                    act("suspend", b.id, { reason: reasons[b.id] })
                  }
                >
                  Suspender
                </button>
                <button
                  disabled={busy}
                  className="button secondary"
                  onClick={() => act("feature", b.id)}
                >
                  Alternar destaque
                </button>
              </div>
            </article>
          ))
        : tab === "categories"
          ? data.categories.map((c) => (
              <article className="panel summary-row" key={c.id}>
                <strong>{c.name}</strong>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => act("category", c.id, { active: !c.active })}
                >
                  {c.active ? "Desativar" : "Ativar"}
                </button>
              </article>
            ))
          : tab === "reviews"
            ? data.reviews.map((r) => (
                <article className="panel" key={r.id}>
                  <strong>
                    {r.rating} ★ · {labels[r.status] || "Em análise"}
                  </strong>
                  <p>{r.body}</p>
                  <div className="actions">
                    <button
                      className="button primary"
                      disabled={busy}
                      onClick={() => act("review_publish", r.id)}
                    >
                      Publicar
                    </button>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => act("review_reject", r.id)}
                    >
                      Rejeitar
                    </button>
                  </div>
                </article>
              ))
            : tab === "reports"
              ? data.reports.map((r) => (
                  <article className="panel" key={r.id}>
                    <p>{r.body}</p>
                    <span>{labels[r.status] || "Em análise"}</span>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => act("report_resolve", r.id)}
                    >
                      Marcar resolvida
                    </button>
                  </article>
                ))
              : tab === "orders"
                ? data.orders.map((o) => (
                    <article className="panel" key={o.id}>
                      <h3>
                        {o.business_name} · {o.number}
                      </h3>
                      <p>
                        {brl(o.total)} ·{" "}
                        {new Date(o.created_at).toLocaleString("pt-BR")}
                      </p>
                    </article>
                  ))
                : data.audit.map((a) => (
                    <p key={a.id}>
                      {new Date(a.created_at).toLocaleString("pt-BR")} ·{" "}
                      {labels[a.action] || "Configuração atualizada"}
                    </p>
                  ))}
    </>
  );
}
