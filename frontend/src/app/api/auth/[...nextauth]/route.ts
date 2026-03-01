import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "google" && account.id_token) {
        try {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
            { id_token: account.id_token }
          );
          // Store the access token for later use
          account.access_token = res.data.access_token;
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.backendToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
