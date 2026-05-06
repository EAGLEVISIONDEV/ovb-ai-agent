import './globals.css';

export const metadata = {
  title: 'Ana AI — Consultant Financiar Virtual | OVB',
  description: 'Vorbește cu Ana, consultantul tău financiar AI. Analiză personalizată, recomandări și plan financiar — totul prin voce, în română.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
