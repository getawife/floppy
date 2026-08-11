import "./globals.css";
import { Press_Start_2P } from "next/font/google";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata = {
  title: "Floppy",
  description: "Platformer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={pixelFont.variable}>
      <body className={pixelFont.className}>{children}</body>
    </html>
  );
}
