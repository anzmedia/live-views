export class VideoRoom {
  constructor(state, env) {
    this.state = state;
    this.viewers = new Map();
  }

  async fetch(request) {
    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");
    const now = Date.now();

    if (!deviceId) {
      return new Response("Missing deviceId", { status: 400 });
    }

    // JOIN & HEARTBEAT
    if (url.pathname === "/join" || url.pathname === "/heartbeat") {
      this.viewers.set(deviceId, now);
      this.cleanup(now);

      return new Response(
        JSON.stringify({ online: this.viewers.size }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // LEAVE
    if (url.pathname === "/leave") {
      this.viewers.delete(deviceId);

      return new Response(
        JSON.stringify({ online: this.viewers.size }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("Not Found", { status: 404 });
  }

  cleanup(now) {
    // hapus viewer yang tidak heartbeat > 15 detik
    for (const [id, lastSeen] of this.viewers.entries()) {
      if (now - lastSeen > 15000) {
        this.viewers.delete(id);
      }
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const videoId = url.searchParams.get("videoId");

    if (!videoId) {
      return new Response("Missing videoId", { status: 400 });
    }

    const id = env.VIDEO_ROOM.idFromName(videoId);
    const room = env.VIDEO_ROOM.get(id);

    return room.fetch(request);
  }
};
