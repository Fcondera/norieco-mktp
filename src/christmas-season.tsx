import { contactLink } from './lib/core.mjs';

export function ChristmasOrnament({ className = '' }: { className?: string }) {
  return <svg className={`christmas-ornament ${className}`} viewBox="0 0 100 126" fill="none" aria-hidden="true" focusable="false">
    <path d="M50 0v22" stroke="currentColor" strokeWidth="2" />
    <path d="M40 25h20v13H40z" fill="#e5bd74" />
    <circle cx="50" cy="76" r="40" fill="#ad3744" />
    <path d="M17 54c21 18 45 24 70 22M14 75c23 19 47 24 68 21" stroke="#f0d397" strokeWidth="3" />
    <path d="m50 51 4 12 13 1-10 8 3 13-10-7-11 7 4-13-11-8 13-1z" fill="#f7e2ae" />
    <path d="M29 50c-8 7-12 17-12 25" stroke="#fff" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round" />
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
    <div className="black-friday-inner">
      <span className="black-friday-badge">BLACK <strong>FRIDAY</strong><span aria-hidden="true">↗</span></span>
      <p>Seu próximo passo começa aqui.<span>Conheça o PDV e o Nori Gestão para o seu negócio.</span></p>
      <a href={href} target="_blank" rel="noopener noreferrer">Consultar condições <span aria-hidden="true">↗</span></a>
    </div>
  </aside>;
}
