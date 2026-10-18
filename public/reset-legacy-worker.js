/* Retire only the former Flutter worker on the institutional hostname.
   No customer sessions, carts or application data are removed. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('flutter-')).map(name => caches.delete(name)));
    await self.clients.claim();
    await self.registration.unregister();
    const pages = await self.clients.matchAll({type:'window'});
    await Promise.all(pages.filter(page => !new URL(page.url).pathname.startsWith('/auth/')).map(page => page.navigate(page.url)));
  })());
});
