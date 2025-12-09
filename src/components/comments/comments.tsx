"use client";

import { useEffect, useState } from "react";
// Supongo que estos imports son correctos para tu aplicación
import { getComments, addComment } from "@/service/comments"; 
import { IComment } from "@/database/models/comment";

// 1. MODIFICACIÓN: Agregar la prop 'canComment'
interface CommentsProps {
    ticketId: string;
    canComment: boolean; 
    ticketOwnerId: string;
}

// 2. MODIFICACIÓN: Desestructurar la prop 'canComment'
export default function Comments({ ticketId, canComment, ticketOwnerId}: CommentsProps) { 
    const [comments, setComments] = useState<IComment[]>([]);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false); // Para control de envío

    // Carga los comentarios al montar o cambiar ticketId
    useEffect(() => {
        const loadComments = async () => {
            try {
                const data = await getComments(ticketId);
                setComments(data);
            } catch (err) {
                console.error("Error cargando comentarios:", err);
            }
        };

        loadComments();
    }, [ticketId]);

    // Función para agregar un comentario
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);

        try {
            await addComment(ticketId, message);
            setMessage("");

            // refresca comentarios después de agregar
            const data = await getComments(ticketId);
            setComments(data);
        } catch (err) {
            console.error("Error agregando comentario:", err);
            alert("No se pudo enviar el comentario");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Comentarios</h3>

            <div className="space-y-2 max-h-64 overflow-y-auto border p-2 rounded">
                {comments.map((c) => (
                    <div key={c._id.toString()} className="bg-gray-50 p-2 rounded">
                        <p>{c.message}</p>
                        <span className="text-xs text-gray-500">
                            {'name' in c.author ? c.author.name : 'Autor desconocido'}
                            — {new Date(c.createdAt).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>

            {/* 3. MODIFICACIÓN: Condición de renderizado del formulario */}
            {canComment ? (
                <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
                    <input
                        type="text"
                        className="border px-3 py-2 flex-1 rounded"
                        placeholder="Escribe un comentario..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isSubmitting} // Deshabilitar mientras se envía
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-black text-white rounded disabled:bg-gray-400"
                        
                    >
                        {isSubmitting ? "Enviando..." : "Enviar"}
                    </button>
                </form>
            ) : (
                <p className="mt-3 text-sm text-gray-500 italic">
                    Solo el dueño del ticket o un agente puede añadir comentarios.
                </p>
            )}
            {/* ----------------------------------------------------- */}
        </div>
    );
}