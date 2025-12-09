import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnection from "@/lib/db";
import Comment from "@/database/models/comment";
import Ticket from "@/database/models/tickets";
import { sendEmail } from "@/service/userEmail";

export async function GET(req: Request) {
  try {
    await dbConnection();

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId requerido" },
        { status: 400 }
      );
    }

    const comments = await Comment.find({ ticketId })
      .populate("author", "name role")
      .sort({ createdAt: 1 });

    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnection();

    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id || !session.user.role) {
      return NextResponse.json({ error: "No autenticado o sesión incompleta" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const userName = session.user.name || "Agente";

    const { ticketId, message } = await req.json();

    if (!ticketId || !message) {
      return NextResponse.json(
        { error: "ticketId y message requeridos" },
        { status: 400 }
      );
    }

    // 1. Obtener el ticket COMPLETO
    const ticket = await Ticket.findById(ticketId)
      .populate("createdBy", "name email")
      .select("createdBy title email name");

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    //  Convertir a objeto plano para acceder a propiedades populadas
    const ticketData = ticket.toObject();

    const createdBy = ticketData.createdBy as { _id: unknown; name?: string; email?: string };

    console.log("ticket createdBy:", createdBy);
    console.log("userId:", userId);
    console.log("userRole:", userRole);

    const isAgent = userRole === 'agent';
    const ticketCreatorString = createdBy?._id?.toString();
    const isOwner = ticketCreatorString === userId;

    // Si NO es Agente Y NO es Propietario, denegar.
    if (!isAgent && !isOwner) {
      return NextResponse.json({ error: "Permiso denegado para comentar en este ticket" }, { status: 403 });
    }

    // 3. Crear el comentario.
    const comment = await Comment.create({
      ticketId,
      author: userId,
      message,
    });

    //  Enviar email SOLO si quien comentó es un AGENTE
    if (isAgent) {
      try {
        // Email del cliente (puede estar en ticket.email o createdBy.email)
        const clientEmail = ticketData.email || createdBy?.email;
        const clientName = ticketData.name || createdBy?.name || "Cliente";

        if (clientEmail) {
          const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 40px 20px;">
                    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">💬 Nueva Respuesta</h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                            Hola <strong style="color: #111827;">${clientName}</strong>,
                          </p>
                          <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                            Un agente de soporte ha respondido a tu ticket <strong>#${ticketId}</strong>.
                          </p>
                          
                          <!-- Ticket Info -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px; margin: 20px 0;">
                            <tr>
                              <td style="padding: 20px;">
                                <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px; font-weight: 600;">📋 ${ticketData.title}</h3>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">Ticket #${ticketId}</p>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Agent Response Box -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-left: 4px solid #10b981; border-radius: 8px; margin: 20px 0;">
                            <tr>
                              <td style="padding: 24px;">
                                <div style="display: inline-block; background-color: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 12px;">
                                  👤 ${userName}
                                </div>
                                <p style="margin: 12px 0 0; color: #374151; font-size: 15px; line-height: 1.6;">
                                  ${message}
                                </p>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Puedes ver todos los detalles y responder directamente desde tu panel de tickets.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; font-weight: 600;">
                            HelpDeskPro
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                            Sistema de Soporte Técnico
                          </p>
                          <p style="margin: 12px 0 0; color: #9ca3af; font-size: 12px;">
                            Este es un correo automático, por favor no responder.
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `;

          await sendEmail(
            clientEmail,
            `Nueva respuesta en tu ticket #${ticketId} - ${ticketData.title}`,
            emailHTML
          );

          console.log(" Email de respuesta enviado al cliente:", clientEmail);
        } else {
          console.warn(" No se encontró email del cliente para enviar notificación");
        }
      } catch (emailError) {
        console.error(" Error enviando email de respuesta:", emailError);
      }
    }

    return NextResponse.json(comment, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/comments:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}