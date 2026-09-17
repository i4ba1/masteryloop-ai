export interface WorkerConfig {
  readonly triggerToken: string;
  readonly supabaseUrl: string;
}
export function workerConfig(read: (key: string) => string | undefined): WorkerConfig {
  const token = read("WORKER_TRIGGER_TOKEN");
  const url = read("SUPABASE_URL");
  if (!token || token.length < 32 || /\s/.test(token))
    throw new Error("WORKER_TRIGGER_TOKEN is missing or invalid.");
  try {
    const parsed = new URL(url ?? "");
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password)
      throw new Error();
  } catch {
    throw new Error("SUPABASE_URL is missing or invalid.");
  }
  return { triggerToken: token, supabaseUrl: url! };
}
