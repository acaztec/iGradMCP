"use client";

import {
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

interface ChatComposerProps {
  input: string;
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export default function ChatComposer({
  input,
  onInputChange,
  onSubmit,
  isLoading,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!input.trim() || isLoading) {
      event.preventDefault();
      return;
    }

    onSubmit(event);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(event);
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  };

  return (
    <div className="sticky bottom-0 border-t border-[#174d8a] bg-[#0f4c81]">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex items-end gap-3"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Share your answer or ask for more guidance..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-[#1d5ca2] bg-white px-4 py-3 text-sm text-[#0b3d6f] placeholder-[#5f7fa6] focus-ring"
            style={{ maxHeight: "200px" }}
            disabled={isLoading}
            name="input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-2xl bg-[#f47b20] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#d96a18] focus-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
