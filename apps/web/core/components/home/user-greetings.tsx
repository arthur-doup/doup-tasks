import type { FC } from "react";
// plane types
import { useTranslation } from "@plane/i18n";
import type { IUser } from "@plane/types";
// plane ui
// hooks
import { useCurrentTime } from "@/hooks/use-current-time";

export interface IUserGreetingsView {
  user: IUser;
}

// Get greeting period based on hour
function getGreetingPeriod(hour: number): "dawn" | "morning" | "afternoon" | "evening" {
  if (hour >= 0 && hour < 5) return "dawn";       // 00:00 - 04:59 = Boa madrugada
  if (hour >= 5 && hour < 12) return "morning";   // 05:00 - 11:59 = Bom dia
  if (hour >= 12 && hour < 18) return "afternoon"; // 12:00 - 17:59 = Boa tarde
  return "evening";                                // 18:00 - 23:59 = Boa noite
}

// Get emoji for greeting period
function getGreetingEmoji(period: string): string {
  switch (period) {
    case "dawn": return "🌙";
    case "morning": return "🌤️";
    case "afternoon": return "🌥️";
    case "evening": return "🌙";
    default: return "🌤️";
  }
}

export function UserGreetingsView(props: IUserGreetingsView) {
  const { user } = props;
  // current time hook
  const { currentTime } = useCurrentTime();
  // store hooks
  const { t, i18n } = useTranslation();

  // Get current locale from i18n or default to pt-BR
  const locale = i18n?.language || "pt-BR";

  const hourNum = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour12: false,
      hour: "numeric",
    }).format(currentTime),
    10
  );

  // Format date according to locale (PT-BR: "Segunda-feira, 29 de Dez")
  const weekDay = new Intl.DateTimeFormat(locale, {
    weekday: "long",
  }).format(currentTime);

  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
  }).format(currentTime);

  const month = new Intl.DateTimeFormat(locale, {
    month: "short",
  }).format(currentTime);

  // Format time according to locale (PT-BR: "07h06")
  const timeString = new Intl.DateTimeFormat(locale, {
    timeZone: user?.user_timezone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  // Format time for PT-BR style (07h06)
  const formattedTime = locale.startsWith("pt")
    ? timeString.replace(":", "h")
    : timeString;

  // Get greeting period
  const greetingPeriod = getGreetingPeriod(hourNum);
  const emoji = getGreetingEmoji(greetingPeriod);

  // Build date string based on locale
  const dateString = locale.startsWith("pt")
    ? `${weekDay}, ${day} de ${month} | ${formattedTime}`
    : `${weekDay}, ${month} ${day} ${timeString}`;

  return (
    <div className="flex flex-col items-center my-6">
      <h2 className="text-2xl font-semibold text-center">
        {t(`greeting_${greetingPeriod}`)}, {user?.first_name} {user?.last_name}
      </h2>
      <h5 className="flex items-center gap-2 font-medium text-custom-text-400">
        <div>{emoji}</div>
        <div className="capitalize">{dateString}</div>
      </h5>
    </div>
  );
}

