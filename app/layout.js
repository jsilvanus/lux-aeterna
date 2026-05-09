import "./globals.css";

export const metadata = {
  title: "In memoriam",
  description: "A memorial page in loving memory of the deceased.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
