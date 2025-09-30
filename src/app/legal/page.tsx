import Link from "next/link";

const documents = [
  {
    href: "/legal/privacy",
    title: "Политика конфиденциальности",
    description:
      "Рассказываем, какие данные мы собираем, как их защищаем и какие у вас есть права как пользователя сервиса.",
  },
  {
    href: "/legal/terms",
    title: "Пользовательское соглашение",
    description:
      "Определяет условия использования платформы, обязанности участников сообщества и правила публикации материалов.",
  },
];

export default function LegalIndexPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Юридическая информация</p>
        <h1 className="text-3xl font-semibold tracking-tight">Прозрачность и защита данных</h1>
        <p className="text-sm text-muted-foreground">
          Мы придерживаемся открытого подхода к управлению данными и ответственности в сообществе. На этой странице собраны
          ключевые документы, определяющие работу платформы «Маршруты Прогулки».
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {documents.map((document) => (
          <article
            key={document.href}
            className="flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">{document.title}</h2>
              <p className="text-sm text-muted-foreground">{document.description}</p>
            </div>
            <Link href={document.href} className="mt-6 inline-flex items-center text-sm font-medium text-primary hover:underline">
              Перейти к документу
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
