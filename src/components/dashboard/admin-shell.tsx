"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  ChevronRight,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Spotlight } from "@/components/ui/aceternity/spotlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminNavItems,
  getNavItemIsActive,
} from "@/lib/admin-dashboard";
import { cn } from "@/lib/utils";

type ShellAdmin = {
  name: string | null;
  email: string | null;
};

type AdminShellProps = {
  kicker: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: (context: { admin: ShellAdmin }) => ReactNode;
};

function ShellScaffold({
  kicker,
  title,
  description,
  pathname,
  body,
  admin,
  statusBadge,
  actions,
}: {
  kicker: string;
  title: string;
  description: string;
  pathname: string;
  body: ReactNode;
  admin: ShellAdmin;
  statusBadge: ReactNode;
  actions?: ReactNode;
}) {
  const currentDate = new Intl.DateTimeFormat("en-BW", {
    dateStyle: "full",
  }).format(new Date());

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Spotlight className="-left-20 top-0 h-[26rem] w-[26rem]" fill="rgba(20,184,166,0.18)" />
      <Spotlight className="right-[-3rem] top-[14rem] h-[20rem] w-[20rem]" fill="rgba(245,158,11,0.14)" />

      <div className="sticky top-0 z-40 border-b border-white/70 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1700px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">
              B
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                BOCRA admin
              </p>
              <p className="text-sm font-semibold text-slate-950">
                Clerk access
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Show when="signed-out">
              <SignInButton>
                <button className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200/70 bg-white px-5 text-sm font-semibold text-slate-700 shadow-[0_12px_28px_rgba(148,163,184,0.14)] transition hover:bg-slate-50 hover:text-slate-950">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#17345c_65%,#0f766e_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.22)] transition hover:brightness-105">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-3 py-2 shadow-[0_12px_28px_rgba(148,163,184,0.14)]">
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Clerk session
                  </p>
                  <p className="text-sm font-semibold text-slate-950">
                    {admin.name ?? "Signed in"}
                  </p>
                </div>
                <UserButton />
              </div>
            </Show>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-[1700px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        <aside className="panel-shell shrink-0 lg:min-h-[calc(100vh-3rem)] lg:w-[300px]">
          <div className="flex h-full flex-col p-5">
            <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#081325_0%,#15365a_60%,#0f766e_100%)] p-4 text-white shadow-[0_24px_50px_rgba(15,23,42,0.18)]">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-white/10 text-base font-black text-white">
                  B
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-[-0.02em]">
                    BOCRA Admin
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
                    Convex Live Views
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-200">
                Navigation is now tied to the real admin query surface so each
                view reflects the current Convex state instead of static mock
                fixtures.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/65 bg-white/75 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-kicker">Admin navigation</p>
                <Badge variant="success">Live data</Badge>
              </div>
              <div className="mt-4 space-y-2">
                {adminNavItems.map((item) => {
                  const isActive = getNavItemIsActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      className={cn(
                        "flex items-center justify-between rounded-[1rem] px-3 py-3 text-sm transition",
                        isActive
                          ? "bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]"
                          : "text-slate-600 hover:bg-slate-100",
                      )}
                      href={item.href}
                      key={item.href}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} />
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p
                            className={cn(
                              "text-xs",
                              isActive ? "text-slate-300" : "text-slate-400",
                            )}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[1.5rem] border border-white/65 bg-white/75 p-4">
                <p className="text-kicker">Derived views</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                    `Investigation` lives under complaint detail with
                    `getComplaintById` and admin mutations.
                  </div>
                  <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                    `Actions` are attached to complaint detail via
                    `regulatoryActions`.
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/65 bg-white/75 p-4">
                <p className="text-kicker">Session</p>
                <p className="mt-3 text-base font-semibold text-slate-950">
                  {admin.name ?? "Mapped admin"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {admin.email ?? "No email on file"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">{statusBadge}</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="panel-shell flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-kicker">{kicker}</p>
                <h1 className="truncate text-xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-2xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-500">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[250px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    className="pl-11"
                    placeholder="Search operators, complaints, or refs..."
                    readOnly
                  />
                </div>
                <Button size="icon" variant="secondary">
                  <CalendarDays size={18} />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">{currentDate}</Badge>
                {actions}
              </div>
            </div>
          </div>

          {body}
        </main>
      </div>
    </div>
  );
}

function LoadingBody() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <p className="text-kicker">Loading</p>
          <CardTitle>Fetching live Convex data</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="h-32 animate-pulse rounded-[1.4rem] bg-slate-100"
              key={index}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="overflow-hidden bg-[linear-gradient(135deg,#081325_0%,#102443_58%,#0d6b69_100%)] text-white">
        <CardHeader>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Live sync
          </p>
          <CardTitle className="text-white">Preparing admin workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="text-amber-300" size={18} />
              <p className="text-sm text-slate-200">
                Waiting for auth state and initial dashboard queries.
              </p>
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300">
            Once the current admin record resolves, the shell mounts the live
            route content and subscriptions.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessBody({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Card>
      <CardHeader>
        <p className="text-kicker">Admin access required</p>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-2xl text-sm leading-7 text-slate-500">{message}</p>
        <div className="rounded-[1.2rem] border border-amber-200/60 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          This app now waits for a mapped `admins` record before mounting the
          live Convex admin queries.
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminShell({
  kicker,
  title,
  description,
  actions,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const profile = useQuery(api.shared.auth.getCurrentAdminProfile, {});

  if (profile === undefined) {
    return (
      <ShellScaffold
        admin={{ name: "Loading admin", email: null }}
        body={<LoadingBody />}
        description={description}
        kicker={kicker}
        pathname={pathname}
        statusBadge={<Badge variant="outline">Syncing session</Badge>}
        title={title}
        actions={actions}
      />
    );
  }

  if (profile.status !== "authenticated" || !profile.admin) {
    const accessMessage =
      profile.status === "unauthenticated"
        ? "Sign in with Clerk to initialize the Convex-backed admin workspace."
        : "Your Clerk session exists, but there is no matching active record in the Convex admins table yet.";
    const fallbackName =
      user?.fullName ??
      user?.username ??
      profile.identity?.name ??
      "Admin access";
    const fallbackEmail =
      user?.primaryEmailAddress?.emailAddress ??
      profile.identity?.email ??
      null;

    return (
      <ShellScaffold
        admin={{
          name: fallbackName,
          email: fallbackEmail,
        }}
        body={
          <AccessBody
            message={accessMessage}
            title="We couldn't resolve an active BOCRA admin profile."
          />
        }
        description={description}
        kicker={kicker}
        pathname={pathname}
        statusBadge={<Badge variant="warning">{profile.status}</Badge>}
        title={title}
        actions={actions}
      />
    );
  }

  const displayName =
    profile.admin.name ??
    user?.fullName ??
    user?.username ??
    profile.identity?.name ??
    "Mapped admin";
  const displayEmail =
    profile.admin.email ??
    user?.primaryEmailAddress?.emailAddress ??
    profile.identity?.email ??
    null;

  return (
    <ShellScaffold
      admin={{
        name: displayName,
        email: displayEmail,
      }}
      body={children({
        admin: {
          name: displayName,
          email: displayEmail,
        },
      })}
      description={description}
      kicker={kicker}
      pathname={pathname}
      statusBadge={
        <>
          <Badge variant="success">Admin mapped</Badge>
          <Badge variant="outline">Live session</Badge>
        </>
      }
      title={title}
      actions={actions}
    />
  );
}
