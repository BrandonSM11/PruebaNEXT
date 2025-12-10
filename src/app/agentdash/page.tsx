"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react"; // 🚨 Importamos useCallback
import { getTickets, updateTicket, deleteTicket } from "@/service/tickets";
import { Ticket } from "@/database/models/tickets";
import { Button } from "@/components/button/button"; 
import TicketCard from "@/components/ticket/ticket"; 

// Tipos de estado del ticket para el filtro
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export default function AgentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  //  ESTADO DEL FILTRO
  const [statusFilter, setStatusFilter] = useState<string>('open'); 
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editForm, setEditForm] = useState({
    status: "open" as TicketStatus,
    priority: "medium" as "low" | "medium" | "high",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  //   FUNCIÓN DE CARGA ESTABLE CON LÓGICA DE FILTRO
  const fetchTickets = useCallback(async (filter: string) => {
    setLoading(true);
    try {
      // Si el filtro no es 'all', lo enviamos al servicio de tickets.
      const filterParam = filter !== 'all' ? filter : undefined;
      //  getTickets debe aceptar un parámetro de filtro (status)
      const response = await getTickets(filterParam); 
      setTickets(response.data || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  }, []); // Dependencias vacías (solo usa setters estables)

  useEffect(() => {
    if (session?.user?.id) {
      //  Llama a fetchTickets cuando cambie el filtro o la sesión
      fetchTickets(statusFilter); 
    }
  }, [session, fetchTickets, statusFilter]); //  statusFilter añadido a las dependencias

  function handleEditClick(ticket: Ticket) {
    setSelectedTicket(ticket);
    setEditForm({
      status: ticket.status || "open",
      priority: ticket.priority || "medium",
    });
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!selectedTicket || !selectedTicket._id) return;

    setSubmitting(true);
    try {
      await updateTicket(selectedTicket._id.toString(), {
        status: editForm.status,
        priority: editForm.priority,
      });
      setShowEditModal(false);
      // Después de guardar, recarga usando el filtro actual
      await fetchTickets(statusFilter); 
    } catch (err) {
      console.error("Error updating ticket:", err);
      alert("Error al actualizar el ticket");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTicket(ticketId: string) {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este ticket?")) {
      return;
    }

    try {
      await deleteTicket(ticketId);
      // Después de eliminar, recarga usando el filtro actual
      await fetchTickets(statusFilter); 
    } catch (err) {
      console.error("Error deleting ticket:", err);
      alert("Error al eliminar el ticket");
    }
  }

  if (status === "loading") return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">HelpDeskPro</h1>

          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Bienvenido, {session?.user?.name}
            </span>

            <Button
              variant="default"
              size="default"
              onClick={() => signOut()}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tickets</h2>
          
          {/*  UI DEL FILTRO */}
          <div className="flex justify-end mb-4 gap-4 items-center">
            <label className="text-gray-600 font-medium text-sm">Filtrar por Estado:</label>
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg p-2 text-sm"
            >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="all">All</option>
            </select>
          </div>

          {loading ? (
            <p className="text-gray-600">Cargando tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="text-gray-600">No hay tickets en este estado.</p>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket._id?.toString()}
                  id={ticket._id?.toString() || ''}
                  title={ticket.title}
                  description={ticket.description}
                  clientEmail={ticket.email}
                  status={ticket.status}
                  priority={ticket.priority}
                  createdAt={ticket.createdAt ? String(ticket.createdAt) : undefined}

                  // Lógica para enviar el ID del dueño (requerido para permisos de comentario)
                  ticketOwnerId={ticket.createdBy?.toString() || ''} 

                  // Funciones de acción
                  onEdit={() => handleEditClick(ticket)}
                  onDelete={() => handleDeleteTicket(ticket._id?.toString() || "")}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición (Mantenemos la lógica de edición aquí) */}
      {showEditModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Editar Ticket
            </h3>

            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título
                </label>
                <p className="text-gray-700 p-2 bg-gray-100 rounded">
                  {selectedTicket.title}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value as TicketStatus,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      priority: e.target.value as "low" | "medium" | "high",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </Button>

                <Button
                  variant="default"
                  size="default"
                  onClick={handleSaveEdit}
                >
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}