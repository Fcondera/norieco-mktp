import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "./lib/router";
import { contactLink } from "./lib/core.mjs";
import "./hero-carousel.css";

const INTERVAL = 6000;
const slides = [
  { key: "gestao", label: "NORI GESTÃO", title: "Seu negócio mais organizado, do caixa ao estoque.", description: "Controle vendas, pedidos, produtos e toda a operação em um só sistema. Mais praticidade para administrar seu estabelecimento.", primary: "Conhecer Nori Gestão", href: "#solucoes", secondary: "Falar com a equipe", message: "Olá! Quero conhecer o Nori Gestão para organizar o caixa, os pedidos e o estoque da minha empresa." },
  { key: "marketplace", label: "MARKETPLACE NORIECO", title: "O comércio da sua região, em um só lugar.", description: "Descubra lojas, restaurantes, produtos e serviços perto de você. Os catálogos integrados ao Nori Gestão também aparecem no marketplace regional.", primary: "Explorar Marketplace", href: "/marketplace", secondary: "Quero divulgar minha loja", message: "Olá! Quero divulgar minha loja no marketplace regional NoriEco. Como faço para participar?" },
  { key: "ponto", label: "CONTROLE DE PONTO", title: "A rotina da sua equipe, sob controle.", description: "Organize entradas, saídas e registros de horário com mais clareza e praticidade para o dia a dia da empresa.", primary: "Conhecer Controle de Ponto", href: "#solucoes", secondary: "Solicitar proposta", message: "Olá! Quero solicitar uma proposta para o controle de ponto da equipe no Nori Gestão." },
  { key: "sites", label: "PRESENÇA DIGITAL", title: "Sua empresa merece uma presença digital de verdade.", description: "Sites institucionais, landing pages e catálogos digitais para apresentar seu negócio de forma profissional.", primary: "Conhecer NoriEco Sites", href: "#solucoes", secondary: "Falar com a equipe", message: "Olá! Quero conhecer o NoriEco Sites e solicitar uma proposta de site, landing page ou catálogo digital para minha empresa." },
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
    {slides.map((slide, position) => <div key={slide.key} className={`eco-slide${index === position ? " is-active" : ""}`} role="group" aria-roledescription="slide" aria-label={`${position + 1} de 4: ${slide.label}`} aria-hidden={index !== position} inert={index !== position}>
      <img className="eco-slide-image" src={`${import.meta.env.BASE_URL}hero/${slide.key}-1600.jpg`} srcSet={`${import.meta.env.BASE_URL}hero/${slide.key}-800.jpg 800w, ${import.meta.env.BASE_URL}hero/${slide.key}-1600.jpg 1600w`} sizes="100vw" width="1600" height="900" alt="" decoding="async" loading={position === 0 ? "eager" : "lazy"} fetchPriority={position === 0 ? "high" : "low"} />
      <div className="eco-slide-shade" />
      <div className="eco-slide-inner"><div className="eco-slide-copy">
        <span className="eco-slide-label">{slide.label}</span>
        <h1>{slide.title}</h1><p>{slide.description}</p>
        <div className="eco-slide-actions">{slide.href.startsWith("/") ? <Link href={slide.href} className="eco-button">{slide.primary}<span aria-hidden="true">↗</span></Link> : <a href={slide.href} className="eco-button">{slide.primary}<span aria-hidden="true">↓</span></a>}
          <a className="eco-button eco-slide-secondary" href={contactLink(phone, slide.message)} target="_blank" rel="noopener noreferrer">{slide.secondary}<span aria-hidden="true">↗</span></a>
        </div>
      </div></div>
    </div>)}
    <div className="eco-carousel-controls"><div className="eco-carousel-pagination" role="group" aria-label="Escolher slide">{slides.map((slide, position) => <button key={slide.key} type="button" aria-label={`Ir para slide ${position + 1}: ${slide.label}`} aria-current={index === position ? "true" : undefined} onClick={() => select(position)}><span className={index === position ? "is-active" : ""} /></button>)}</div>
      <div className="eco-carousel-actions"><span aria-hidden="true" className="eco-slide-count">0{index+1} / 04</span><button type="button" aria-label="Slide anterior" onClick={() => select(index - 1)}>←</button><button type="button" aria-label="Próximo slide" onClick={() => select(index + 1)}>→</button>{!reduced && <button type="button" aria-label={stopped ? "Ativar reprodução automática" : "Pausar reprodução automática"} aria-pressed={stopped} onClick={() => setStopped(value => !value)}>{stopped ? "▶" : "Ⅱ"}</button>}</div>
    </div>
    {!reduced && <div className="eco-carousel-progress" aria-hidden="true"><span key={`${index}-${cycle}`} style={{ animationPlayState: paused ? "paused" : "running" }} /></div>}
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
  </section>;
}
