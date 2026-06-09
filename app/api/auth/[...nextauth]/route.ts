import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Busca o usuário no banco pelo e-mail
        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email } 
        });

        if (!user) return null;

        // 2. Compara a senha digitada com a senha criptografada do banco
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) return null;

        // 3. Login com sucesso! Retorna os dados do usuário para a sessão
        return { 
          id: user.id, 
          name: user.name, 
          email: user.email 
        };
      }
    })
  ],
  pages: {
    signIn: '/login', // Dizemos ao NextAuth onde fica a nossa tela de login
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET, // Variável de segurança (configuraremos a seguir)
});

export { handler as GET, handler as POST };