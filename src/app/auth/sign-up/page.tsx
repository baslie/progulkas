import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создание аккаунта на платформе Маршруты Прогулки",
};

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Создание аккаунта</CardTitle>
          <CardDescription>
            Зарегистрируйтесь, чтобы сохранять любимые маршруты, делиться треками и публиковать собственные прогулки.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
      <div className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Button variant="link" asChild>
          <a href="/auth/sign-in">Войти</a>
        </Button>
      </div>
    </div>
  );
}
