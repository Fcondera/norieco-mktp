import {useEffect, useState} from 'react';
export function useSiteTheme() {
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    try { return localStorage.getItem('norieco-landing-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  useEffect(() => { try { localStorage.setItem('norieco-landing-theme', theme); } catch { /* Keep the switch usable without storage. */ } }, [theme]);
  return {theme, toggle: () => setTheme(value => value === 'dark' ? 'light' : 'dark')};
}
export function ThemeToggle({theme, toggle}:{theme:'light'|'dark';toggle:()=>void}) {
  const label=theme==='dark'?'Acender as luzes':'Apagar as luzes';
  return <button className="eco-light-switch" type="button" onClick={toggle} aria-label={label} title={label} aria-pressed={theme==='light'}>
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{theme==='dark'?<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>:<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>}</svg>
  </button>;
}
