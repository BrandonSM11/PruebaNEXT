import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnection from "../../../lib/db";
import Ticket from "@/database/models/tickets";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose"; // Asegúrate de tener esta importación
import { sendEmail } from "@/service/userEmail";


// Obtener usuario autenticado

async function getAuthenticatedUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return null;
    }
    return session.user;
}

// En tu archivo API (e.g., app/api/tickets/route.ts)

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({
                status: "error",
                message: "No autorizado"
            }, { status: 401 });
        }

        await dbConnection();

        //  Capturar los parámetros de búsqueda (URLSearchParams)
        const url = new URL(req.url);
        const statusFilter = url.searchParams.get('status');

        // Inicializar el filtro base
        let filter: any = {};

        // Si es cliente, solo ve sus tickets.
        if (user.role === "client") {
            filter = { createdBy: user.id };
        }

        // Aplicar el filtro de estado si está presente y el usuario es agente (o si es cliente y lo quiere)
        // Nota: Como este endpoint maneja cliente y agente, aplicamos el filtro de estado para ambos,
        // pero el AgentDashboard es el que lo envía activamente.
        if (statusFilter && statusFilter !== 'all') {
            // Aseguramos que el estado del ticket coincide con el filtro
            filter.status = statusFilter;
        }

        // Obtener tickets
        const tickets = await Ticket.find(filter)
            .sort({ createdAt: -1 })
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email");

        return NextResponse.json({
            status: "success",
            data: tickets
        }, { status: 200 });

    } catch (error) {
        console.error("Error obteniendo tickets:", error);
        return NextResponse.json({
            status: "error",
            message: "Error obteniendo tickets"
        }, { status: 500 });
    }
}




export async function POST(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({
                status: "error",
                message: "No autorizado"
            }, { status: 401 });
        }

        await dbConnection();
        const data = await req.json();

          console.log("Datos recibidos en el backend:", data)

        // Validar que los campos title, description y name no estén vacíos
        if (!data.title || !data.description || !data.name) {
            return NextResponse.json({
                status: "error",
                message: "Los campos title, description y name son obligatorios"
            }, { status: 400 });
        }

        // Validar que los campos no estén vacíos o con solo espacios
        if (data.title.trim() === "" || data.description.trim() === "" || data.name.trim() === "") {
            return NextResponse.json({
                status: "error",
                message: "Los campos title, description y name no pueden estar vacíos"
            }, { status: 400 });
        }

        // Validar longitud mínima para title y description
        if (data.title.length < 3) {
            return NextResponse.json({
                status: "error",
                message: "El título debe tener al menos 3 caracteres"
            }, { status: 400 });
        }

        if (data.description.length < 3) {
            return NextResponse.json({
                status: "error",
                message: "La descripción debe tener al menos 3 caracteres"
            }, { status: 400 });
        }

        // Validar que la prioridad sea válida
        const validPriorities = ['low', 'medium', 'high'];
        if (data.priority && !validPriorities.includes(data.priority)) {
            return NextResponse.json({
                status: "error",
                message: "La prioridad debe ser uno de los siguientes: low, medium, high"
            }, { status: 400 });
        }

        const newTicket = new Ticket({
            title: data.title,
            description: data.description,
            name: data.name,
            priority: data.priority || "medium",
            status: "open",
            createdBy: new Types.ObjectId(user.id),
            email: user.email,
        });

        const saved = await newTicket.save();

        try {
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
              <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;"> Ticket Creado</h1>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                  Hola <strong style="color: #111827;">${data.name}</strong>,
                </p>
                <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                  Tu ticket ha sido creado exitosamente. Nuestro equipo de soporte lo revisará pronto.
                </p>
                
                <!-- Ticket Info Box -->
                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-left: 4px solid #667eea; border-radius: 8px; margin: 20px 0;">
                  <tr>
                    <td style="padding: 24px;">
                      <h3 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">📋 Detalles del Ticket</h3>
                      
                      <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                        <strong style="color: #111827;">ID:</strong> #${saved._id}
                      </p>
                      <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                        <strong style="color: #111827;">Título:</strong> ${data.title}
                      </p>
                      <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                        <strong style="color: #111827;">Descripción:</strong> ${data.description}
                      </p>
                      <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                        <strong style="color: #111827;">Prioridad:</strong> 
                        <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 12px; text-transform: uppercase; ${data.priority === 'high' ? 'background-color: #fee2e2; color: #dc2626;' :
                    data.priority === 'medium' ? 'background-color: #fef3c7; color: #d97706;' :
                        'background-color: #dbeafe; color: #2563eb;'
                }">${data.priority}</span>
                      </p>
                      <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                        <strong style="color: #111827;">Estado:</strong> <span style="color: #10b981; font-weight: 600;">● Abierto</span>
                      </p>
                    </td>
                  </tr>
                </table>
                
                <p style="margin: 30px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                  Recibirás notificaciones por email cuando haya actualizaciones en tu ticket.
                </p>
                <p style="margin: 16px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                  Gracias por contactarnos. 🙏
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
                user.email,
                `Ticket #${saved._id} creado - ${data.title}`,
                emailHTML
            );

            console.log(" Email enviado correctamente");
        } catch (emailError) {
            // Si falla el email, logueamos el error pero NO fallamos la creación del ticket
            console.error(" Error enviando email:", emailError);
        }

        return NextResponse.json({
            status: "success",
            data: saved
        }, { status: 201 });

    } catch (error) {
        console.error("Error creando ticket:", error);
        return NextResponse.json({
            status: "error",
            message: error instanceof Error ? error.message : "Error creando ticket"
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({
                status: "error",
                message: "No autorizado"
            }, { status: 401 });
        }

        // Solo los agentes pueden cerrar tickets
        if (user.role !== "agent") {
            return NextResponse.json({
                status: "error",
                message: "Solo los agentes pueden cerrar tickets"
            }, { status: 403 });
        }

        await dbConnection();
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({
                status: "error",
                message: "ID requerido para actualizar"
            }, { status: 400 });
        }

        const data = await req.json();

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return NextResponse.json({
                status: "error",
                message: "Ticket no encontrado"
            }, { status: 404 });
        }

        // Verificamos si el estado del ticket está cambiando a "closed"
        const isClosed = data.status === "closed" && ticket.status !== "closed";

        // Actualizamos el ticket
        const updated = await Ticket.findByIdAndUpdate(id, data, { new: true });

        // Si el ticket se cierra, enviamos el correo al cliente
        if (isClosed) {

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
                                    
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;"> Ticket Cerrado</h1>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Hola <strong style="color: #111827;">${ticket.name}</strong>,
                                            </p>
                                            <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Te informamos que el ticket <strong>${ticket.title}</strong> ha sido cerrado con éxito.
                                            </p>
                                            
                                            <!-- Ticket Info Box -->
                                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-left: 4px solid #667eea; border-radius: 8px; margin: 20px 0;">
                                                <tr>
                                                    <td style="padding: 24px;">
                                                        <h3 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">📋 Detalles del Ticket</h3>
                                                        
                                                        <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                                                            <strong style="color: #111827;">ID:</strong> #${ticket._id}
                                                        </p>
                                                        <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                                                            <strong style="color: #111827;">Título:</strong> ${ticket.title}
                                                        </p>
                                                        <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                                                            <strong style="color: #111827;">Descripción:</strong> ${ticket.description}
                                                        </p>
                                                        <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                                                            <strong style="color: #111827;">Prioridad:</strong> ${ticket.priority}
                                                        </p>
                                                        <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                                                            <strong style="color: #111827;">Estado:</strong> <span style="color: #10b981; font-weight: 600;">● Cerrado</span>
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="margin: 30px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Si tienes alguna pregunta adicional o necesitas más información, no dudes en contactarnos.
                                            </p>
                                            <p style="margin: 16px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Gracias por tu paciencia. 🙏
                                            </p>
                                        </td>
                                    </tr>
                                    
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
                ticket.email,
                `Ticket #${ticket._id} cerrado - ${ticket.title}`,
                emailHTML
            );

            console.log(" Email de cierre enviado correctamente");
        }

        return NextResponse.json({
            status: "success",
            data: updated
        }, { status: 200 });

    } catch (error) {
        console.error("Error cerrando ticket:", error);
        return NextResponse.json({
            status: "error",
            message: error instanceof Error ? error.message : "Error cerrando ticket"
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({
                status: "error",
                message: "No autorizado"
            }, { status: 401 });
        }

        // Solo agentes pueden eliminar
        if (user.role !== "agent") {
            return NextResponse.json({
                status: "error",
                message: "Solo los agentes pueden eliminar tickets"
            }, { status: 403 });
        }

        await dbConnection();
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({
                status: "error",
                message: "ID requerido para eliminar"
            }, { status: 400 });
        }

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return NextResponse.json({
                status: "error",
                message: "Ticket no encontrado"
            }, { status: 404 });
        }

        const deleted = await Ticket.findByIdAndDelete(id);

        return NextResponse.json({
            status: "success",
            data: deleted
        }, { status: 200 });

    } catch (error) {
        console.error("Error eliminando ticket:", error);
        return NextResponse.json({
            status: "error",
            message: "Error eliminando ticket"
        }, { status: 500 });
    }
}