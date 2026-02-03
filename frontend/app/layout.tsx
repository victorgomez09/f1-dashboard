import Providers from './providers';
import "./globals.css";
import Link from 'next/link';
import { Calendar, Car, Clock, User } from 'lucide-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <body>
        <Providers>
          <div className="drawer lg:drawer-open">
            <input id="my-drawer" type="checkbox" className="drawer-toggle" />

            {/* CONTENIDO PRINCIPAL */}
            <div className="drawer-content flex flex-col bg-base-200">
              {/* Navbar para móvil */}
              <div className="navbar w-full bg-base-100 lg:hidden border-b border-primary/20">
                <div className="flex-none">
                  <label htmlFor="my-drawer" className="btn btn-square btn-ghost">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  </label>
                </div>
                <div className="flex-1 px-2 mx-2 font-bold italic text-xl">F1 DASHBOARD</div>
              </div>

              <main className="p-6">
                {children}
              </main>
            </div>

            {/* SIDEBAR */}
            <div className="drawer-side border-r border-primary/10">
              <label htmlFor="my-drawer" className="drawer-overlay"></label>
              <ul className="menu p-4 w-60 min-h-full bg-base-100 text-base-content flex flex-col">
                <li className="mb-8 px-4">
                  <h1 className="text-2xl font-black italic text-primary tracking-tighter">
                    FAST<span className="text-white">F1</span> API
                  </h1>
                </li>

                <li className="menu-title text-gray-500">Temporada 2026</li>
                <li><Link className="flex items-center gap-2" href="/drivers"><User className="size-4" /> Clasificación Pilotos</Link></li>
                <li><a className="flex items-center gap-2"><Car className="size-4" /> Constructores</a></li>
                <li><a className="flex items-center gap-2"><Clock className="size-4" /> Telemetría en Vivo</a></li>
                <li><a className="flex items-center gap-2"><Calendar className="size-4" /> Calendario GP</a></li>

                <div className="mt-auto p-4 bg-base-300 rounded-xl">
                  <div className="text-xs opacity-50 uppercase font-bold mb-2">Estado de API</div>
                  <div className="flex items-center gap-2">
                    <div className="badge badge-success badge-xs"></div>
                    <span className="text-sm">FastAPI Online</span>
                  </div>
                </div>
              </ul>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}