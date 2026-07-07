"use client";

import { VOTE_VALUES, type VoteValue } from "@/lib/types";

type VotingCardsProps = {
  selected: VoteValue | null;
  disabled: boolean;
  onSelect: (value: VoteValue) => void;
};

export function VotingCards({ selected, disabled, onSelect }: VotingCardsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {VOTE_VALUES.map((value) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(value)}
            className={`flex h-24 w-16 shrink-0 items-center justify-center rounded-xl border-2 text-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              isSelected
                ? "-translate-y-2 border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                : "border-zinc-200 bg-white text-zinc-800 hover:-translate-y-1 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-indigo-500"
            }`}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}
