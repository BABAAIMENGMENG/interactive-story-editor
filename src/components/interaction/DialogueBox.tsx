'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface DialogueBoxProps {
  character?: {
    name: string;
    avatar?: string;
  };
  content: string;
  onComplete?: () => void;
  typewriterSpeed?: number;
}

export default function DialogueBox({
  character,
  content,
  onComplete,
  typewriterSpeed = 50,
}: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let currentIndex = 0;

    const typewriter = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedText(content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(typewriter);
        onComplete?.();
      }
    }, typewriterSpeed);

    return () => clearInterval(typewriter);
  }, [content, typewriterSpeed, onComplete]);

  const handleClick = () => {
    if (!isComplete) {
      setDisplayedText(content);
      setIsComplete(true);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
      onClick={handleClick}
    >
      <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-b from-gray-900/95 to-black/95 p-6 shadow-2xl backdrop-blur-md border border-white/10">
        {/* 角色信息 */}
        {character && (
          <div className="mb-4 flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white/20">
              <AvatarImage src={character.avatar} alt={character.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                {character.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold text-white">{character.name}</h3>
              <p className="text-xs text-gray-400">主角</p>
            </div>
          </div>
        )}

        {/* 对话内容 */}
        <div className="relative">
          <p className="text-lg leading-relaxed text-white whitespace-pre-wrap">
            {displayedText}
            {!isComplete && (
              <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-white" />
            )}
          </p>
        </div>

        {/* 提示继续 */}
        {isComplete && (
          <div className="mt-4 flex justify-end">
            <p className="text-sm text-gray-400 animate-pulse">点击继续 ▼</p>
          </div>
        )}
      </div>
    </div>
  );
}
