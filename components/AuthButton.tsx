import type { Session } from "next-auth";
import { auth, signOut } from "@/auth";
import { GoogleSignInPill } from "@/components/GoogleSignInPill";
import { Icon } from "@/components/Icons";

export async function AuthButton({ session }: { session?: Session | null } = {}) {
  const currentSession: Session | null = session === undefined ? await auth() : session;
  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  if (!googleReady) {
    return (
      <div className="auth-pill disabled auth-setup" title="Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google sign in" aria-label="Google sign-in setup required" role="status">
        <span className="auth-dot" />
        <span>Sign-in setup</span>
      </div>
    );
  }

  if (!currentSession?.user) {
    // Fast popup flow: our styled pill opens Google's account chooser in a
    // small window; the callback page passes the code back via postMessage —
    // the main page never navigates. (The rendered GIS iframe button was
    // reverted: it wrecked the mobile header.)
    return <GoogleSignInPill clientId={process.env.GOOGLE_CLIENT_ID ?? ""} />;
  }

  const displayName = currentSession.user.name || currentSession.user.email || "Signed in";
  const email = currentSession.user.email || "Google account";

  return (
    <details className="account-menu" onKeyDown={(e) => { if (e.key === "Escape") { (e.currentTarget as HTMLDetailsElement).open = false; } }}>
      <summary className="user-chip" aria-label="Open account menu" title={displayName}>
        {currentSession.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentSession.user.image} alt="" width={30} height={30} />
        ) : (
          <span className="avatar-fallback">{displayName.charAt(0).toUpperCase()}</span>
        )}
        <span className="user-name">{displayName}</span>
        <Icon name="chevron" size={14} />
      </summary>
      <div className="account-popover">
        <div className="account-summary">
          <strong>{displayName}</strong>
          <span>{email}</span>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button className="account-action" type="submit">
            <Icon name="logout" size={15} />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </details>
  );
}
