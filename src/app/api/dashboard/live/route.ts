import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { getSchoolProfileIdForUser } from "@/lib/policies/application-policy";
import { logError, logInfo } from "@/lib/logger";

const POLL_INTERVAL_MS = 4000;

type LiveMarker = {
  marker: string;
  applicationCount: number;
  interviewCount: number;
};

export const runtime = "nodejs";

async function getLiveMarker(input: {
  schoolId: string | null;
  userRole: "SCHOOL_ADMIN" | "ADMIN";
  jobId: string;
}): Promise<LiveMarker> {
  const where =
    input.userRole === "ADMIN"
      ? { jobId: input.jobId }
      : {
          jobId: input.jobId,
          job: { schoolId: input.schoolId || "" },
        };

  const interviewWhere =
    input.userRole === "ADMIN"
      ? { application: { jobId: input.jobId } }
      : {
          application: {
            jobId: input.jobId,
            job: { schoolId: input.schoolId || "" },
          },
        };

  const [
    latestApplication,
    latestInterview,
    applicationCount,
    interviewCount,
  ] = await Promise.all([
    prisma.application.findFirst({
      where,
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.interview.findFirst({
      where: interviewWhere,
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.application.count({ where }),
    prisma.interview.count({ where: interviewWhere }),
  ]);

  const marker = [
    latestApplication?.updatedAt?.toISOString() || "none",
    latestInterview?.updatedAt?.toISOString() || "none",
    applicationCount,
    interviewCount,
  ].join(":");

  return {
    marker,
    applicationCount,
    interviewCount,
  };
}

function encodeSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
  if ("error" in auth) {
    return new Response(
      JSON.stringify({ success: false, error: auth.error }),
      {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId")?.trim() || "";
  if (!jobId) {
    return new Response(
      JSON.stringify({ success: false, error: "jobId is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const schoolId =
    auth.user.role === "SCHOOL_ADMIN"
      ? await getSchoolProfileIdForUser(prisma, auth.user.id)
      : null;
  const liveRole = auth.user.role === "ADMIN" ? "ADMIN" : "SCHOOL_ADMIN";

  if (auth.user.role === "SCHOOL_ADMIN" && !schoolId) {
    return new Response(
      JSON.stringify({ success: false, error: "School profile not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const encoder = new TextEncoder();
  let heartbeatId: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  let running = false;
  let lastMarker = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(encodeSse(event, data)));
      };

      const close = () => {
        if (closed) return;
        closed = true;
        if (heartbeatId) clearInterval(heartbeatId);
        controller.close();
      };

      req.signal.addEventListener("abort", close);

      try {
        const initial = await getLiveMarker({
          schoolId,
          userRole: liveRole,
          jobId,
        });
        lastMarker = initial.marker;
        send("ready", initial);
        logInfo("school_live_updates_connected", {
          userId: auth.user.id,
          role: auth.user.role,
          jobId,
        });
      } catch (error) {
        logError("school_live_updates_initialization_failed", {
          userId: auth.user.id,
          role: auth.user.role,
          jobId,
          error,
        });
        send("error", { message: "Failed to initialize live updates" });
        close();
        return;
      }

      heartbeatId = setInterval(async () => {
        if (closed || running) return;
        running = true;

        try {
          const next = await getLiveMarker({
            schoolId,
            userRole: liveRole,
            jobId,
          });

          if (next.marker !== lastMarker) {
            lastMarker = next.marker;
            send("update", next);
          } else {
            send("heartbeat", { ts: new Date().toISOString() });
          }
        } catch (error) {
          logError("school_live_updates_tick_failed", {
            userId: auth.user.id,
            role: auth.user.role,
            jobId,
            error,
          });
          send("error", { message: "Live updates failed" });
          close();
        } finally {
          running = false;
        }
      }, POLL_INTERVAL_MS);
    },
    cancel() {
      closed = true;
      if (heartbeatId) clearInterval(heartbeatId);
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
