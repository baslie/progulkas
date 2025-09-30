"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const signInSchema = z.object({
  email: z.string().email({ message: "Введите корректный email" }),
  password: z.string().min(1, { message: "Введите пароль" }),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: SignInValues) => {
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.href = "/";
    });
  };

  return (
    <div className="space-y-6">
      {status === "verified" && (
        <div className="rounded-md border border-green-500/60 bg-green-50 px-4 py-3 text-sm text-green-700">
          Email успешно подтверждён. Можете войти.
        </div>
      )}
      {status === "expired" && (
        <div className="rounded-md border border-yellow-500/60 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          Ссылка для подтверждения истекла. Пожалуйста, запросите новую.
        </div>
      )}
      {status === "invalid-token" && (
        <div className="rounded-md border border-red-500/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          Не удалось подтвердить email. Попробуйте ещё раз.
        </div>
      )}

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="example@progulkas.ru" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Входим..." : "Войти"}
          </Button>
        </form>
      </Form>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          disabled={isPending}
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Войти через Google
        </Button>
        <p className="text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <a href="/auth/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
            Зарегистрируйтесь
          </a>
        </p>
      </div>
    </div>
  );
}
