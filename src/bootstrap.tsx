import { StrictMode, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import axios, { type AxiosInstance } from 'axios';
import Insights from './Insights';

/** Standalone dev harness: sign in against core-api, then render the dashboard like the shell would. */
const CORE = import.meta.env.VITE_CORE_API_URL ?? 'http://localhost:8080';
const INGEST = import.meta.env.VITE_INGEST_API_URL ?? 'http://localhost:8081';
const MATCH = import.meta.env.VITE_MATCH_API_URL ?? 'http://localhost:8082';

type Clients = { core: AxiosInstance; ingest: AxiosInstance; match: AxiosInstance };

function Harness() {
  const [clients, setClients] = useState<Clients | null>(null);
  const [error, setError] = useState('');

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const { data } = await axios.post(`${CORE}/auth/login`, { email: f.get('email'), password: f.get('password') });
      const headers = { Authorization: `Bearer ${data.accessToken}` };
      setClients({
        core: axios.create({ baseURL: CORE, headers }),
        ingest: axios.create({ baseURL: INGEST, headers }),
        match: axios.create({ baseURL: MATCH, headers }),
      });
    } catch {
      setError('Login failed');
    }
  }

  if (clients) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Insights {...clients} />
      </div>
    );
  }
  return (
    <form onSubmit={login} className="mx-auto mt-24 max-w-xs space-y-2 p-4 text-sm">
      <p className="font-semibold">insights-mfe (standalone)</p>
      <input name="email" placeholder="email" className="w-full rounded border px-2 py-1" />
      <input name="password" type="password" placeholder="password" className="w-full rounded border px-2 py-1" />
      <button className="rounded bg-indigo-600 px-3 py-1 text-white">Sign in</button>
      {error && <p className="text-rose-600">{error}</p>}
    </form>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
