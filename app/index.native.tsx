import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { Link, Redirect, Stack } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { Button } from "@/components/Button";
import { useAppTheme } from "@/assets/theme";
import { Spacing } from "@/constants/spacing";

export default function NativeLanding() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const theme = useAppTheme();

  if (uid) return <Redirect href="/home" />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/Logo.png")}
          style={{ width: 239, height: 40 }}
          contentFit="contain"
        />
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require("@/assets/images/HeroImage.png")}
          contentFit="contain"
          style={styles.heroImage}
        />
      </View>

      <Text variant="displayMedium" style={styles.motto}>
        Találj megbízható társakat a környékeden!
      </Text>

      <View style={{ flex: 1 }} />

      <View style={styles.buttonsContainer}>
        <Link asChild href="/csatlakozom">
          <Button type="secondary" big style={styles.fullWidth}>
            Regisztrálok
          </Button>
        </Link>
        <Link asChild href="/login">
          <Button mode="text" big>
            Bejelentkezem
          </Button>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
  },
  logoContainer: {
    alignItems: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginTop: Spacing.xxl,
  },
  heroImage: {
    width: "115%",
    height: 280,
  },
  motto: {
    textAlign: "center",
    marginTop: Spacing.xl,
  },
  buttonsContainer: {
    gap: Spacing.md,
    alignItems: "stretch",
  },
  fullWidth: {
    width: "100%",
  },
});
