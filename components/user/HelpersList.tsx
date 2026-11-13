import { ThemedText } from "@/components/ThemedText";
import ProfileImage from "@/components/ProfileImage";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { Spacing } from "@/constants/spacing";
import { fetchHelpers, Helper } from "@/lib/chat/helpers";
import { RootState } from "@/redux/store";
import { Link, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Surface } from "react-native-paper";
import { useSelector } from "react-redux";

const AVATAR_SIZE = 96;

function HelperCard({ helper }: { helper: Helper }) {
  const theme = useAppTheme();
  return (
    <Surface
      style={{ borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md }}
      elevation={1}
    >
      <Link href={{ pathname: "/user/[uid]", params: { uid: helper.id } }} asChild>
        <Pressable
          accessibilityRole="link"
          style={{ flexDirection: "row", alignItems: "center", gap: Spacing.lg }}
        >
          <ProfileImage
            uid={helper.id}
            avatar_url={helper.avatar_url}
            size={AVATAR_SIZE}
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: BorderRadius.full,
            }}
          />
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <ThemedText variant="titleLarge" style={{ fontSize: 20, lineHeight: 26 }}>
              {helper.full_name || "Nincs név"}
            </ThemedText>
            {!!helper.username && (
              <ThemedText
                variant="labelMedium"
                numberOfLines={1}
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                @{helper.username}
              </ThemedText>
            )}
          </View>
        </Pressable>
      </Link>
      {!!helper.note && <ThemedText variant="bodyMedium">{helper.note}</ThemedText>}
      <Button
        mode="contained"
        icon="message"
        onPress={() =>
          router.push({ pathname: "/chat/[uid]", params: { uid: helper.id } })
        }
      >
        Üzenet
      </Button>
    </Surface>
  );
}

export default function HelpersList() {
  const theme = useAppTheme();
  const myUid = useSelector((state: RootState) => state.user.uid);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchHelpers(myUid).then((res) => {
        if (!active) return;
        // Keep the list already on screen if a refresh fails.
        if (res.error) {
          console.error("loading helpers failed", res.error);
          setError(res.error);
        } else {
          setError(null);
          setHelpers(res.helpers);
        }
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [myUid]),
  );

  return (
    <ScrollView
      contentContainerStyle={{
        padding: Spacing.md,
        paddingBottom: Spacing.md + MODE_SWITCH_CLEARANCE,
        gap: Spacing.md,
      }}
    >
      <ThemedText style={{ color: theme.colors.onSurfaceVariant }}>
        Ők a FiFe közösség tagjai, akik megengedték, hogy rájuk írj, ha
        támogatásra lenne szükséged. Nem szakemberek, de szívesen
        meghallgatnak. Vészhelyzetben hívd a 112-t.
      </ThemedText>
      {loading ? (
        <ActivityIndicator style={{ marginTop: Spacing.xl }} />
      ) : helpers.length === 0 ? (
        <ThemedText style={{ textAlign: "center", marginTop: Spacing.xl }}>
          {error
            ? "Nem sikerült betölteni a listát. Próbáld újra később."
            : "Most még senki sincs a listán. Nézz vissza később, vagy keresd a segélyvonalakat."}
        </ThemedText>
      ) : (
        helpers.map((helper) => <HelperCard key={helper.id} helper={helper} />)
      )}
    </ScrollView>
  );
}
