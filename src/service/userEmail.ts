import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
});

export const sendEmail = async (email: string, asunto: string, mensaje: string) => {
  const response = await apiClient.post(`/api/userSendMail`, {
    email,
    asunto,
    mensaje
  });
  
  return response.data;
};