import "./globals.css";

export const metadata = {
  title: "In memoriam",
  description: "A calm and respectful memorial page.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
