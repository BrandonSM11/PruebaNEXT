import { Ticket } from "@/database/models/tickets";
import axios from "axios";

const API_URL = "/api/tickets";


export interface GetTicketsResponse {
  status: string;
  message?: string;
  data: any[]; 
}

export const getTickets = async (status?: string): Promise<GetTicketsResponse> => {
  try {
    const { data } = await axios.get<GetTicketsResponse>(API_URL, {
      params: {
        status: status || undefined, // No enviar 'status' si es undefined
      },
    });
    return data; // Retorna los datos directamente si todo sale bien
  } catch (error) {
    console.error("Error al obtener tickets:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || "Error al obtener los tickets debido a un error de red o servidor.";
      throw new Error(errorMessage); // Lanza el mensaje de error proporcionado por el servidor
    }

    throw new Error("Error desconocido al obtener los tickets.");
  }
};

// Crear un nuevo ticket
export const createTicket = async (ticket: Partial<Ticket>): Promise<Ticket> => {
  try {
    const { data } = await axios.post(API_URL, ticket);
    return data.data;
  } catch (error) {
    console.error("Error al crear ticket:", error);
    throw new Error("No se pudo crear el ticket");
  }
};

// Actualizar un ticket por ID
export const updateTicket = async (id: string, ticket: Partial<Ticket>): Promise<Ticket> => {
  try {
    const response = await axios.put(`${API_URL}?id=${id}`, ticket);
    return response.data.data;
  } catch (error) {
    console.error("Error al actualizar ticket:", error);
    throw new Error("No se pudo actualizar el ticket");
  }
};

// Eliminar un ticket por ID
export const deleteTicket = async (id: string): Promise<Ticket> => {
  try {
    const { data } = await axios.delete(`${API_URL}?id=${id}`);
    return data.data;
  } catch (error) {
    console.error("Error al eliminar ticket:", error);
    throw new Error("No se pudo eliminar el ticket");
  }
};