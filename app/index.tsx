import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { ScrollView, Platform, StyleSheet, View } from "react-native";
import { Image, ImageSource } from "expo-image";
import { Text } from "react-native-paper";
import { ThemedInput as TextInput } from "@/components/ThemedInput";
import { useBreakpoint } from "@/components/layout/ResponsiveLayout";
import { Link, Redirect } from "expo-router";
import { useState, useRef } from "react";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { useSelector } from "react-redux";
import Smiley from "@/components/Smiley";
import { theme } from "@/assets/theme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

export const Header = () => {
  return (
    <ThemedView style={styles.headerRow} type="default">
      <View style={styles.flex1} />

      <View style={styles.centerRow}>
        <View style={styles.titleRow}>
          <Image
            source={require("@/assets/Logo.png")}
            style={{ width: 239, height: 40, zIndex: 20 }}
            contentFit="contain"
          />
        </View>
      </View>
      <View style={styles.flex1} />
    </ThemedView>
  );
};

const Hero = () => {
  const { isDesktop, screenPadding } = useBreakpoint();
  return (
    <View style={{ paddingTop: 32, marginHorizontal: screenPadding }}>
      <Text variant="displayMedium">
        Találj megbízható embereket a környékeden!
      </Text>
      <ThemedView
        style={[{ paddingVertical: 16, alignItems: "center" }]}
        responsive={800}
      >
        <View
          style={[
            isDesktop && [
              styles.flex1,
              { maxWidth: 400, paddingHorizontal: 40 },
            ],
            { gap: 16, width: "100%", alignItems: "center" },
          ]}
        >
          <Text variant="headlineMedium">
            Építs magad köré segítői hálózatot ebben az új, közösségi
            alkalmazásban.
          </Text>
          <Link asChild href="/csatlakozom">
            <Button style={styles.loginButton} type="secondary">
              Regisztrálok
            </Button>
          </Link>
          <Link asChild href="/login">
            <Button style={styles.loginButton} mode="contained">
              Bejelentkezem
            </Button>
          </Link>
        </View>
        <View
          style={[
            styles.flex1,
            styles.rightSide,
            { width: "100%", alignItems: "center" },
          ]}
        >
          <Image
            source={require("@/assets/images/HeroImage.png")}
            contentFit="contain"
            style={{
              width: isDesktop ? "100%" : "115%",
              minHeight: isDesktop ? 350 : 250,
              zIndex: 20,
            }}
          />
        </View>
      </ThemedView>
    </View>
  );
};

const SCROLL_BUSINESSES = [
  { name: "Visszaviszem a 50 forintos palackokat", color: "#5A7A5A" },
  { name: "Dalolászás", color: "#7A5EA7" },
  { name: "Taxi", color: "#B85450" },
  { name: "Kézműves Tecno", color: "#4472A8" },
  { name: "Kerti kisegítő", color: "#C47A2A" },
  { name: "Házi főzőnő", color: "#A65E7A" },
  { name: "Kutya sétáltatás", color: "#3A8A9E" },
  { name: "Bicigli javítás", color: "#6A8040" },
  { name: "Angolóra", color: "#7A5E48" },
];

const BusinessScrollSection = () => {
  const translateX = useSharedValue(0);
  const hasStarted = useRef(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = (e: any) => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    const halfWidth = e.nativeEvent.layout.width / 2;
    translateX.value = withRepeat(
      withTiming(-halfWidth, {
        duration: halfWidth * 14,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  };

  return (
    <View style={{ overflow: "hidden", paddingVertical: 20, backgroundColor: theme.colors.surfaceVariant }}>
      <Animated.View
        style={[{ flexDirection: "row", alignItems: "center" }, animatedStyle]}
        onLayout={onLayout}
      >
        {[...SCROLL_BUSINESSES, ...SCROLL_BUSINESSES].map((b, i) => (
          <View
            key={i}
            style={{
              backgroundColor: b.color,
              marginHorizontal: 8,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 999,
            }}
          >
            <Text variant="titleMedium" style={{ color: "#fff" }}>{b.name}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const Trust = () => {
  const { isDesktop, screenPadding } = useBreakpoint();
  return (
    <View style={{ marginHorizontal: screenPadding }}>
      <ThemedView
        style={[{ paddingVertical: 16, alignItems: "flex-start" }]}
        responsive={800}
      >
        <View
          style={[
            isDesktop && [styles.flex1, {}],
            { gap: 16, width: "100%", alignItems: "center" },
          ]}
        >
          <Text variant="displayMedium">
            Találj megbízható embereket a környékeden!
          </Text>
          <Text variant="bodyLarge">
            A FiFe App bizalmi láncot épít fel. Ha valakiben megbíznak a
            barátaid, te is bízhatsz benne. Így épül fel a közösség, amelyre
            számíthatsz.
          </Text>
        </View>
        <View
          style={[
            styles.flex1,
            styles.rightSide,
            { width: "100%", justifyContent: "center" },
          ]}
        >
          <Image
            source={require("@/assets/images/trust-connections.png")}
            contentFit="contain"
            style={{
              width: "100%",
              minHeight: 150,
              zIndex: 20,
            }}
          />
        </View>
      </ThemedView>
    </View>
  );
};
const About = () => {
  const { isDesktop, screenPadding } = useBreakpoint();
  return (
    <View style={{ marginHorizontal: screenPadding }}>
      <ThemedView
        style={[{ paddingVertical: 16, alignItems: "flex-start", gap: 32 }]}
        responsive={800}
        reverseOnCol
      >
        <View
          style={[
            styles.flex1,
            styles.rightSide,
            {
              width: "100%",
              justifyContent: "center",
            },
          ]}
        >
          <Image
            source={require("@/assets/images/Community.png")}
            contentFit="contain"
            style={{ width: "100%", minHeight: 350, zIndex: 20 }}
          />
        </View>
        <View
          style={[
            isDesktop && [styles.flex1],
            { gap: 16, width: "100%", alignItems: "center" },
          ]}
        >
          <Text variant="displayMedium">Kérjünk egymástól segítséget!</Text>
          <Text variant="bodyLarge">
            A FiFe App célja, hogy a nagyvárosokban is megteremtse a
            kisközösségek biztonságát, közelségét. Egy levegőt szívunk, tartsunk
            össze! Legyen újra normális, hogy számíthatunk egymásra!
          </Text>
        </View>
      </ThemedView>
    </View>
  );
};

const Banner = () => {
  const { isDesktop } = useBreakpoint();
  const [height, setHeight] = useState(20);

  return (
    <ThemedView
      //onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      style={{
        alignItems: "center",
        justifyContent: "center",
        margin: 20,
        padding: 20,
        gap: 16,
      }}
      type="card"
    >
      <View
        style={{
          gap: 16,
          maxWidth: 500,
          flexDirection: "row",
          flex: isDesktop ? 1 : undefined,
        }}
      >
        <Image
          source={require("@/assets/images/Slimey.png")}
          style={{ width: 40, height: 40, zIndex: 20 }}
          contentFit="contain"
        />
        <Text
          variant="headlineSmall"
          style={{
            textAlign: isDesktop ? "center" : "left",
          }}
        >
          Csatlakozz egy innovatív közösséghez!
        </Text>
      </View>
      <Link href="/csatlakozom" asChild>
        <Button mode="contained">Regisztrálok</Button>
      </Link>
    </ThemedView>
  );
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Newsletter = () => {
  const { isDesktop, screenPadding } = useBreakpoint();
  return (
    <View style={{ marginHorizontal: screenPadding }}>
      <Text variant="displayMedium">
        Ne maradj le, iratkozz fel a hírlevélre!
      </Text>
      <ThemedView
        style={[{ paddingVertical: 16, alignItems: "flex-start", gap: 32 }]}
        responsive={800}
        reverseOnCol
      >
        <View
          style={[
            styles.flex1,
            styles.rightSide,
            { width: "100%", justifyContent: "center", flex: undefined },
          ]}
        >
          <Image
            source={require("@/assets/images/Phone.png")}
            contentFit="contain"
            style={{ width: "100%", minHeight: 350, zIndex: 20 }}
          />
        </View>
        <View
          style={[
            isDesktop ? [styles.flex1] : {},
            { gap: 16, width: "100%", alignItems: "center" },
          ]}
        >
          <View style={{ width: "100%", padding: 24, gap: 16 }}>
            <Text variant="labelLarge">E-mail címed</Text>
            <TextInput mode="outlined" placeholder="email@fifeapp.hu" />
            <Text variant="labelLarge">Üzenet (opcionális)</Text>
            <TextInput
              numberOfLines={5}
              multiline
              mode="outlined"
              placeholder="Mit gondolsz?"
            />
            <View style={{ alignItems: "flex-end" }}>
              <Button type="secondary" big>
                Küldés
              </Button>
            </View>
          </View>
        </View>
      </ThemedView>
    </View>
  );
};
const AboutMe = () => {
  const { isDesktop } = useBreakpoint();
  return (
    <View style={{ marginHorizontal: 32 }}>
      <ThemedView
        style={[{ paddingVertical: 16, alignItems: "flex-start" }]}
        responsive={800}
      >
        <View
          style={[
            isDesktop && [styles.flex1, {}],
            { gap: 16, width: "100%", alignItems: "flex-start", zIndex: 10 },
          ]}
        >
          <Text variant="displayMedium">A FiFe App mögött</Text>
          <Text variant="bodyLarge">
            Szia, én Kristóf Ákos vagyok, néhány éve lett egy elképzelésem, hogy
            létrehozok egy valóban hasznos és biztonságos közösségi oldalt.
            Azóta sok idő eltelt, de a lelkesedésem nem tűnt el! Én a magyar
            közösségért és egy szebb jövőért dolgozom. Ha neked is fontosak
            ezek, kérlek, támogasd a FiFe Appot!
          </Text>
          <ThemedView responsive={1000} style={{ gap: 16, zIndex: 10 }}>
            <Link href="/projekt" asChild>
              <Button type="secondary" big>
                Beszállnál a projektbe?
              </Button>
            </Link>
            <Link href="https://www.patreon.com/c/fifeapp" asChild>
              <Button mode="contained" big>
                Patreon
              </Button>
            </Link>
          </ThemedView>
        </View>
        <View
          style={[
            styles.flex1,
            styles.rightSide,
            {
              width: "100%",
              maxWidth: 350,
              justifyContent: "center",
              zIndex: 5,
            },
          ]}
        >
          <Image
            source={require("@/assets/images/Trust.png")}
            contentFit="contain"
            style={{ width: "100%", minHeight: 350, zIndex: 5 }}
          />
        </View>
      </ThemedView>
    </View>
  );
};

export const Footer = () => {
  return (
    <ThemedView
      responsive={600}
      type="card"
      style={{ flexDirection: "row", padding: 48 }}
    >
      <View style={[styles.flex1, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
        <Smiley style={{ width: 40, height: 40, borderRadius: 6, zIndex: 100000 }} />
        <Image
          source={require("@/assets/Logo.png")}
          style={{ width: 180, height: 30, zIndex: 20 }}
          contentFit="contain"
        />
      </View>
    </ThemedView>
  );
};

export default function App() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  if (uid) return <Redirect href="/home" />;
  return (
    <ScrollView contentContainerStyle={{ backgroundColor: theme.colors.background }} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView type="default" style={{ alignItems: "center" }}>
        <View style={{ flex: 1, gap: 16, maxWidth: 1000, width: "100%" }}>
          <Hero />
          <BusinessScrollSection />
          <Trust />
          <About />
          <Banner />
          <AboutMe />
        </View>
      </ThemedView>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderBottomColor: "rgba(0,0,0,0.06)",
    borderBottomWidth: 0.5,
  },
  flex1: { flex: 1 },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightSide: {
    flex: 1,
    alignItems: "flex-end",
  },
  loginButton: {
    borderRadius: 12,
    width: "100%",
  },
});
