import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Подтверждение email",
  description: "Проверьте почту для завершения регистрации",
};

export default function VerifyRequestPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Подтвердите электронную почту</CardTitle>
          <CardDescription>
            Мы отправили письмо со ссылкой. Перейдите по ней, чтобы завершить регистрацию. Если письмо не пришло в течение
            нескольких минут, проверьте папку «Спам» или запросите ссылку повторно.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          После подтверждения email вы сможете входить с помощью указанных учётных данных и подключать социальные
          аккаунты.
        </CardContent>
      </Card>
    </div>
  );
}
