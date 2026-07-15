import "./globals.css";

export const metadata = {
  title: "Combustion Analyzer",
  description: "Coal blend AFT prediction & slagging/fouling analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
