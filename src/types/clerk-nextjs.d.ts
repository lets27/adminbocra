declare module "@clerk/nextjs" {
  import type { ReactNode } from "react";

  export function useAuth(): {
    isLoaded: boolean;
    isSignedIn: boolean | undefined;
    getToken(options: {
      template?: "convex";
      skipCache?: boolean;
    }): Promise<string | null>;
    orgId: string | null | undefined;
    orgRole: string | null | undefined;
    sessionClaims: Record<string, unknown> | null | undefined;
  };

  export function ClerkProvider(props: { children: ReactNode }): ReactNode;
  export function Show(props: {
    when: "signed-in" | "signed-out";
    children: ReactNode;
  }): ReactNode;
  export function SignInButton(props: { children?: ReactNode }): ReactNode;
  export function SignUpButton(props: { children?: ReactNode }): ReactNode;
  export function UserButton(props?: Record<string, never>): ReactNode;
}

declare module "@clerk/nextjs/server" {
  type ClerkEmailAddress = {
    emailAddress: string | null;
  };

  type ClerkUser = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    primaryEmailAddress?: ClerkEmailAddress | null;
  };

  export function auth(): Promise<{
    userId: string | null;
  }>;

  export function currentUser(): Promise<ClerkUser | null>;

  export function clerkClient(): Promise<{
    users: {
      getUser(userId: string): Promise<ClerkUser>;
    };
  }>;

  export function clerkMiddleware(...args: unknown[]): unknown;
}
