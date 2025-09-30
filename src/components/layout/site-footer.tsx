export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-6 text-sm text-muted-foreground">
      <div className="container flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <p>&copy; {new Date().getFullYear()} Маршруты Прогулки. Все права защищены.</p>
        <div className="flex gap-4">
          <a href="/support" className="hover:text-primary">
            Поддержать проект
          </a>
          <a href="/legal/privacy" className="hover:text-primary">
            Политика конфиденциальности
          </a>
          <a href="/legal/terms" className="hover:text-primary">
            Пользовательское соглашение
          </a>
        </div>
      </div>
    </footer>
  );
}
