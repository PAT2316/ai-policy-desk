import "./globals.css";

export const metadata = {
  title: "AI Policy Desk",
  description: "Gouvernance de l'intelligence artificielle en entreprise",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
