import axios from "axios";
import { authedApi } from "@/features/auth";
import type { FollowedTopic, TopicDetail } from "./types";

export class KnowledgeApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "KnowledgeApiError";
    this.status = status;
  }
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new KnowledgeApiError("Không kết nối được máy chủ. Thử lại sau.");
    }
    const { status, data } = error.response;
    const raw = (data as { message?: unknown } | undefined)?.message;
    const message = Array.isArray(raw)
      ? raw.map(String).join(" ")
      : typeof raw === "string"
        ? raw
        : "Có lỗi xảy ra. Thử lại sau.";
    throw new KnowledgeApiError(message, status);
  }
}

/** Calls made in the browser with the signed-in learner's token. */
export const getTopicAsMember = (slug: string) =>
  call(
    authedApi.get<TopicDetail>(`/knowledge/topics/${encodeURIComponent(slug)}`),
  );

export const followTopic = (slug: string) =>
  call(
    authedApi.put<{ isFollowing: true }>(
      `/knowledge/topics/${encodeURIComponent(slug)}/follow`,
    ),
  );

export const unfollowTopic = (slug: string) =>
  call(
    authedApi.delete<{ isFollowing: false }>(
      `/knowledge/topics/${encodeURIComponent(slug)}/follow`,
    ),
  );

export const listFollowed = () =>
  call(authedApi.get<FollowedTopic[]>("/knowledge/followed"));
