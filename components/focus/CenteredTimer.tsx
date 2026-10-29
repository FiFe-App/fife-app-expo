import { ReactNode, useCallback, useEffect, useState } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { Image, type ImageProps } from "expo-image";
import { Button as PaperButton, Dialog, IconButton, Portal } from "react-native-paper";
import { Stack, useFocusEffect, usePathname } from "expo-router";
import { useDispatch } from "react-redux";
import { MyAppbar } from "@/components/MyAppBar";
import { setScreenTint } from "@/redux/reducers/infoReducer";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";
import BreathingHalo from "./BreathingHalo";
import BreathingCue from "./BreathingCue";
import { getTimerPalette, type TimerTone, type TonePalette } from "./timerPalette";

/** The current time, re-rendering every second while `active`. */
export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Catch up at once: the screen may have sat idle since the last render.
    const first = setTimeout(tick, 0);
    if (!active) return () => clearTimeout(first);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active]);
  return now;
}

/** The colours of the tone a timer screen is in, for its controls. */
export function useTimerPalette(tone: TimerTone): TonePalette {
  return getTimerPalette(useAppTheme().dark)[tone];
}

const TONE_FADE_MS = 1200;

/**
 * What sits behind the image: the breathing circle, the still warm disc of a
 * work block, the faint circle a finished break leaves, or nothing.
 */
export type TimerStage = "breathing" | "warm" | "fading" | "none";

interface Props {
  /** The header's title — the header takes the screen's tone too. */
  title: string;
  /** Left out where there is no time to show yet. */
  time?: string;
  image: ImageProps["source"];
  /** Shown in a dialog from the "i" button in the corner. */
  info: { title: string; text: string };
  tone?: TimerTone;
  stage?: TimerStage;
  /** A line right under the timer, e.g. which round is running. */
  caption?: string;
  /** A line under the image; replaced by the breathing cue while breathing. */
  message?: string;
  /** A short paragraph under the image, saying what is about to happen. */
  intro?: string;
  /** Hide the breathing cue after this long; the circle keeps breathing. */
  cueForMs?: number;
  /** Controls above the main buttons, e.g. a picker or the round dots. */
  picker?: ReactNode;
  children?: ReactNode;
  /** Pinned to the bottom of the screen, e.g. "Kész vagyok". */
  footer?: ReactNode;
}

/**
 * The whole screen of both Fókusz and Szünet: a timer, the feature's image
 * with its light behind it, one line of text and the controls below — and
 * the "i" in the corner. The tone colours the whole screen and crossfades
 * when it changes, as from a work block into a break.
 */
export default function CenteredTimer({
  title, time, image, info, tone = "neutral", stage = "none", caption, message, intro, cueForMs, picker, children, footer,
}: Props) {
  const { dark } = useAppTheme();
  const palette = getTimerPalette(dark)[tone];
  const [infoVisible, setInfoVisible] = useState(false);

  // Edge to edge: the status bar and the gesture area behind the screen take
  // its tone too (app/_layout.tsx), and let go of it when the screen does.
  const dispatch = useDispatch();
  const pathname = usePathname();
  useFocusEffect(
    useCallback(() => {
      dispatch(setScreenTint({ path: pathname, color: palette.background }));
    }, [dispatch, pathname, palette.background]),
  );
  useFocusEffect(
    useCallback(() => () => {
      dispatch(setScreenTint(null));
    }, [dispatch]),
  );

  // Crossfade: the previous tone's background stays underneath while the new
  // one fades in over it.
  const [tones, setTones] = useState({ shown: tone, prev: tone });
  if (tones.shown !== tone) setTones({ shown: tone, prev: tones.shown });
  const [fade] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (tones.prev === tones.shown) return;
    fade.setValue(0);
    const anim = Animated.timing(fade, { toValue: 1, duration: TONE_FADE_MS, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [tones, fade]);
  const prevBackground = getTimerPalette(dark)[tones.prev].background;

  return (
    <View style={{ flex: 1, backgroundColor: prevBackground }}>
      <Stack.Screen
        options={{
          header: () => (
            <MyAppbar
              title={title}
              style={{ backgroundColor: palette.background, elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }}
            />
          ),
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: palette.background, opacity: fade }]}
      />
      {/* Scrolls only on a small phone with the intro showing. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", gap: intro ? Spacing.xl : Spacing.xxxl, padding: Spacing.lg, paddingTop: Spacing.xxxl }}
      >
        {(!!time || !!caption) && <View style={{ alignItems: "center", gap: Spacing.xs }}>
          {!!time && <ThemedText
            style={{
              fontFamily: "Piazzolla-Light",
              fontSize: 72,
              lineHeight: 80,
              letterSpacing: 1,
              color: palette.timer,
              fontVariant: ["tabular-nums"],
            }}
          >
            {time}
          </ThemedText>}
          {!!caption && (
            <ThemedText style={{ fontSize: 18, lineHeight: 24, fontFamily: "RedHatText-Medium", color: palette.muted }}>
              {caption}
            </ThemedText>
          )}
        </View>}
        <View style={{ width: 260, height: 260, alignItems: "center", justifyContent: "center" }}>
          {stage === "breathing" && <BreathingHalo color={palette.accent} dark={dark} />}
          {stage === "warm" && (
            <View style={{ position: "absolute", width: 196, height: 196, borderRadius: 98, backgroundColor: palette.accent, opacity: dark ? 0.7 : 0.55 }} />
          )}
          {stage === "fading" && (
            <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: getTimerPalette(dark).rest.accent, opacity: 0.18 }} />
          )}
          <Image source={image} style={{ width: 140, height: 140, borderRadius: 70 }} contentFit="cover" />
        </View>
        {!!intro && (
          <ThemedText style={{ fontSize: 17, lineHeight: 25, color: palette.muted, textAlign: "center", maxWidth: 340 }}>
            {intro}
          </ThemedText>
        )}
        {stage === "breathing" ? (
          <BreathingCue color={palette.muted} delayMs={800} visibleForMs={cueForMs} />
        ) : !!message && (
          <ThemedText style={{ fontSize: 19, lineHeight: 26, fontFamily: "RedHatText-Medium", color: palette.muted, textAlign: "center" }}>
            {message}
          </ThemedText>
        )}
        {picker}
        <View style={{ minHeight: 52, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: Spacing.sm, alignItems: "center" }}>
          {children}
        </View>
      </ScrollView>
      <IconButton
        icon="information-outline"
        size={26}
        accessibilityLabel="Hogyan működik?"
        iconColor={palette.muted}
        onPress={() => setInfoVisible(true)}
        style={{ position: "absolute", top: Spacing.sm, right: Spacing.sm }}
      />
      {!!footer && (
        <View style={{ alignItems: "center", paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl }}>
          {footer}
        </View>
      )}
      <Portal>
        <Dialog visible={infoVisible} onDismiss={() => setInfoVisible(false)}>
          <Dialog.Title>{info.title}</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ fontSize: 17, lineHeight: 25 }}>{info.text}</ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setInfoVisible(false)}>Értem</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
