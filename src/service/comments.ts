import { IComment } from "@/database/models/comment";
import axios, { AxiosError } from "axios";

export async function getComments(ticketId: string): Promise<IComment[]> {
  try {
    const { data } = await axios.get<IComment[]>("/api/comments", {
      params: { ticketId },
    });
    return data;
  } catch (err) {
    const error = err as AxiosError<{ error: string }>;
    const msg = error.response?.data?.error || "Error fetching comments";
    throw new Error(msg);
  }
}

export async function addComment(
  ticketId: string,
  message: string
): Promise<IComment> {
  try {
    const { data } = await axios.post<IComment>("/api/comments", {
      ticketId,
      message,
    });

    return data;
  } catch (err) {
    const error = err as AxiosError<{ error: string }>;

    const msg = error.response?.data?.error || "Error posting comment";
    throw new Error(msg);
  }
}
