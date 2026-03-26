import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

export async function getCurrentClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

export async function requireCurrentClerkUserId(): Promise<string> {
  const userId = await getCurrentClerkUserId();

  if (!userId) {
    throw new Error("Not authenticated.");
  }

  return userId;
}

export async function getCurrentClerkUserProfile(): Promise<{
  clerkId: string;
  email: string | null;
  name: string | null;
} | null> {
  const userId = await getCurrentClerkUserId();

  if (!userId) {
    return null;
  }

  const user = await currentUser();

  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(" ")
    .trim();

  return {
    clerkId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    name:
      fullName ||
      user.username ||
      [user.firstName, user.lastName].find(
        (value): value is string => Boolean(value && value.trim().length > 0),
      ) ||
      null,
  };
}

export async function getClerkUserProfileById(clerkId: string): Promise<{
  clerkId: string;
  email: string | null;
  name: string | null;
} | null> {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkId);

  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(" ")
    .trim();

  return {
    clerkId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    name:
      fullName ||
      user.username ||
      [user.firstName, user.lastName].find(
        (value): value is string => Boolean(value && value.trim().length > 0),
      ) ||
      null,
  };
}
