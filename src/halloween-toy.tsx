import { useState } from 'react';
import './halloween-toy.css';

/** Decorative ornament; mouse hover, keyboard and touch share the same open state. */
export function HalloweenToy() {
  const [open, setOpen] = useState(false);
  const image = (name: string, className: string) => <img className={className} src={`${import.meta.env.BASE_URL}halloween/${name}.webp`} alt="" draggable={false} decoding="async" />;
  return <button type="button" className="halloween-toy" data-open={open} aria-pressed={open}
    aria-label={open ? 'Fechar caixão de Halloween' : 'Abrir caixão de Halloween'}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setOpen(true); }}
    onPointerLeave={event => { if (event.pointerType === 'mouse') setOpen(false); }}
    onClick={event => { if (event.detail === 0 || !matchMedia('(hover: hover) and (pointer: fine)').matches) setOpen(value => !value); }}
    onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }} onBlur={() => setOpen(false)}>
    <span className="halloween-toy-shadow" aria-hidden="true" />
    <span className="halloween-toy-coffin" aria-hidden="true">
      {image('coffin-open', 'halloween-toy-interior')}
      {image('coffin-lid', 'halloween-toy-lid')}
    </span>
    <span className="halloween-toy-pumpkin" aria-hidden="true">{image('pumpkin', '')}</span>
    <span className="halloween-toy-bats" aria-hidden="true">{[0,1,2].map(index => <span key={index} className={`halloween-toy-bat bat-${index}`}>{image('bat', '')}</span>)}</span>
  </button>;
}
