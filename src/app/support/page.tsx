import type { Metadata } from "next";

const supportOptions = [
  {
    title: "Разовое пожертвование",
    description:
      "Поддержите развитие платформы единоразовым переводом. Средства идут на оплату серверов, карты и обработку медиа.",
    details: [
      "ЮKassa: 4100 1234 5678 901 (получатель — ООО «Прогулки»)",
      "Банковский перевод: ИНН 7701234567, БИК 044525225, счёт 40702810200000012345",
    ],
  },
  {
    title: "Ежемесячная подписка",
    description:
      "Подпишитесь на регулярную поддержку и получайте ранний доступ к новым маршрутам, закрытым тестам и отчётам о проделанной работе.",
    details: [
      "Планы от 300 ₽ до 1500 ₽ в месяц",
      "Каждое 1-е число отправляем дайджест развития проекта",
      "Отмена подписки — в один клик в личном кабинете",
    ],
  },
  {
    title: "Корпоративное партнёрство",
    description:
      "Помогите развивать прогулочную инфраструктуру в регионе: подготовим брендированные подборки, совместные мероприятия и обучающие вебинары для сотрудников.",
    details: [
      "Персональный менеджер и отчётность",
      "Интеграция с корпоративными порталами и мероприятиями",
      "Гибкие форматы: спонсорство локаций, образовательные программы",
    ],
  },
];

const faqItems = [
  {
    question: "Как мы используем пожертвования?",
    answer:
      "70% бюджета идёт на развитие продукта (дизайн, разработка, карты и инфраструктура), 20% — на поддержку авторов и модерацию, 10% — на коммуникации и юридические расходы.",
  },
  {
    question: "Можно ли получить отчётность?",
    answer:
      "Да, мы публикуем ежеквартальные отчёты в блоге и готовы предоставить детальные цифры партнёрам по запросу.",
  },
  {
    question: "Какие способы поддержки ещё доступны?",
    answer:
      "Помимо финансовой помощи нам важны информационные партнёрства, волонтёрская модерация и помощь в локализации контента. Напишите нам, если хотите присоединиться.",
  },
];

export const metadata: Metadata = {
  title: "Поддержать проект",
  description: "Способы финансово и организационно поддержать развитие платформы «Маршруты Прогулки».",
};

export default function SupportPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Развитие проекта</p>
        <h1 className="text-3xl font-semibold tracking-tight">Поддержите «Маршруты Прогулки»</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Нам помогает сообщество путешественников, авторов и городских активистов. Любой вклад — финансовый или экспертный —
          ускоряет запуск новых функций, карты регионов и образовательные программы.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {supportOptions.map((option) => (
          <article
            key={option.title}
            className="flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">{option.title}</h2>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground" role="list">
              {option.details.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">Частые вопросы</h2>
        <div className="mt-6 space-y-6">
          {faqItems.map((item) => (
            <div key={item.question} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{item.question}</h3>
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-primary/50 bg-primary/10 p-6 text-sm text-primary-foreground">
        <h2 className="text-lg font-semibold">Хотите обсудить индивидуальный формат?</h2>
        <p className="mt-2">
          Напишите на partners@progulkas.ru или в Telegram @progulkas_team. Мы подготовим предложение, учитывающее ваши цели,
          аудиторию и бюджеты.
        </p>
      </section>
    </div>
  );
}
