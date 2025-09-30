import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Добро пожаловать
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
            Современный одностраничный лендинг на Next.js с использованием shadcn/ui компонентов
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="text-lg px-8 py-6">
              Начать работу
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Узнать больше
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 w-full">
            <Card className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold">Быстрый старт</h3>
              <p className="text-muted-foreground">
                Готовая структура проекта для быстрого начала разработки
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold">Современный дизайн</h3>
              <p className="text-muted-foreground">
                Использование shadcn/ui компонентов с кастомной темой
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold">Next.js 15</h3>
              <p className="text-muted-foreground">
                Последняя версия Next.js с поддержкой всех новых функций
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}