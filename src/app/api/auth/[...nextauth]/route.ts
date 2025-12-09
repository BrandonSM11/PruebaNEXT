import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { Session, User as NextAuthUser } from "next-auth";
import dbConnection from "@/lib/db";
import User from "@/database/models/user";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) return null;

        await dbConnection();

        const user = await User.findOne({ email: credentials.email });
        if (!user) return null;

        // ⚠️ CAMBIAR POR BCRYPT EN PRODUCCIÓN
        if (user.password !== credentials.password) return null;

        // Verificar si está activo
        if (!user.isActive) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role as "client" | "agent",
          isActive: user.isActive,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user: NextAuthUser | null }) {
      if (user) {
        token.role = user.role;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.isActive = token.isActive;
        session.user.id = token.sub || "";
      }
      return session;
    },
  },

  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export { authOptions };