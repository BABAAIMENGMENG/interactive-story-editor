'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Choice {
  id: string;
  text: string;
  disabled?: boolean;
  condition?: {
    type: 'item' | 'choice';
    value: string;
  };
}

interface ChoicePanelProps {
  choices: Choice[];
  onChoice: (choiceId: string) => void;
  title?: string;
}

export default function ChoicePanel({ choices, onChoice, title = '请选择' }: ChoicePanelProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-2xl bg-gradient-to-b from-gray-900/95 to-black/95 p-8 shadow-2xl border border-white/10">
        {/* 标题 */}
        <h2 className="mb-6 text-center text-2xl font-bold text-white">
          {title}
        </h2>

        {/* 选择列表 */}
        <div className="space-y-3">
          {choices.map((choice, index) => (
            <Button
              key={choice.id}
              variant="outline"
              disabled={choice.disabled}
              onClick={() => onChoice(choice.id)}
              className={cn(
                "w-full justify-start h-auto py-4 px-6 text-left transition-all",
                "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "text-white text-base font-normal"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 text-sm font-bold">
                  {index + 1}
                </span>
                <span className="flex-1">{choice.text}</span>
                {choice.disabled && (
                  <span className="text-xs text-gray-500">[条件未满足]</span>
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
