import { useState } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import NotificationPromptCard from "@/components/notifications/NotificationPromptCard";
import { emotionAvailable } from "@/constants/emotionTiming";
import { useHasBuziness } from "@/hooks/useHasBuziness";
import {
  AskablePref,
  TogglePref,
  useNotificationPrefs,
} from "@/hooks/useNotificationPrefs";
import { dismissHomeAddBuzinessCard } from "@/redux/reducers/appReducer";
import { RootState } from "@/redux/store";

interface BasePrompt {
  icon: string;
  title: string;
  body: string;
  /** Push-backed prompts are meaningless on web and in the simulator. */
  nativeOnly: boolean;
  available: boolean;
  /** True once the user has answered or dismissed it, so it never returns. */
  answered: boolean;
}

/** An opt-in ask answered by writing a notification preference. */
interface PrefPrompt extends BasePrompt {
  kind: "pref";
  key: AskablePref & TogglePref;
}

/** A nudge answered by going somewhere, not by setting a preference. */
interface ActionPrompt extends BasePrompt {
  kind: "action";
  key: string;
  acceptText: string;
  onAccept: () => void;
  onDismiss: () => void;
}

type Prompt = PrefPrompt | ActionPrompt;

/**
 * Renders at most one ask at a time. Several stacked cards read as nagging,
 * so they queue: each is answered or dismissed before the next appears, and
 * neither answer brings it back.
 */
export default function NotificationPrompts() {
  const { prefs, hydrated, setPref, markAsked } = useNotificationPrefs();
  const dispatch = useDispatch();
  const [busy, setBusy] = useState<string | null>(null);

  const { hasBuziness, loading: buzinessLoading } = useHasBuziness();
  const addBuzinessDismissed = useSelector(
    (state: RootState) => state.app.homeAddBuzinessCardDismissed,
  );

  const askedAt = {
    notifyPush: prefs.pushAskedAt,
    emotionDailyPrompt: prefs.emotionPromptAskedAt,
    newsletter: prefs.newsletterAskedAt,
  };

  const prompts: Prompt[] = [
    {
      kind: "pref",
      key: "notifyPush",
      icon: "bell-ring",
      title: "Kérsz értesítést a telefonodra?",
      body: "Szólunk ha valaki ajánlja a bizniszedet, megbízhatónak jelöl, kommentel vagy üzenetet ír.",
      nativeOnly: true,
      available: true,
      answered: askedAt.notifyPush !== null,
    },
    {
      kind: "pref",
      key: "emotionDailyPrompt",
      icon: "calendar-heart",
      title: "Szeretnél hangulatnaplót vezetni?",
      body: "Minden este megkérdezem, milyen napod volt és naptárban követheted a jegyzeteidet, hangulatodat.",
      nativeOnly: true,
      available: emotionAvailable,
      answered: askedAt.emotionDailyPrompt !== null,
    },
    {
      kind: "pref",
      key: "newsletter",
      icon: "newspaper-variant-outline",
      title: "Kérsz hírlevelet?",
      body: "Újdonságok és tippek emailben, havonta legfeljebb egyszer.",
      nativeOnly: false,
      available: true,
      answered: askedAt.newsletter !== null,
    },
    {
      kind: "action",
      key: "addBuziness",
      icon: "storefront-plus-outline",
      title: "Töltsd fel a bizniszed",
      body: "Hirdesd magad vagy a vállalkozásodat ingyen, hogy megtaláljanak azok, akiknek épp erre van szükségük.",
      nativeOnly: false,
      // Pointless for someone who already has one, and the count has to be
      // back before we can tell — otherwise the card flashes up and vanishes.
      available: !buzinessLoading && !hasBuziness,
      answered: addBuzinessDismissed,
      acceptText: "Feltöltöm",
      onAccept: () => {
        // Dismissed on accept as well, matching the pref prompts: tapping
        // through is an answer, so it shouldn't come back if they abandon
        // the form. Uploading one hides it via `available` anyway.
        dispatch(dismissHomeAddBuzinessCard());
        router.push("/biznisz/new");
      },
      onDismiss: () => dispatch(dismissHomeAddBuzinessCard()),
    },
  ];

  const next = prompts.find(
    (prompt) =>
      prompt.available &&
      !(prompt.nativeOnly && Platform.OS === "web") &&
      !prompt.answered,
  );

  if (!hydrated || !next) return null;

  const answer = async (accepted: boolean) => {
    setBusy(next.key);
    try {
      if (next.kind === "action") {
        if (accepted) next.onAccept();
        else next.onDismiss();
        return;
      }
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
      acceptText={next.kind === "action" ? next.acceptText : undefined}
      loading={busy === next.key}
      onAccept={() => answer(true)}
      onDismiss={() => answer(false)}
    />
  );
}
