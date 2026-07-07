"use client";

import { useState } from "react";

type RoundNameEditorProps = {
  roundName: string;
  onSave: (name: string) => Promise<void>;
};

export function RoundNameEditor({ roundName, onSave }: RoundNameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(roundName);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setValue(roundName);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    await onSave(value);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex items-center gap-2"
      >
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          placeholder="e.g. US-123 Checkout redesign"
          maxLength={120}
          className="w-full max-w-sm rounded-lg border border-indigo-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-indigo-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        {saving && (
          <span className="text-xs text-zinc-400">Saving…</span>
        )}
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className="group flex items-center gap-2 text-left"
    >
      {roundName ? (
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {roundName}
        </span>
      ) : (
        <span className="text-lg font-medium text-zinc-400 dark:text-zinc-500">
          Set what you&rsquo;re voting on…
        </span>
      )}
      <span className="text-xs text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
        edit
      </span>
    </button>
  );
}
