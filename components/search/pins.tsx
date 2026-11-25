import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { NearestProfile } from "@/redux/store.type";
import { AVATARS_BUCKET, getAvatarPath, getAvatarThumbnailPath } from "@/lib/functions/avatarPaths";
import { supabase } from "@/lib/supabase/supabase";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Marker, type MapMarkerProps } from "../mapView/mapView";
import { Icon } from "react-native-paper";

const FIFE_PIN = 44;

/** A biznisz on the map: the app's marker, bigger when picked. */
export const BuzinessPin = ({ selected }: { selected: boolean }) => (
  <View style={{ transform: [{ scale: selected ? 1.5 : 1 }] }}>
    <NewMarkerIcon />
  </View>
);

const SLIMEY = require("@/assets/images/Slimey.png");

/** Where the (small) picture of a profile is: its thumbnail, else the original. */
const avatarUrls = (uid: string, avatarUrl?: string | null) => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http")) return { thumbnail: avatarUrl, full: avatarUrl };
  const url = (path: string) => supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl;
  return {
    thumbnail: url(getAvatarThumbnailPath(uid, avatarUrl)),
    full: url(getAvatarPath(uid, avatarUrl)),
  };
};

/** The pictures to have in the cache before the pins ask for them (thumbnails only). */
export const avatarThumbnailUrls = (profiles: Pick<NearestProfile, "id" | "avatar_url">[]) =>
  profiles.flatMap((p) => {
    const urls = avatarUrls(p.id, p.avatar_url);
    return urls ? [urls.thumbnail] : [];
  });

/**
 * A fife on the map: their profile picture, ringed when picked. A pin is a picture the map takes
 * of the view, so it has no spinner and no network wait of its own: the thumbnail (cached, see
 * avatarThumbnailUrls), the original if there is none, and the one shared smiley for the people
 * without a picture — a bundled asset, there at once. `onSettled` tells the marker when the
 * picture is final, so it can stop redrawing itself.
 */
export const FifePin = ({
  profile,
  selected,
  onSettled,
}: {
  profile: NearestProfile;
  selected: boolean;
  onSettled?: () => void;
}) => {
  const theme = useAppTheme();
  const urls = avatarUrls(profile.id, profile.avatar_url);
  // 0: the thumbnail, 1: the original, 2: the smiley (nothing loaded).
  const [stage, setStage] = useState(0);
  const source = !urls || stage >= 2 ? SLIMEY : stage === 0 ? urls.thumbnail : urls.full;

  useEffect(() => {
    if (source === SLIMEY) onSettled?.();
  }, [source, onSettled]);

  return (
    <View
      style={{
        width: FIFE_PIN,
        height: FIFE_PIN,
        borderRadius: BorderRadius.full,
        borderWidth: selected ? 4 : 2,
        borderColor: selected ? theme.colors.primary : theme.colors.background,
        overflow: "hidden",
        backgroundColor: theme.colors.surfaceVariant,
        transform: [{ scale: selected ? 1.2 : 1 }],
      }}
    >
      <Image
        source={source}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
        onLoad={onSettled}
        onError={() => {
          setStage((current) => (current + 1 >= 2 || !urls || urls.full === urls.thumbnail ? 2 : current + 1));
        }}
      />
    </View>
  );
};

/**
 * A marker that redraws itself only while it has to. A map marker with a custom view is a
 * snapshot of that view: left on tracking it is redrawn every frame (slow with many pins), and
 * stopped too early it keeps a half-loaded picture. So it tracks until the picture is `settled`
 * and for a moment after the selection changes (the pin grows or shrinks), then stops.
 */
export const PinMarker = ({
  settled = true,
  selected,
  ...props
}: MapMarkerProps & { settled?: boolean; selected: boolean }) => {
  // The `selected` the snapshot has caught up with.
  const [caughtUp, setCaughtUp] = useState<boolean | null>(null);
  useEffect(() => {
    if (!settled) return;
    const timer = setTimeout(() => setCaughtUp(selected), 400);
    return () => clearTimeout(timer);
  }, [selected, settled]);

  return <Marker {...props} tracksViewChanges={!settled || caughtUp !== selected} />;
};

/** The marker of a fife: tracks its view until the picture has come. */
export const FifeMarker = ({
  profile,
  selected,
  ...props
}: MapMarkerProps & { profile: NearestProfile; selected: boolean }) => {
  const [settled, setSettled] = useState(false);
  const onSettled = useCallback(() => setSettled(true), []);
  return (
    <PinMarker {...props} selected={selected} settled={settled}>
      <FifePin profile={profile} selected={selected} onSettled={onSettled} />
    </PinMarker>
  );
};

/** A request on the map: a heart in a circle, bigger and ringed when picked. */
export const RequestPin = ({ selected, solved }: { selected: boolean; solved: boolean }) => {
  const theme = useAppTheme();
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: selected ? 4 : 2,
        borderColor: selected ? theme.colors.onPrimary : theme.colors.background,
        backgroundColor: solved ? theme.colors.nature : theme.colors.primary,
        transform: [{ scale: selected ? 1.25 : 1 }],
      }}
    >
      <Icon source="hand-heart" size={20} color={theme.colors.onPrimary} />
    </View>
  );
};
