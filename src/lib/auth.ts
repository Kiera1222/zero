import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
} 