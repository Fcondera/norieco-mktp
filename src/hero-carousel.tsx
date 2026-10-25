import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "./lib/router";
import { contactLink } from "./lib/core.mjs";
import "./hero-carousel.css";

const INTERVAL = 6000;
const slides = [
  { key: "gestao", label: "PDV NORI GESTÃO", title: "Menos correria. Mais controle do seu negócio.", description: "Caixa, pedidos, mesas e estoque conectados. Cuide da operação em um só lugar e ganhe tempo para atender melhor.", primary: "Ver como funciona", href: "#como-funciona", secondary: "Tirar uma dúvida", message: "Olá! Quero conhecer o Nori Gestão e o teste de 15 dias." },
  { key: "catalogo", label: "CATÁLOGO ONLINE", title: "Sua loja aberta para novos pedidos.", description: "Compartilhe seu catálogo com a sua marca. Seu cliente escolhe, faz o pedido e você acompanha tudo no Nori Gestão.", primary: "Conhecer o catálogo", href: "#solucoes", secondary: "Falar com a equipe", message: "Olá! Quero conhecer o catálogo online integrado ao Nori Gestão." },
  { key: "marketplace", label: "MARKETPLACE NORIECO", title: "O próximo achado está perto de você.", description: "Descubra lojas, restaurantes e serviços do Amazonas. Explore à vontade, sem precisar entrar na conta.", primary: "Explorar Marketplace", href: "/marketplace", secondary: "Quero divulgar minha loja", message: "Olá! Quero divulgar minha loja no marketplace NoriEco." },
];

export function HeroCarousel() {
  const [{ index, cycle }, setSlide] = useState({ index: 0, cycle: 0 });
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [announcement, setAnnouncement] = useState("");
  const remaining = useRef(INTERVAL);
  const generation = useRef(0);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const paused = hovered || focused || stopped || hidden || reduced;
  const phone = import.meta.env.VITE_SUPPORT_WHATSAPP || "5547992739983";

  const select = useCallback((next: number, announce = true) => {
    const normalized = (next + slides.length) % slides.length;
    remaining.current = INTERVAL;
    generation.current += 1;
    setSlide(previous => ({ index: normalized, cycle: previous.cycle + 1 }));
    if (announce) setAnnouncement(`Slide ${normalized + 1} de ${slides.length}: ${slides[normalized].label}`);
  }, []);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const onPreference = () => setReduced(preference.matches);
    const onVisibility = () => setHidden(document.hidden);
    preference.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const started = performance.now();
    const token = generation.current;
    const timer = window.setTimeout(() => select(index + 1, false), remaining.current);
    return () => {
      clearTimeout(timer);
      if (token === generation.current) remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [index, cycle, paused, select]);

  return <section className="eco-hero eco-carousel" aria-label="Soluções NoriEco" aria-roledescription="carrossel"
    onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
    onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
    onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); select(index + (event.key === "ArrowRight" ? 1 : -1)); } }}
    onPointerDown={event => { if (event.pointerType === "touch" && !(event.target as Element).closest("a,button")) pointer.current = { x: event.clientX, y: event.clientY }; }}
    onPointerCancel={() => { pointer.current = null; }}
    onPointerUp={event => {
      const start = pointer.current; pointer.current = null;
      if (!start) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.25) select(index + (dx < 0 ? 1 : -1));
    }}>
    {slides.map((slide, position) => <div key={slide.key} className={`eco-slide${index === position ? " is-active" : ""}`} role="group" aria-roledescription="slide" aria-label={`${position + 1} de ${slides.length}: ${slide.label}`} aria-hidden={index !== position} inert={index !== position}>
      <img className="eco-slide-image" src={`${import.meta.env.BASE_URL}halloween/scene-3d-1200.webp`} srcSet={`${import.meta.env.BASE_URL}halloween/scene-3d-700.webp 700w, ${import.meta.env.BASE_URL}halloween/scene-3d-1200.webp 1200w`} sizes="(max-width: 700px) 100vw, 65vw" width="1200" height="800" alt="" decoding="async" loading={position === 0 ? "eager" : "lazy"} fetchPriority={position === 0 ? "high" : "low"} />
      <div className="eco-slide-shade" />
      <div className="eco-slide-inner"><div className="eco-slide-copy">

        <h1>{slide.title}</h1><p>{slide.description}</p>
        <div className="eco-slide-actions">{slide.href.startsWith("/") ? <Link href={slide.href} className="eco-button">{slide.primary}<span aria-hidden="true">↗</span></Link> : <a href={slide.href} className="eco-button">{slide.primary}<span aria-hidden="true">↓</span></a>}
          <a className="eco-button eco-slide-secondary" href={contactLink(phone, slide.message)} target="_blank" rel="noopener noreferrer">{slide.secondary}<span aria-hidden="true">↗</span></a>
        </div>
      </div></div>
    </div>)}
    <div className="eco-carousel-controls"><div className="eco-carousel-pagination" role="group" aria-label="Escolher slide">{slides.map((slide, position) => <button key={slide.key} type="button" aria-label={`Ir para slide ${position + 1}: ${slide.label}`} aria-current={index === position ? "true" : undefined} onClick={() => select(position)}><span className={index === position ? "is-active" : ""} /></button>)}</div>
      <div className="eco-carousel-actions"><span aria-hidden="true" className="eco-slide-count">{String(index+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</span><button type="button" aria-label="Slide anterior" onClick={() => select(index - 1)}>←</button><button type="button" aria-label="Próximo slide" onClick={() => select(index + 1)}>→</button>{!reduced && <button type="button" aria-label={stopped ? "Ativar reprodução automática" : "Pausar reprodução automática"} aria-pressed={stopped} onClick={() => setStopped(value => !value)}>{stopped ? "▶" : "Ⅱ"}</button>}</div>
    </div>
    {!reduced && <div className="eco-carousel-progress" aria-hidden="true"><span key={`${index}-${cycle}`} style={{ animationPlayState: paused ? "paused" : "running" }} /></div>}
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
  </section>;
}
