import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Юридическая информация",
  description:
    "Политика конфиденциальности и пользовательское соглашение платформы «Маршруты Прогулки».",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-4xl flex-col gap-10">{children}</div>;
}
