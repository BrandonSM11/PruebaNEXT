import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, mensaje, asunto } = await req.json();

  const userMail = process.env.MAIL_USER;
  const passMail = process.env.MAIL_PASS;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: userMail,
        pass: passMail,
      },
    });

    await transporter.sendMail({
      from: '"HelpDeskPro" <no-reply@helpdeskpro.com>',
      to: email,
      subject: asunto,
      html: mensaje,
    });

    return NextResponse.json({ res: "Mensaje enviado" }, { status: 200 });
  } catch (error) {
    console.error("Error enviando correo:", error);
    return NextResponse.json({}, { status: 500 });
  }
}