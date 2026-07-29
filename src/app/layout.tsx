import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "AI Policy Desk",
  description: "Gouvernance de l'intelligence artificielle en entreprise",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
