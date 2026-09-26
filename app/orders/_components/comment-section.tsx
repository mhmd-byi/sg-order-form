"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderCommentView } from "@/lib/types";
import { AudioPlayer } from "./audio-player";

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";

export function CommentSection({
  orderNumber,
  comments,
}: {
  orderNumber: number;
  comments: OrderCommentView[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderNumber}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() || undefined, voiceNoteUrl }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to post comment");
      }
    },
    onSuccess: () => {
      setText("");
      setVoiceNoteUrl(undefined);
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleVoiceNoteChange(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const blob = await upload(`comments/${orderNumber}-${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setVoiceNoteUrl(blob.url);
    } catch {
      toast.error("Voice note upload failed");
    } finally {
      setUploading(false);
    }
  }

  const canPost = (text.trim().length > 0 || !!voiceNoteUrl) && !mutation.isPending && !uploading;

  return (
    <section className="print:hidden">
      <h2 className="mb-3 text-sm font-semibold text-zinc-500">Comments</h2>
      <div className="mb-4 space-y-3">
        {comments.length === 0 && <p className="text-sm text-zinc-500">No comments yet.</p>}
        {comments.map((comment, index) => (
          <div key={index} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="font-medium">
                {comment.authorName} <span className="text-xs text-zinc-500">({comment.authorRole})</span>
              </span>
              <span className="text-xs text-zinc-500">
                {new Date(comment.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {comment.text && <p className="text-zinc-700 dark:text-zinc-300">{comment.text}</p>}
            {comment.voiceNoteUrl && <AudioPlayer src={comment.voiceNoteUrl} className="mt-1" />}
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-zinc-300 p-3 dark:border-zinc-700">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment or query…"
          rows={2}
          className={inputClass}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleVoiceNoteChange(e.target.files?.[0])}
            />
            <span className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900">
              {voiceNoteUrl ? "Voice note attached" : "Attach voice note"}
            </span>
          </label>
          {uploading && <span className="text-xs text-zinc-500">Uploading…</span>}
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canPost}
            className="ml-auto rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </section>
  );
}
