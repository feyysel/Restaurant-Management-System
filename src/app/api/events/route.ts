import { subscribe, eventMatches, type Channel } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const channels: Channel[] = [];
  if (url.searchParams.get("admin")) channels.push({ scope: "admin" });
  const userId = url.searchParams.get("user");
  if (userId) channels.push({ scope: "user", userId });
  const restaurantId = url.searchParams.get("restaurant");
  if (restaurantId)
    channels.push({ scope: "restaurant", restaurantId });
  const code = url.searchParams.get("table");
  if (code) channels.push({ scope: "table", code });

  const fallback: Channel = channels[0] ?? { scope: "admin" };

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
          );
        } catch {
          /* stream closed */
        }
      };

      const unsubscribe = subscribe((event) => {
        if (eventMatches(event, channels)) send(event);
      });

      send({
        id: `hello-${Date.now()}`,
        channel: fallback,
        type: "hello",
        payload: { t: Date.now() },
        createdAt: Date.now(),
      });

      const heartbeat = setInterval(() => {
        send({
          id: `hb-${Date.now()}`,
          channel: fallback,
          type: "heartbeat",
          payload: { t: Date.now() },
          createdAt: Date.now(),
        });
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* noop */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
