import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, name: user.name }),
          }
        );
        if (!res.ok) return false;
        const data = await res.json();
        // attach Spring Boot JWT + role to the user object
        (user as any).jwtToken = data.token;
        (user as any).role     = data.role;
        (user as any).userName = data.name;
        (user as any).userEmail = data.email;
      } catch {
        return false;
      }
      return true;
    },

    async jwt({ token, user }) {
      // runs on sign-in — copy from user to token
      if (user) {
        token.jwtToken  = (user as any).jwtToken;
        token.role      = (user as any).role;
        token.userName  = (user as any).userName;
        token.userEmail = (user as any).userEmail;
      }
      return token;
    },

    async session({ session, token }) {
      // runs on every session read — expose token to client
      (session as any).jwtToken  = token.jwtToken;
      (session as any).role      = token.role;
      (session as any).userName  = token.userName;
      (session as any).userEmail = token.userEmail;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };