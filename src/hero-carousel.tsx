import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "./lib/router";
import { contactLink } from "./lib/core.mjs";
import "./hero-carousel.css";

const INTERVAL = 6000;
import { heroCampaigns as slides, type HeroCampaign } from './hero-campaigns';

function CampaignImage({slide, position}: {slide: HeroCampaign; position: number}) {
  const base = import.meta.env.BASE_URL + 'hero/' + slide.asset + '-';
  return <img className="eco-slide-image" src={base + '1600.webp'}
    srcSet={`${base}800.webp 800w, ${base}1600.webp 1600w, ${base}1960.webp 1960w`}
    sizes="100vw" width={slide.width} height={slide.height} alt="" decoding="async"
    loading={position === 0 ? 'eager' : 'lazy'} fetchPriority={position === 0 ? 'high' : 'low'} />;
}

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

  return <section className="eco-hero eco-carousel eco-campaign-carousel" aria-label="Soluções NoriEco" aria-roledescription="carrossel"
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
    {slides.map((slide, position) => <div key={slide.key} className={`eco-slide eco-campaign-${slide.layout}${index === position ? " is-active" : ""}`} role="group" aria-roledescription="slide" aria-label={`${position + 1} de ${slides.length}: ${slide.label}`} aria-hidden={index !== position} inert={index !== position}>
      {slide.layout === 'banner' ? <a className="eco-campaign-art" href={contactLink(phone, slide.message)} target="_blank" rel="noopener noreferrer" aria-label={slide.label}><CampaignImage slide={slide} position={position} /></a> : <CampaignImage slide={slide} position={position} />}
      <div className="eco-slide-shade" />
      <div className={`eco-slide-inner${slide.layout === "banner" ? " eco-campaign-caption" : ""}`}><div className="eco-slide-copy">

        <h1>{slide.title}</h1><p>{slide.description}</p>
        <div className="eco-slide-actions">{slide.layout === "banner" ? <a className="eco-button" href={contactLink(phone, slide.message)} target="_blank" rel="noopener noreferrer">{slide.primary}<span aria-hidden="true">↗</span></a> : slide.href.startsWith("/") ? <Link href={slide.href} className="eco-button">{slide.primary}<span aria-hidden="true">↗</span></Link> : <a href={slide.href} className="eco-button">{slide.primary}<span aria-hidden="true">↓</span></a>}
          {slide.layout === "scene" && <a className="eco-button eco-slide-secondary" href={contactLink(phone, slide.message)} target="_blank" rel="noopener noreferrer">{slide.secondary}<span aria-hidden="true">↗</span></a>}
        </div>
      </div></div>
    </div>)}
    {!reduced && <button type="button" className="sr-only eco-carousel-pause" aria-label={stopped ? "Ativar reprodução automática" : "Pausar reprodução automática"} aria-pressed={stopped} onClick={() => setStopped(value => !value)}>{stopped ? "Retomar banner" : "Pausar banner"}</button>}
    {!reduced && <div className="eco-carousel-progress" aria-hidden="true"><span key={`${index}-${cycle}`} style={{ animationPlayState: paused ? "paused" : "running" }} /></div>}
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
  </section>;
}
