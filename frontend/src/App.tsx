import { useEffect, useState } from 'react';

type ApiStatus = 'loading' | 'up' | 'down';

export default function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then(() => setApiStatus('up'))
      .catch(() => {
        if (!controller.signal.aborted) setApiStatus('down');
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-green-50 text-gray-900">
      <header className="border-b border-green-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-green-700">🍵 Matcha</h1>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-green-200 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Jalon 1 — Infrastructure</h2>
          <p className="mb-6 text-sm text-gray-500">
            nginx · React/Vite · NestJS · PostgreSQL · Mailpit
          </p>
          <p className="text-sm">
            API + base de données :{' '}
            {apiStatus === 'loading' && <span className="text-gray-400">vérification…</span>}
            {apiStatus === 'up' && <span className="font-medium text-green-600">opérationnelles ✓</span>}
            {apiStatus === 'down' && <span className="font-medium text-red-600">injoignables ✗</span>}
          </p>
        </div>
      </main>

      <footer className="border-t border-green-200 bg-white px-6 py-3 text-center text-xs text-gray-400">
        Matcha — projet 42
      </footer>
    </div>
  );
}
