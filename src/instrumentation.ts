export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackgroundSocialScheduler } = await import(
      "./services/social-scheduler"
    );
    startBackgroundSocialScheduler();
  }
}
