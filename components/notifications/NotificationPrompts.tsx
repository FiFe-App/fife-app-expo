import { useState } from "react";
import { Platform } from "react-native";
import NotificationPromptCard from "@/components/notifications/NotificationPromptCard";
import { emotionAvailable } from "@/constants/emotionTiming";
import {
  AskablePref,
  TogglePref,
  useNotificationPrefs,
} from "@/hooks/useNotificationPrefs";

interface Prompt {
  key: AskablePref & TogglePref;
  icon: string;
  title: string;
  body: string;
  /** Push-backed prompts are meaningless on web and in the simulator. */
  nativeOnly: boolean;
  available: boolean;
}

/**
 * Renders at most one notification opt-in ask at a time. Three stacked
 * cards read as nagging, so they queue: each is answered or dismissed
 * before the next appears, and neither answer brings it back.
 */
export default function NotificationPrompts() {
  const { prefs, hydrated, setPref, markAsked } = useNotificationPrefs();
  const [busy, setBusy] = useState<string | null>(null);

  const prompts: Prompt[] = [
    {
      key: "notifyPush",
      icon: "bell-ring",
      title: "Kérsz értesítést a telefonodra?",
      body: "Szólunk ha valaki ajánlja a bizniszedet, megbízhatónak jelöl, kommentel vagy üzenetet ír.",
      nativeOnly: true,
      available: true,
    },
    {
      key: "emotionDailyPrompt",
      icon: "calendar-heart",
      title: "Szeretnél hangulatnaplót vezetni?",
      body: "Minden este megkérdezem, milyen napod volt és naptárban követheted a jegyzeteidet, hangulatodat.",
      nativeOnly: true,
      available: emotionAvailable,
    },
    {
      key: "newsletter",
      icon: "newspaper-variant-outline",
      title: "Kérsz hírlevelet?",
      body: "Újdonságok és tippek emailben, havonta legfeljebb egyszer.",
      nativeOnly: false,
      available: true,
    },
  ];

  const askedAt = {
    notifyPush: prefs.pushAskedAt,
    emotionDailyPrompt: prefs.emotionPromptAskedAt,
    newsletter: prefs.newsletterAskedAt,
  };

  const next = prompts.find(
    (prompt) =>
      prompt.available &&
      !(prompt.nativeOnly && Platform.OS === "web") &&
      askedAt[prompt.key] === null,
  );

  if (!hydrated || !next) return null;

  const answer = async (accepted: boolean) => {
    setBusy(next.key);
    try {
      // setPref stamps the "asked" column itself; a dismissal only
      // records the question, leaving the preference at its default.
      if (accepted) await setPref(next.key, true);
      else await markAsked(next.key);
    } finally {
      setBusy(null);
    }
  };

  return (
    <NotificationPromptCard
      icon={next.icon}
      title={next.title}
      body={next.body}
      loading={busy === next.key}
      onAccept={() => answer(true)}
      onDismiss={() => answer(false)}
    />
  );
}
