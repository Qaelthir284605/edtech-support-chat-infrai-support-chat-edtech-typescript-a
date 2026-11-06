import { createEmailApi, createInfrai, createRealtimeApi } from "./infrai_support.ts";
import { z } from "zod";

export type SupportRequest = {
  learnerId: string;
  courseId: string;
  deadlineHours: number;
  message: string;
};

export const supportRequestSchema = z.object({
  learnerId: z.string().min(1),
  courseId: z.string().min(1),
  deadlineHours: z.number().nonnegative(),
  message: z.string().min(1)
});

export function decideSupport(request: Pick<SupportRequest, "deadlineHours" | "message">) {
  const urgent = request.deadlineHours <= 24;
  return {
    urgent,
    reportingState: urgent ? "educator_attention" : "learner_support",
    summary: `${urgent ? "Urgent" : "Routine"}: ${request.message}`
  } as const;
}

export async function handleSupport(request: SupportRequest) {
  const validated = supportRequestSchema.parse(request) as SupportRequest;
  const client = createInfrai();
  const realtime = createRealtimeApi(client);
  const email = createEmailApi(client);
  const channel = `course-${validated.courseId}`;
  await realtime["infrai.realtime.channel.create"](channel);
  const decision = decideSupport(validated);
  const token = await realtime["infrai.realtime.token.issue"](validated.learnerId, channel);
  await realtime["infrai.realtime.publish"](channel, "learner.support.message", { ...validated, decision }, validated.learnerId);
  const presence = await realtime["infrai.realtime.presence.get"](channel);
  const transcript = `${decision.summary}\nCourse: ${validated.courseId}\nDeadline: ${validated.deadlineHours} hours`;
  const emailResult = await email["infrai.email.send"](process.env.INFRAI_SUPPORT_EMAIL ?? "support@example.edu", `Support transcript: ${validated.courseId}`, transcript) as { message_id: string };
  return { channel, decision, token, presence, message_id: emailResult.message_id };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await handleSupport({ learnerId: "learner-17", courseId: "media-writing", deadlineHours: 18, message: "I need help submitting my final storyboard." });
  console.log(JSON.stringify(result, null, 2));
}
