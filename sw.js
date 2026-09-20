// Service Worker Avançado para Inclusão Conectada (PWA / TWA)
const CACHE_NAME = 'inclusao-v2'; // Mudámos para v2 para obrigar o tablet a atualizar tudo!
const ASSETS_FIXOS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_FIXOS))
  );
  self.skipWaiting(); // Obriga o novo código a entrar em ação imediatamente
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      // Apaga o cofre antigo (v1) e mantém apenas o novo (v2)
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // 1. Ignora os pedidos para o Google Apps Script para as planilhas funcionarem em tempo real
  if (e.request.url.includes('script.google.com') || e.request.url.includes('googleusercontent.com')) {
    return;
  }

  // 2. Estratégia "Stale-While-Revalidate" (Rápido + Sempre Atualizado)
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        
        // Pede a versão mais recente ao GitHub nos bastidores
        const fetchPromise = fetch(e.request).then((networkResponse) => {
          // 3. Cache Dinâmico: Se encontrar ícones, imagens ou ficheiros novos, guarda-os!
          if (networkResponse && networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Se o tablet estiver sem internet, ignora o erro e continua a usar a memória (Modo Offline)
        });

        // Mostra o que está na memória imediatamente. Se não houver, espera pela internet.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
