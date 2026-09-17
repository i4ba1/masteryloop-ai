import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MasteryLoop | A little clearer, every day", template: "%s | MasteryLoop" },
  description:
    "A shared learning space for students, teachers, and families. Thoughtful feedback. Visible progress.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
