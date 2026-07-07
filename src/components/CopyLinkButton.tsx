"use client";

import { useState } from "react";

type CopyLinkButtonProps = {
  className?: string;
};

export function CopyLinkButton({ className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable, silently ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ??
        "rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }
    >
      {copied ? "Link copied!" : "Copy invite link"}
    </button>
  );
}
