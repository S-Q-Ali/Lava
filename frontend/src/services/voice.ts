import type { Transcript } from "../editor/types";
import { backendBaseUrl } from "./ffmpeg";

export class VoiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoiceError";
  }
}

export function parseTranscript(value: unknown): Transcript {
  const record = value as Record<string, unknown> | null;
  if (
    !record ||
    typeof record !== "object" ||
    !Array.isArray(record.segments)
  ) {
    throw new VoiceError(
      "The sidecar returned an unexpected transcript shape.",
    );
  }
  return {
    text: typeof record.text === "string" ? record.text : "",
    language: typeof record.language === "string" ? record.language : "?",
    segments: (record.segments as Array<Record<string, unknown>>).map(
      (segment, index) => ({
        id: typeof segment.id === "number" ? segment.id : index,
        text: typeof segment.text === "string" ? segment.text : "",
        start: typeof segment.start === "number" ? segment.start : 0,
        end: typeof segment.end === "number" ? segment.end : 0,
        avgLogprob:
          typeof segment.avgLogprob === "number" ? segment.avgLogprob : 0,
        confidence:
          typeof segment.confidence === "number" ? segment.confidence : 0,
        words: Array.isArray(segment.words)
          ? (segment.words as Array<Record<string, unknown>>).map((word) => ({
              word: typeof word.word === "string" ? word.word : "",
              start: typeof word.start === "number" ? word.start : 0,
              end: typeof word.end === "number" ? word.end : 0,
              confidence:
                typeof word.confidence === "number" ? word.confidence : 1,
            }))
          : [],
      }),
    ),
    pauses: Array.isArray(record.pauses)
      ? (record.pauses as Array<Record<string, unknown>>).map((pause) => ({
          start: typeof pause.start === "number" ? pause.start : 0,
          end: typeof pause.end === "number" ? pause.end : 0,
          gap: typeof pause.gap === "number" ? pause.gap : 0,
        }))
      : [],
  };
}

export async function transcribeAsset(
  file: File,
  baseUrl = backendBaseUrl(),
  signal?: AbortSignal,
): Promise<Transcript> {
  if (file.size === 0) {
    throw new VoiceError("The selected audio file is empty.");
  }
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/transcribe`, {
    method: "POST",
    body: form,
    signal,
  });
  const body = (await res.json().catch(() => null)) as
    | (Record<string, unknown> & {
        error?: { code?: string; message?: string };
      })
    | null;

  if (!res.ok || !body) {
    const message =
      body?.error?.message ??
      (res.status === 0
        ? "No sidecar reachable. Start the local media service."
        : `Narration analysis failed (HTTP ${res.status})`);
    throw new VoiceError(message);
  }
  return parseTranscript(body);
}
