"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, PageShell, SectionCard } from "@/components/layout/page-shell";
import { ErrorState, LoadingState } from "@/components/system/system-states";
import { trackEvent } from "@/lib/analytics";
import { featureFlags } from "@/config/feature-flags";
import { toast } from "sonner";

type SessionItem = {
  id: string;
  sessionToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  revokedAt: string | null;
};

export default function SettingsSecurityPage() {
  const [tab, setTab] = useState<"account" | "security">("security");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [twoFA, setTwoFA] = useState<{ enabled: boolean; available?: boolean; message?: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const loadSecurity = async () => {
    setLoading(true);
    setError("");
    try {
      const requestList = [
        fetch("/api/settings/security/sessions"),
        featureFlags.twoFactorAuth ? fetch("/api/settings/security/2fa") : Promise.resolve(null),
      ] as const;

      const [sessionRes, twoFaRes] = await Promise.all(requestList);
      const [sessionData, twoFaData] = await Promise.all([
        sessionRes.json(),
        twoFaRes ? twoFaRes.json() : Promise.resolve({ success: true, data: null }),
      ]);
      if (!sessionData.success) throw new Error(sessionData.error || "Failed to load sessions");
      if (featureFlags.twoFactorAuth && !twoFaData.success) {
        throw new Error(twoFaData.error || "Failed to load 2FA state");
      }
      setSessions(sessionData.data);
      setTwoFA(featureFlags.twoFactorAuth ? twoFaData.data : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes("security")) setTab("security");
    if (hash.includes("account")) setTab("account");
    loadSecurity();
  }, []);

  const changePassword = async () => {
    if (!currentPassword || !newPassword) return;
    setSavingPassword(true);
    try {
      const res = await fetch("/api/settings/security/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update password");
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
      trackEvent("security_password_changed", {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    const res = await fetch("/api/settings/security/sessions/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Session revoked");
      loadSecurity();
    } else {
      toast.error(data.error || "Failed to revoke session");
    }
  };

  const revokeOthers = async () => {
    const res = await fetch("/api/settings/security/sessions/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revokeAllOthers: true }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Revoked other sessions");
      loadSecurity();
    } else {
      toast.error(data.error || "Failed to revoke sessions");
    }
  };

  const bootstrap2FA = async () => {
    const res = await fetch("/api/settings/security/2fa", { method: "POST" });
    const data = await res.json();
    if (data.success && data.data?.available !== false) {
      toast.success(data.data?.status || "2FA setup initialized");
      loadSecurity();
    } else {
      toast.error(data?.data?.status || data.error || "2FA is not available yet");
    }
  };

  return (
    <PageShell>
      <PageHeader title="Settings" subtitle="Manage account and security settings." />

      <SectionCard className="p-3 flex gap-2">
        <button onClick={() => setTab("account")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${tab === "account" ? "border-brand-400 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"}`}>Account</button>
        <button onClick={() => setTab("security")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${tab === "security" ? "border-brand-400 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"}`}>Security</button>
      </SectionCard>

      {tab === "account" ? (
        <SectionCard className="p-4 text-sm text-gray-600">
          Account settings are linked to your profile. Use <Link href="/dashboard/profile" className="text-brand-600 font-semibold">Profile</Link> to update public details.
        </SectionCard>
      ) : null}

      {tab === "security" ? (
        <>
          {loading ? <LoadingState title="Loading security settings" message="Fetching sessions and 2FA readiness." /> : null}
          {!loading && error ? <ErrorState title="Failed to load security settings" message={error} /> : null}

          {!loading && !error ? (
            <div className="space-y-4">
              <SectionCard className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-base" placeholder="Current password" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-base" placeholder="New password (8+ chars)" />
                </div>
                <button onClick={changePassword} disabled={savingPassword || !currentPassword || !newPassword} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">Update Password</button>
              </SectionCard>

              <SectionCard className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">Active Sessions</h3>
                  <button onClick={revokeOthers} className="text-xs font-semibold text-red-600 hover:text-red-700">Revoke Other Sessions</button>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No active sessions found.</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((item) => (
                      <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.userAgent || "Unknown device"}</p>
                          <p className="text-xs text-gray-500">IP: {item.ipAddress || "Unknown"}</p>
                          <p className="text-xs text-gray-400">Last active: {new Date(item.lastActiveAt).toLocaleString("en-IN")}</p>
                          <p className="text-xs text-gray-400">Status: {item.revokedAt ? "Revoked" : "Active"}</p>
                        </div>
                        {!item.revokedAt ? (
                          <button onClick={() => revokeSession(item.id)} className="text-xs font-semibold text-red-600">Revoke</button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Two-Factor Authentication</h3>
                {!featureFlags.twoFactorAuth ? (
                  <p className="text-sm text-amber-700">Two-factor authentication is currently disabled in this environment.</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Status: {twoFA?.enabled ? "Enabled" : "Not enabled"}</p>
                    {twoFA?.available === false ? (
                      <p className="text-xs text-amber-700">{twoFA.message || "2FA is not available yet."}</p>
                    ) : null}
                    <button
                      onClick={bootstrap2FA}
                      disabled={twoFA?.available === false}
                      className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {twoFA?.enabled ? "Regenerate recovery setup" : "Initialize 2FA setup"}
                    </button>
                  </>
                )}
              </SectionCard>
            </div>
          ) : null}
        </>
      ) : null}
    </PageShell>
  );
}
