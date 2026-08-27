import type { Session } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
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
    return (
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button className="auth-pill" type="submit">
          <span className="google-mark">G</span>
          <span>Sign in</span>
        </button>
      </form>
    );
  }

  return (
    <div className="user-chip" title={currentSession.user.name || currentSession.user.email || "Signed in"}>
      {currentSession.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentSession.user.image} alt="" />
      ) : (
        <span className="avatar-fallback">{currentSession.user.name?.charAt(0) || "U"}</span>
      )}
      <span className="user-name">{currentSession.user.name || currentSession.user.email || "Signed in"}</span>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button className="plain-action" type="submit" aria-label="Sign out" title="Sign out">
          <Icon name="logout" size={15} />
          <span>Sign out</span>
        </button>
      </form>
    </div>
  );
}
