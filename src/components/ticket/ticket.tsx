"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "../button/button";
import Comments from "../comments/comments";

interface TicketCardProps {
  id: string;
  title: string;
  description?: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  ticketOwnerId: string;

  clientEmail?: string;
}

export default function TicketCard({
  id,
  title,
  description,
  status,
  priority,
  createdAt,
  ticketOwnerId,
  clientEmail, 
  onEdit,
  onDelete,
  onClick,
}: TicketCardProps) {
  const { data: session } = useSession();
  
  // Estado para manejar si los detalles (comentarios) deben ser visibles
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-red-100 text-red-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      resolved: "bg-blue-100 text-blue-800",
      closed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-red-600",
    };
    return colors[priority] || "text-gray-600";
  };

  const canComment = session?.user?.id === ticketOwnerId || session?.user?.role === "agent";

  // Función para manejar el clic en "Ver detalles" y mostrar los comentarios
  const handleToggleDetails = () => {
    setIsDetailsVisible((prevState) => !prevState); // Alterna la visibilidad de los detalles
  };

  return (
    <div
      onClick={onClick}
      className="border border-gray-300 rounded-lg p-4 hover:shadow-lg transition cursor-pointer bg-white"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          
          {clientEmail && (
            <p className="text-sm text-gray-500 mt-1">
                Cliente: <span className="font-semibold text-gray-700">{clientEmail}</span>
            </p>
          )}

          {description && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{description}</p>
          )}
          <p className="text-gray-500 text-xs mt-2">ID: {id.slice(-8)}</p>

          {/* Mostrar los comentarios solo si los detalles son visibles */}
          {isDetailsVisible && (
            <Comments 
              ticketId={id.toString()} 
              ticketOwnerId={ticketOwnerId} 
              canComment={canComment}  
            />
          )}
        </div>

        <div className="text-right">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              status
            )}`}
          >
            {status.replace("_", " ").toUpperCase()}
          </span>
          <p className={`text-sm font-semibold mt-2 ${getPriorityColor(priority)}`}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </p>
        </div>
      </div>

      {/* Botón "Ver detalles" al lado derecho de la card */}
      <div className="flex justify-end mt-2">
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleToggleDetails}
        >
          {isDetailsVisible ? "Ocultar detalles" : "Ver detalles"}
        </Button>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          {onEdit && (
            <Button
              variant="default"
              size="sm"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onEdit(id);
              }}
            >
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onDelete(id);
              }}
            >
              Eliminar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
