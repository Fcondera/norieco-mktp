import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useApp } from "./state";
import { Link, usePath, useLocation, navigate } from "./lib/router";
import { Landing } from "./landing";
import { MarketplaceFooter, MarketplaceHelp } from "./marketplace-footer";
import { Home, BusinessPage, CartPage, Checkout } from "./public-pages";
import { Login, AuthCallback, ProfileForm, Account } from "./account-pages";
import { Administration } from "./business-pages";
import { StarterAccess } from "./starter-access";
import { ManagementLink } from "./management-link";
import {publicStoreSlug} from './lib/store-path.mjs';
import { Empty, Icon, Loading } from "./ui";
import { brl, contactLink, safeImage } from "./lib/core.mjs";
import "./styles.css";
import "./landing.css";
import "./marketplace-home.css";
function Site() {
  const path = useLocation().split("?")[0];
  const storeSlug = publicStoreSlug(path);
  useEffect(() => {
    // Preserve old links and the existing Google callback while canonicalizing navigation.
    if (["/marktplace", "/markrplace"].includes(path)) navigate("/");
    else if (!storeSlug && path !== "/" && path !== "/auth/callback" && !path.startsWith("/marketplace/") && path !== "/marketplace") {
      history.replaceState({}, "", "/marketplace" + location.pathname + location.search + location.hash);
      dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [path]);
  // The ecosystem account belongs to the existing Gestão PWA. Buyer details
  // remain secondary routes and never gate creating a store or using the PDV.
  if (["/conta", "/marketplace/conta"].includes(path.replace(/\/$/, ""))) {
    return <main className="container"><StarterAccess /></main>;
  }
  return path === "/" ? <Landing /> : <App publicSlug={storeSlug} />;
}
function Protected({
  children,
  admin = false,
  onboarding = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
  onboarding?: boolean;
}) {
  const { authLoading, user, profile } = useApp();
  const destination = location.pathname + location.search;
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      sessionStorage.setItem("norieco-return", destination);
      navigate("/entrar");
    } else if (!onboarding && !profile?.completed_at) {
      sessionStorage.setItem("norieco-return", destination);
      navigate("/primeiro-acesso");
    }
  }, [authLoading, user, profile, onboarding, destination]);
  if (authLoading) return <Loading />;
  if (!user || (!onboarding && !profile?.completed_at)) return <Loading />;
  if (admin && !profile?.is_admin)
    return (
      <Empty title="Acesso restrito">
        Esta área é exclusiva da administração NoriEco.
      </Empty>
    );
  return children;
}
function App({publicSlug}:{publicSlug?:string|null}) {
  const pathWithQuery = usePath(),
    path = pathWithQuery.split("?")[0];
  const { user, profile, cart, total, authLoading } = useApp();
  const [query, setQuery] = useState(""),
    [city, changeCity] = useState(
      () => localStorage.getItem("norieco-city") || "",
    ),
    [cityOpen, setCityOpen] = useState(false),
    [cityDraft, setCityDraft] = useState(city);
  useEffect(() => {
    document.title =
      path === "/"
        ? "NoriEco · Descubra o Amazonas"
        : "NoriEco · Lojas, serviços e experiências";
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [path]);
  const search = (value: string) => {
    setQuery(value);
    if (path !== "/") navigate("/");
  };
  let page: React.ReactNode;
  if (publicSlug) page = <BusinessPage key={publicSlug} slug={publicSlug} />;
  else if (path === "/")
    page = <Home query={query} city={city} onQuery={setQuery} />;
  else if (path.startsWith("/loja/"))
    page = (
      <BusinessPage
        key={path}
        slug={decodeURIComponent(path.split("/")[2] || "")}
      />
    );
  else if (path === "/entrar") page = <Login />;
  else if (path === "/auth/callback") page = <AuthCallback />;
  else if (path === "/ajuda") page = <MarketplaceHelp />;
  else if (path === "/primeiro-acesso")
    page = (
      <Protected onboarding>
        <div className="narrow">
          <ProfileForm onboarding />
        </div>
      </Protected>
    );
  else if (path === "/carrinho") page = <CartPage />;
  else if (path === "/finalizar")
    page = (
      <Protected>
        <Checkout />
      </Protected>
    );
  else if (path === "/cadastrar-empresa") page = <StarterAccess />;
  else if (path === "/empresa" || path.startsWith("/empresa/")) page = <StarterAccess />;
  else if (path === "/administracao" || path.startsWith("/administracao/"))
    page = (
      <Protected admin>
        <Administration />
      </Protected>
    );
  else if (path.startsWith("/conta/"))
    page = authLoading ? (
      <Loading />
    ) : !user || !profile?.completed_at ? (
      <VisitorAccount />
    ) : (
      <Protected>
        <Account key={path} tab={path.split("/")[2] === "compras" ? "" : path.split("/")[2] || ""} />
      </Protected>
    );
  else if (["/termos", "/privacidade", "/sobre"].includes(path))
    page = <Legal type={path} />;
  else
    page = (
      <Empty title="Não encontramos esta página">
        <Link href="/">Voltar ao início</Link>
      </Empty>
    );
  return (
    <>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <header className="header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="NoriEco início">
            <img src={`${import.meta.env.BASE_URL}nori-logo.png`} alt="" />
            <strong>
              Nori<span>Eco</span>
            </strong>
          </Link>
          <label className="header-search">
            <Icon name="search" size={18} />
            <span className="sr-only">Buscar no marketplace</span>
            <input
              placeholder="O que você procura?"
              value={query}
              onChange={(e) => search(e.target.value)}
              maxLength={100}
            />
          </label>
          <button
            className="city-button"
            onClick={() => { setCityDraft(city); setCityOpen((v) => !v); }}
            aria-expanded={cityOpen}
          >
            <Icon name="pin" size={18} />
            <span>{city || "Todo o Amazonas"}</span>
            <span aria-hidden="true">⌄</span>
          </button>
          <ManagementLink className="header-login" ariaLabel="Acessar Nori Gestão">
            {safeImage(profile?.avatar_url || "") ? (
              <img
                className="avatar"
                src={profile!.avatar_url}
                alt=""
              />
            ) : (
              <Icon name="user" size={20} />
            )}
          </ManagementLink>
          <Link
            className="cart-top"
            href="/carrinho"
            aria-label={`Carrinho com ${cart.reduce((s, i) => s + i.quantity, 0)} itens`}
          >
            <Icon name="bag" />
            {!!cart.length && (
              <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
            )}
          </Link>
        </div>
        {cityOpen && (
          <form
            className="city-picker"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setCityOpen(false);
                document.querySelector<HTMLButtonElement>('.city-button')?.focus();
              }
            }}
            onSubmit={(e) => {
              e.preventDefault();
              changeCity(cityDraft.trim());
              localStorage.setItem("norieco-city", cityDraft.trim());
              setCityOpen(false);
            }}
          >
            <label className="field">
              <span>Cidade no Amazonas</span>
              <input
                autoFocus
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                placeholder="Ex.: Manaus, Manacapuru, Tefé"
                maxLength={80}
              />
            </label>
            <div className="actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setCityDraft("");
                  changeCity("");
                  localStorage.setItem("norieco-city", "");
                  setCityOpen(false);
                  document.querySelector<HTMLButtonElement>('.city-button')?.focus();
                }}
              >
                Todo o Amazonas
              </button>
              <button className="button primary">Aplicar</button>
            </div>
          </form>
        )}
      </header>
      <main id="main" tabIndex={-1} className="container">
        {page}
      </main>
      <MarketplaceFooter />
      {!!cart.length && !["/carrinho", "/finalizar"].includes(path) && (
        <Link className="floating-cart" href="/carrinho">
          <Icon name="bag" size={20} />
          <span>
            {cart.reduce((s, i) => s + i.quantity, 0)} itens · {brl(total)}
          </span>
          <strong>Ver carrinho →</strong>
        </Link>
      )}
      <nav className="bottom-nav" aria-label="Navegação principal">
        <Link className={path === "/" ? "active" : ""} href="/">
          <Icon name="home" />
          Início
        </Link>
        <button
          onClick={() => {
            navigate("/");
            setTimeout(
              () =>
                document
                  .querySelector(".categories")
                  ?.scrollIntoView({ behavior: "smooth" }),
              50,
            );
          }}
        >
          <Icon name="search" />
          Explorar
        </button>
        <Link
          href="/conta/pedidos"
          className={path.includes("/pedidos") ? "active" : ""}
        >
          <Icon name="bag" />
          Pedidos
        </Link>
        <ManagementLink ariaLabel="Acessar Nori Gestão">
          <Icon name="user" />
          Gestão
        </ManagementLink>
      </nav>
    </>
  );
}
function VisitorAccount() {
  return (
    <section className="narrow">
      <span className="eyebrow">EXPLORE SEM CADASTRO</span>
      <h1>O marketplace é aberto para você.</h1>
      <p>
        Veja lojas, produtos e serviços à vontade. Entre na sua conta apenas
        para comprar ou vender.
      </p>
      <Link className="button primary" href="/">
        Continuar explorando
      </Link>
      <div className="details-grid">
        <section className="panel">
          <Icon name="bag" />
          <h2>Minhas compras</h2>
          <p>
            Monte seu carrinho sem cadastro. O acesso é solicitado ao finalizar
            o pedido.
          </p>
          <Link className="text-link" href="/carrinho">
            Ver meu carrinho
          </Link>
          <br />
          <Link
            className="text-link"
            href="/entrar"
            onClick={() =>
              sessionStorage.setItem("norieco-return", "/conta/pedidos")
            }
          >
            Já comprei: acompanhar pedidos
          </Link>
        </section>
        <section className="panel">
          <Icon name="shop" />
          <h2>Quero vender</h2>
          <p>
            Cadastre sua empresa para oferecer produtos ou serviços na NoriEco.
          </p>
          <Link className="text-link" href="/cadastrar-empresa">
            Cadastrar minha empresa
          </Link>
        </section>
      </div>
    </section>
  );
}
function Legal({ type }: { type: string }) {
  const contact = contactLink(
    import.meta.env.VITE_SUPPORT_WHATSAPP || "5547992739983",
    "Olá! Gostaria de falar sobre privacidade ou termos da NoriEco.",
  );
  return (
    <article className="narrow legal">
      <span className="eyebrow">NORIECO · AMAZONAS</span>
      <h1>
        {type === "/sobre"
          ? "O comércio local tem lugar aqui."
          : type === "/termos"
            ? "Termos de uso"
            : "Política de privacidade"}
      </h1>
      <p>Atualizado em 22 de outubro de 2026.</p>
      {type === "/sobre" ? (
        <>
          <p>
            A NoriEco conecta pessoas a lojas, sabores, serviços e experiências
            do Amazonas. Você pode explorar sem criar conta e escolher entre
            comprar de lojas integradas ao Nori Gestão ou falar diretamente com
            uma empresa.
          </p>
          <p>
            Lojas do PDV podem publicar sua página sem selo documental. O selo exige análise dos documentos. Produtos, preços,
            atendimento, entrega e execução dos serviços são responsabilidade de
            cada empresa.
          </p>
          <Link href="/cadastrar-empresa" className="button primary">
            Cadastrar minha empresa
          </Link>
        </>
      ) : type === "/termos" ? (
        <>
          <h2>Como a plataforma funciona</h2>
          <p>
            A NoriEco facilita a descoberta e o contato com empresas. Nas lojas
            integradas, o pedido é encaminhado ao sistema de gestão da própria
            empresa. O pagamento é combinado com a loja; não é cobrado pela
            plataforma.
          </p>
          <h2>Sua conta e seus pedidos</h2>
          <p>
            Use informações verdadeiras e mantenha seu acesso Google protegido.
            Confira produtos, preparo, endereço, valores e taxa antes de enviar
            o pedido. Para cancelamento, alteração, prazo, entrega ou reembolso,
            fale com a empresa responsável. Seus direitos previstos na
            legislação brasileira permanecem assegurados.
          </p>
          <h2>Empresas e avaliações</h2>
          <p>Novas lojas podem testar o Nori Gestão por 15 dias, contados da criação da loja, sem cartão ou cobrança automática. Documentos não são obrigatórios nessa etapa. Ao vencer, novas operações ficam suspensas até a NoriEco liberar ou prorrogar o acesso; os dados não são apagados pelo vencimento.</p>
          <p>
            Somente pessoas autorizadas podem cadastrar uma empresa. A análise
            do cadastro não garante a qualidade de produtos ou serviços. Não
            publique dados pessoais de terceiros, conteúdo ilegal, avaliações
            falsas ou abusivas. Podemos moderar conteúdo e suspender perfis
            mediante registro da decisão. Solicite revisão pelo suporte.
          </p>
          <h2>Disponibilidade</h2>
          <p>
            Horários e disponibilidade podem mudar. Sem conexão, não é possível
            confirmar pedidos. Um pedido só é enviado quando há confirmação com
            identificador na sua conta.
          </p>
        </>
      ) : (
        <>
          <h2>Dados usados e finalidade</h2>
          <p>
            Ao entrar com Google, recebemos identificador, nome, e-mail e foto.
            Para sua conta, solicitamos nome, WhatsApp, cidade e bairro.
            Endereços são opcionais até uma entrega. Usamos esses dados para
            identificar você, processar pedidos e prestar suporte. Sua navegação
            pública não exige conta.
          </p>
          <h2>Pedidos e empresas</h2>
          <p>
            Ao pedir, os dados necessários ao atendimento são compartilhados com
            a loja escolhida. Contatos por WhatsApp abrem um serviço externo.
            Documentos e CPF enviados na verificação comercial ficam privados,
            disponíveis ao responsável e à equipe autorizada para prevenção de
            fraude e análise do cadastro.
          </p>
          <h2>Armazenamento e segurança</h2>
          <p>
            Usamos Supabase para autenticação, banco e arquivos, e Netlify para
            hospedagem. Esses provedores podem processar dados fora do Brasil
            conforme seus contratos e garantias. A sessão e o carrinho são
            armazenados no seu navegador. Não utilizamos rastreadores de
            publicidade nesta versão.
          </p>
          <h2>Seus direitos</h2>
          <p>
            Você pode solicitar acesso, correção, exclusão, informações sobre
            compartilhamento e revisão de decisões. Mantemos os dados pelo tempo
            necessário ao atendimento, segurança e obrigações legais; pedidos de
            exclusão são analisados caso a caso. Novidades são opcionais e podem
            ser desativadas em Minha conta. Para exercer seus direitos ou
            relatar um incidente, use o contato abaixo.
          </p>
        </>
      )}
      <h2>Contato NoriEco</h2>
      <a
        className="text-link"
        href={contact}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp +55 (47) 99273-9983 ↗
      </a>
    </article>
  );
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="container">
        <Empty title="Não foi possível abrir esta página">
          <p>Seu carrinho foi preservado.</p>
          <button
            className="button primary"
            onClick={() => location.assign("/marketplace")}
          >
            Voltar ao início
          </button>
        </Empty>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider>
        <Site />
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
);
