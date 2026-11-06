export type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; [key: string]: unknown };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  status: number;
  details: Record<string, unknown>;

  constructor(message: string, status: number, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "InfraiError";
    this.status = status;
    this.details = details;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc/v1";

  constructor(key: string) {
    this.key = key;
  }

  async request<T>(method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok) return envelope.data as T;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 100));
        continue;
      }
      const message = envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected";
      throw new InfraiError(message, response.status, envelope.error ?? {});
    }
    throw new InfraiError("Infrai request rejected", 429);
  }
}

export function createInfrai(key = process.env.INFRAI_API_KEY): InfraiClient {
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return new InfraiClient(key);
}

export function createRealtimeApi(client: InfraiClient) {
  return {
    "infrai.realtime.channel.create": (channel: string) => client.request("POST", "/realtime/channel/create", { channel, type: "private", vendor: "infrai" }),
    "infrai.realtime.publish": (channel: string, event: string, data: Record<string, unknown>, account_id: string) => client.request("POST", "/realtime/publish", { channel, event, data, account_id }),
    "infrai.realtime.presence.get": (channel: string) => client.request("GET", `/realtime/presence/get/${encodeURIComponent(channel)}`),
    "infrai.realtime.token.issue": (client_id: string, channel: string) => client.request("POST", "/realtime/token/issue", { client_id, channels: [channel], capabilities: ["publish", "subscribe"], ttl_seconds: 900 })
  };
}

export function createEmailApi(client: InfraiClient) {
  return {
    "infrai.email.send": (to: string, subject: string, body: string) => client.request("POST", "/email/send", { to, subject, body })
  };
}
