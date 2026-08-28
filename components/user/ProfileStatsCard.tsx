import ProfileImage from "@/components/ProfileImage";
import RecommendationsModal from "@/components/user/RecommendationsModal";
import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/lib/supabase/supabase";
import elapsedTime from "@/lib/functions/elapsedTime";
import { useAppTheme } from "@/assets/theme";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Portal, Surface, Text, TouchableRipple } from "react-native-paper";

interface ProfileStatsCardProps {
  uid: string;
  fullName?: string | null;
  createdAt?: string | null;
}

/**
 * The "who recommends this profile" / "how long on Fife" stats card, as seen
 * on components/user/UserPage.tsx. Fetches its own recommendations preview so
 * callers only need to pass the profile's uid.
 */
export default function ProfileStatsCard({ uid, fullName, createdAt }: ProfileStatsCardProps) {
  const theme = useAppTheme();
  const [recommendations, setRecommendations] = useState<
    { author: string; avatar_url: string | null }[]
  >([]);
  const [showRecommendsModal, setShowRecommendsModal] = useState(false);

  useEffect(() => {
    if (!uid) return;
    supabase
      .from("profileRecommendations")
      .select("author, profiles!profileRecommendations_author_fkey(avatar_url)")
      .eq("profile_id", uid)
      .then(({ data }) => {
        if (data) {
          setRecommendations(
            data.map((pr) => ({ author: pr.author, avatar_url: pr.profiles?.avatar_url ?? null })),
          );
        }
      });
  }, [uid]);

  const hasRecommendations = recommendations.length !== 0;
  const hasCreatedAt = !!createdAt;

  if (!hasRecommendations && !hasCreatedAt) return null;

  return (
    <>
      <Surface
        style={{
          flexDirection: "row",
          borderRadius: BorderRadius.lg,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
          width: "100%",
        }}
        elevation={1}
      >
        {hasRecommendations && (
          <TouchableRipple
            onPress={() => setShowRecommendsModal(true)}
            style={{ flex: 1, alignItems: "center", borderRadius: BorderRadius.md }}
          >
            <View style={{ alignItems: "center", paddingVertical: Spacing.xs }}>
              <View style={{ flexDirection: "row", minHeight: 32 }}>
                {recommendations.slice(0, 3).map((rec, i) => (
                  <View
                    key={rec.author}
                    style={{
                      marginLeft: i === 0 ? 0 : -Spacing.sm,
                      borderRadius: BorderRadius.full,
                      borderWidth: 2,
                      borderColor: theme.colors.surface,
                      zIndex: 3 - i,
                    }}
                  >
                    <ProfileImage
                      uid={rec.author}
                      avatar_url={rec.avatar_url}
                      style={{ width: 26, height: 26, borderRadius: BorderRadius.full }}
                    />
                  </View>
                ))}
              </View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Megbíznak benne
              </Text>
            </View>
          </TouchableRipple>
        )}

        {hasRecommendations && hasCreatedAt && (
          <View
            style={{ width: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: Spacing.xs }}
          />
        )}

        {hasCreatedAt && (
          <View style={{ flex: 1, alignItems: "center", paddingVertical: Spacing.xs }}>
            <View style={{ height: 28, justifyContent: "center" }}>
              <ThemedText variant="headlineSmall" style={{ fontWeight: "700", color: theme.colors.primary }}>
                {elapsedTime(Date.parse(createdAt!.toString()))}
              </ThemedText>
            </View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Fife
            </Text>
          </View>
        )}
      </Surface>

      {!!fullName && (
        <Portal>
          <RecommendationsModal
            show={showRecommendsModal}
            setShow={setShowRecommendsModal}
            uid={uid}
            name={fullName}
          />
        </Portal>
      )}
    </>
  );
}
