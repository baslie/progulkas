import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Вход в аккаунт",
  description: "Авторизация в платформе Маршруты Прогулки",
};

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Вход в аккаунт</CardTitle>
          <CardDescription>
            Используйте email и пароль или войдите через Google. Для доступа к каталогу маршрутов требуется подтверждённый
            аккаунт.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
      <div className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Button variant="link" asChild>
          <a href="/auth/sign-up">Создать новый аккаунт</a>
        </Button>
      </div>
    </div>
  );
}
