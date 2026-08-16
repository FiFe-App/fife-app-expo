import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import getMediaKind from "@/lib/functions/getMediaKind";
import { MediaDataType } from "@/redux/store.type";
import Slider from "@react-native-community/slider";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { ScrollView, StyleProp, View, ViewStyle } from "react-native";
import ImageModal from "react-native-image-modal";
import { Icon, IconButton, Surface, Text } from "react-native-paper";
import { ThemedText } from "../ThemedText";

const formatTime = (seconds?: number) => {
  if (!seconds || !isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface MediaViewProps {
  media: MediaDataType;
  /** Width of the tile. Audio cards stretch to it, image/video fill it. */
  width: number;
  /** Height of the image / video tile. Audio cards size themselves. */
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const VideoMediaView = ({
  uri,
  width,
  height,
  borderRadius = BorderRadius.lg,
}: {
  uri: string;
  width: number;
  height: number;
  borderRadius?: number;
}) => {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={{ width, height, borderRadius, backgroundColor: "black" }}
      contentFit="contain"
      nativeControls
      playsInline
      fullscreenOptions={{ enable: true }}
    />
  );
};

const AudioMediaView = ({
  uri,
  title,
  width,
}: {
  uri: string;
  title?: string;
  width: number;
}) => {
  const theme = useAppTheme();
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 0;

  useEffect(() => {
    // Without this the iOS silent switch mutes playback.
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    }).catch((error) => console.log("audio mode error", error));
  }, []);

  useEffect(() => {
    if (status.didJustFinish) {
      player.pause();
      player.seekTo(0).catch((error) => console.log("seek error", error));
    }
  }, [status.didJustFinish, player]);

  return (
    <Surface
      elevation={1}
      style={{
        width,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        gap: Spacing.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
        <Icon source="music-note" size={20} color={theme.colors.primary} />
        <Text
          variant="labelLarge"
          numberOfLines={1}
          style={{ flex: 1, color: theme.colors.onSurfaceVariant }}
        >
          {title || "Hangfelvétel"}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <IconButton
          mode="contained"
          icon={status.playing ? "pause" : "play"}
          disabled={!status.isLoaded}
          onPress={() => (status.playing ? player.pause() : player.play())}
          accessibilityLabel={status.playing ? "Szüneteltetés" : "Lejátszás"}
        />
        <View style={{ flex: 1 }}>
          <Slider
            style={{ width: "100%", height: 32 }}
            minimumValue={0}
            maximumValue={duration || 1}
            value={Math.min(status.currentTime || 0, duration || 1)}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.outlineVariant}
            thumbTintColor={theme.colors.primary}
            disabled={!status.isLoaded || !duration}
            onSlidingComplete={(value) =>
              player.seekTo(value).catch((error) => console.log("seek error", error))
            }
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatTime(status.currentTime)}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>
      </View>
    </Surface>
  );
};

/**
 * Renders one uploaded biznisz file: an image, a video or an audio player.
 */
const MediaView = ({
  media,
  width,
  height,
  borderRadius = BorderRadius.lg,
  style,
}: MediaViewProps) => {
  const kind = getMediaKind(media);

  if (kind === "video")
    return (
      <View style={style}>
        <VideoMediaView
          uri={media.url}
          width={width}
          height={height}
          borderRadius={borderRadius}
        />
      </View>
    );

  if (kind === "audio")
    return (
      <View style={[{ height, justifyContent: "center" }, style]}>
        <AudioMediaView
          uri={media.url}
          title={media.fileName || media.description || undefined}
          width={width}
        />
      </View>
    );

  return (
    <View style={style}>
      <ImageModal
        source={{ uri: media.url }}
        resizeMode="cover"
        modalImageResizeMode="contain"
        overlayBackgroundColor="#00000096"
        style={{ width, height, borderRadius }}
        renderFooter={() =>
          media.description ? (
            <ScrollView style={{ maxHeight: 250 }}>
              <ThemedText
                style={{
                  color: "white",
                  textShadowColor: "black",
                  textShadowRadius: 3,
                }}
              >
                {media.description}
              </ThemedText>
            </ScrollView>
          ) : (
            <View />
          )
        }
      />
    </View>
  );
};

export default MediaView;
