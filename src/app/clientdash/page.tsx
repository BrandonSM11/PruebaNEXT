"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import TicketCard from "@/components/ticket/ticket";
import { getTickets, createTicket } from "@/service/tickets";
import { Ticket } from "@/database/models/tickets";
import { Button } from "@/components/button/button";

interface FormData {
  title: string;
  description: string;
  name: string;
  priority: "low" | "medium" | "high";
}

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    name: "",
    priority: "medium",
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Estado para manejar errores de validación
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    name: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getTickets();
      setTickets(response.data || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    if (session?.user?.id) {
      fetchTickets();
    }
  }, [session, fetchTickets]); 

  // 🆕 Función handleSubmit con validaciones
  async function handleSubmit() {
    // Limpiar errores previos
    setErrors({ title: "", description: "", name: "" });

    // Validar campos vacíos
    let hasErrors = false;
    const newErrors = { title: "", description: "", name: "" };

    if (!formData.title.trim()) {
      newErrors.title = "El título es requerido";
      hasErrors = true;
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
      hasErrors = true;
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descripción es requerida";
      hasErrors = true;
    }

    // Si hay errores, mostrarlos y detener el envío
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Si todo está bien, enviar el ticket
    setSubmitting(true);

    try {
      await createTicket({
        title: formData.title.trim(),
        description: formData.description.trim(),
        name: formData.name.trim(),
        priority: formData.priority,
      }); 
      setFormData({ title: "", description: "", name: "", priority: "medium" });
      setErrors({ title: "", description: "", name: "" });
      setShowModal(false);
      await fetchTickets(); 
    } catch (err) {
      console.error("Error creating ticket:", err);
      alert("Error al crear el ticket");
    } finally {
      setSubmitting(false);
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  }

  if (status === "loading")
    return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
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
        <Button
          variant="default"
          size="default"
          onClick={() => setShowModal(true)}
        >
          + Crear Nuevo Ticket
        </Button>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-800">Mis Tickets</h2>

          {loading ? (
            <p className="text-gray-600 mt-4">Cargando tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="text-gray-600 mt-4">No tienes tickets aún</p>
          ) : (
            <div className="space-y-4 mt-4">
              {tickets.map((ticket) => {
                const ownerIdObject = ticket.createdBy as any;
                const calculatedOwnerId = 
                    String(ownerIdObject?.id || 
                           ownerIdObject?._id || 
                           ticket.createdBy || 
                           "");

                return (
                  <TicketCard
                    key={ticket._id?.toString()}
                    id={ticket._id?.toString() || ""}
                    title={ticket.title}
                    description={ticket.description}
                    status={ticket.status}
                    priority={ticket.priority}
                    createdAt={
                      ticket.createdAt instanceof Date
                        ? ticket.createdAt.toISOString()
                        : ticket.createdAt || ""
                    }
                    ticketOwnerId={calculatedOwnerId}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Crear Nuevo Ticket
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.title 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-green-500"
                  }`}
                  placeholder="Titulo del problema"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-green-500"
                  }`}
                  placeholder="Tu nombre"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Input de Descripción */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.description 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-green-500"
                  }`}
                  placeholder="Describe el problema..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              {/* Select de Prioridad */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Prioridad
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              {/* Botones */}
              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    setShowModal(false);
                    setErrors({ title: "", description: "", name: "" });
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  variant="default"
                  size="default"
                  onClick={handleSubmit}
                >
                  {submitting ? "Creando..." : "Crear Ticket"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}