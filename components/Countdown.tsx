'use client';

import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  targetDate: Date;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {

    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex gap-8 text-center">
      <div className="flex flex-col items-center">
        <div className="text-3xl font-decorative text-primary">{formatNumber(timeLeft.days)}</div>
        <div className="text-sm text-muted-foreground font-medium">Días</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-3xl font-decorative text-primary">{formatNumber(timeLeft.hours)}</div>
        <div className="text-sm text-muted-foreground font-medium">Horas</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-3xl font-decorative text-primary">{formatNumber(timeLeft.minutes)}</div>
        <div className="text-sm text-muted-foreground font-medium">Minutos</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-3xl font-decorative text-primary">{formatNumber(timeLeft.seconds)}</div>
        <div className="text-sm text-muted-foreground font-medium">Segundos</div>
      </div>
    </div>
  );
}
