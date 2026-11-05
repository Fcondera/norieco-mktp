import { contactLink } from './lib/core.mjs';
import './black-friday-banner.css';

export function ChristmasOrnament({ className = '' }: { className?: string }) {
  return <svg className={`christmas-ornament ${className}`} viewBox="0 0 100 126" fill="none" aria-hidden="true" focusable="false">
    <path d="M50 0v26" stroke="currentColor" strokeWidth="2" />
    <path d="m50 22 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#e8c47f" />
    <path d="m50 43 22 26H62l20 24H69l23 25H8l23-25H18l20-24H28z" fill="#39876b" />
    <path d="M46 118h8v8h-8z" fill="#b78c59" />
    <path d="M37 72c8 6 17 9 29 10M27 98c14 8 29 12 47 12" stroke="#efd49b" strokeWidth="2" strokeLinecap="round" />
    <circle cx="48" cy="66" r="3" fill="#dc6570" /><circle cx="58" cy="96" r="4" fill="#dc6570" />
    <circle cx="32" cy="107" r="3" fill="#efc976" />
  </svg>;
}

export function ChristmasLights() {
  return <div className="christmas-lights" aria-hidden="true">
    {Array.from({ length: 18 }, (_, index) => <span key={index} style={{ animationDelay: `${index % 4 * -.6}s` }} />)}
  </div>;
}

export function ChristmasGreeting() {
  return <div className="christmas-greeting">
    <svg width="58" height="70" viewBox="0 0 58 70" fill="none" aria-hidden="true">
      <path d="m29 3 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#e8c47f" />
      <path d="m29 18 17 19h-9l16 19H5l16-19h-9z" fill="#39876b" />
      <path d="M26 56h6v10h-6z" fill="#b78c59" /><circle cx="24" cy="34" r="2" fill="#efc976" />
      <circle cx="36" cy="47" r="2.5" fill="#dc6570" /><circle cx="18" cy="50" r="2" fill="#efc976" />
    </svg>
    <div><strong>Boas festas!</strong><span>Um Natal de novas conexões.</span></div>
  </div>;
}

export function BlackFridayBanner() {
  const phone = import.meta.env.VITE_SUPPORT_WHATSAPP || '5547992739983';
  const href = contactLink(phone, 'Olá! Quero consultar as condições da Black Friday NoriEco para meu negócio.');
  return <aside className="black-friday-banner" aria-label="Black Friday NoriEco">
    <a className="black-friday-ribbons" href={href} target="_blank" rel="noopener noreferrer"
      aria-label="Consultar condições da Black Friday NoriEco pelo WhatsApp">
      {['black', 'yellow'].map(color => <div key={color} className={`black-friday-tape black-friday-tape--${color}`} aria-hidden="true">
        <div className="black-friday-repeat">{Array.from({ length: 18 }, (_, index) =>
          <span className="black-friday-wordmark" key={index}><strong>BLACK FRIDAY</strong><i>Sale</i></span>
        )}</div>
      </div>)}
    </a>
  </aside>;
}
