import { auth, signIn, signOut } from "@/auth";

export async function AuthButton() {
  const session = await auth();
  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  if (!googleReady) {
    return (
      <div className="auth-pill disabled" title="Add Google OAuth credentials to enable sign in">
        <span className="auth-dot" />
        <span>Sign in setup needed</span>
      </div>
    );
  }

  if (!session?.user) {
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
    <div className="user-chip">
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={session.user.image} alt="" />
      ) : (
        <span className="avatar-fallback">{session.user.name?.charAt(0) || "U"}</span>
      )}
      <span>{session.user.name || session.user.email || "Signed in"}</span>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button className="plain-action" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
