import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  heldUntil: string;
  onExpire: () => void;
}

export const CountdownTimer: React.FC<Props> = ({ heldUntil, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(heldUntil).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0) {
        onExpire();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [heldUntil, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 font-mono text-xs font-bold animate-pulse">
      <Clock className="w-3.5 h-3.5" />
      <span>Hold: {formatted}</span>
    </div>
  );
};
