import nodemailer from "nodemailer";
import { env } from "@/lib/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (
    env.EMAIL_SERVER_HOST &&
    env.EMAIL_SERVER_PORT &&
    env.EMAIL_SERVER_USER &&
    env.EMAIL_SERVER_PASSWORD
  ) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_SERVER_HOST,
      port: Number(env.EMAIL_SERVER_PORT),
      secure: Number(env.EMAIL_SERVER_PORT) === 465,
      auth: {
        user: env.EMAIL_SERVER_USER,
        pass: env.EMAIL_SERVER_PASSWORD,
      },
    });
  }

  return transporter;
}

export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
) {
  const mailer = getTransporter();
  const subject = "Подтверждение регистрации на Маршруты Прогулки";
  const html = `
    <p>Здравствуйте!</p>
    <p>Спасибо за регистрацию на платформе «Маршруты Прогулки».</p>
    <p>Для подтверждения email перейдите по ссылке:</p>
    <p><a href="${verificationUrl}">Подтвердить email</a></p>
    <p>Ссылка действительна в течение 24 часов.</p>
    <p>Если вы не регистрировались, просто проигнорируйте это письмо.</p>
  `;

  if (!mailer || !env.EMAIL_FROM) {
    console.info("[email] Тестовая ссылка для подтверждения:", verificationUrl);
    return;
  }

  await mailer.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject,
    html,
  });
}
