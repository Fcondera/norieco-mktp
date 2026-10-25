import {useEffect, useRef} from 'react';

// One cached image and three composited transforms; each ghost can be dismissed.
export function GhostFlights() {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const ghosts = Array.from(layer.current?.querySelectorAll('button') ?? []);
    const active = new Map<HTMLButtonElement, Animation>();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const waiting = new Set<HTMLButtonElement>();
    let disposed = false;
    const random = (min: number, max: number) => min + Math.random() * (max - min);
    function later(ghost: HTMLButtonElement, delay: number) {
      const timer = setTimeout(() => { timers.delete(timer); fly(ghost); }, delay);
      timers.add(timer);
    }
    function fly(ghost: HTMLButtonElement) {
      if (disposed || preference.matches || ghost.hidden) return;
      if (document.hidden) { waiting.add(ghost); return; }
      const width = innerWidth, height = innerHeight;
      const size = random(width < 700 ? 36 : 48, width < 700 ? 64 : 100);
      const rightward = Math.random() > .5;
      const from = rightward ? -size - 30 : width + 30;
      const to = rightward ? width + 30 : -size - 30;
      const top = random(65, Math.max(66, height - size - 35));
      const destination = random(65, Math.max(66, height - size - 35));
      const duration = random(width < 700 ? 13000 : 19000, width < 700 ? 22000 : 31000);
      ghost.style.width = `${size}px`;
      ghost.style.visibility = 'visible';
      const transform = (progress: number, y: number, angle: number) =>
        `translate3d(${from + (to - from) * progress}px,${y}px,0) rotate(${angle}deg) scaleX(${rightward ? 1 : -1})`;
      const animation = ghost.animate([
        {transform: transform(0, top, random(-12, 12)), opacity: 0},
        {transform: transform(.12, top, random(-8, 8)), opacity: .8, offset: .12},
        {transform: transform(.5, (top + destination) / 2 + random(-40, 40), random(-12, 12)), opacity: .8, offset: .5},
        {transform: transform(.88, destination, random(-8, 8)), opacity: .8, offset: .88},
        {transform: transform(1, destination, random(-12, 12)), opacity: 0},
      ], {duration, easing: 'linear', fill: 'both'});
      active.set(ghost, animation);
      void animation.finished.then(() => {
        active.delete(ghost);
        ghost.style.visibility = 'hidden';
        animation.cancel();
        if (!disposed && !preference.matches) later(ghost, random(1800, 7000));
      }).catch(() => { /* Cancelled when motion is disabled or the page unmounts. */ });
    }
    function reset() {
      timers.forEach(clearTimeout); timers.clear(); waiting.clear();
      active.forEach(animation => animation.cancel()); active.clear();
      if (!preference.matches) ghosts.forEach((ghost, index) => later(ghost, index * 3200 + random(0, 1200)));
    }
    function visibility() {
      active.forEach(animation => document.hidden ? animation.pause() : animation.play());
      if (!document.hidden) { waiting.forEach(ghost => fly(ghost)); waiting.clear(); }
    }
    reset();
    preference.addEventListener('change', reset);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      active.forEach(animation => animation.cancel());
      preference.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  return <div className="eco-ghost-flights" ref={layer}>
    {[0, 1, 2].map(id => <button key={id} type="button" className="eco-flying-ghost" aria-label="Dispensar fantasma voador" onClick={event => { event.currentTarget.hidden = true; event.currentTarget.getAnimations().forEach(animation => animation.cancel()); }}><img src={`${import.meta.env.BASE_URL}halloween/ghost-3d.webp`} width="100" height="100" alt="" decoding="async" /></button>)}
  </div>;
}
