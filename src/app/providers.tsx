"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient, useConvexAuth, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function AdminIdentitySync() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoading: isConvexAuthLoading, isAuthenticated: isConvexAuthenticated } =
    useConvexAuth();
  const syncCurrentAdmin = useMutation(api.shared.auth.syncCurrentAdmin);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    console.log("[AdminIdentitySync] auth state", {
      isLoaded,
      isSignedIn,
      isConvexAuthLoading,
      isConvexAuthenticated,
      hasSynced: hasSyncedRef.current,
    });
  }, [isLoaded, isSignedIn, isConvexAuthLoading, isConvexAuthenticated]);

  useEffect(() => {
    if (!isLoaded || isConvexAuthLoading) {
      console.log("[AdminIdentitySync] waiting for auth readiness", {
        isLoaded,
        isConvexAuthLoading,
      });
      return;
    }

    if (!isSignedIn || !isConvexAuthenticated) {
      console.log("[AdminIdentitySync] cannot sync yet", {
        isSignedIn,
        isConvexAuthenticated,
      });
      hasSyncedRef.current = false;
      return;
    }

    if (hasSyncedRef.current) {
      console.log("[AdminIdentitySync] admin already synced");
      return;
    }

    console.log("[AdminIdentitySync] calling syncCurrentAdmin");
    void syncCurrentAdmin({})
      .then((result) => {
        hasSyncedRef.current = true;
        console.log("[AdminIdentitySync] syncCurrentAdmin succeeded", result);
      })
      .catch((error) => {
        hasSyncedRef.current = false;
        console.error("Failed to sync current admin to Convex.", error);
      });
  }, [
    isLoaded,
    isSignedIn,
    isConvexAuthLoading,
    isConvexAuthenticated,
    syncCurrentAdmin,
  ]);

  return null;
}

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <AdminIdentitySync />
      {children}
    </ConvexProviderWithClerk>
  );
}
