import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { ThemedInput as TextInput } from "@/components/ThemedInput";
import { useBreakpoint } from "@/components/layout/ResponsiveLayout";
import { Link, Redirect, useNavigation } from "expo-router";
import { useEffect } from "react";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { useDispatch, useSelector } from "react-redux";
import Smiley from "@/components/Smiley";
import { useAppTheme } from "@/assets/theme";
import { setStatusBarColor } from "@/redux/reducers/infoReducer";
import { Logo } from "@/components/Logo";

export const Header = () => {
  const theme = useAppTheme();
  return (
    <ThemedView style={[styles.headerRow, { borderBottomColor: theme.colors.outlineVariant }]} type="default">
      <View style={styles.flex1} />

      <View style={styles.centerRow}>
        <View style={styles.titleRow}>
          <Logo style={{ width: 239, height: 40, zIndex: 20 }} />
        </View>
      </View>
      <View style={styles.flex1} />
    </ThemedView>
  );
};

const Hero = () => {
  const { isDesktop, screenPadding } = useBreakpoint();
  return (
    <View style={{ paddingTop: Spacing.xxxl, marginHorizontal: screenPadding }}>
      <Text variant="displayMedium" style={{textAlign:"left"}}>
        Találj megbízható társakat a környékeden!
      </Text>
      <ThemedView
        style={[{ paddingVertical: Spacing.lg, alignItems: "center" }]}
        responsive={800}
      >
        <View
          style={[
            isDesktop && [
              styles.flex1,
              { maxWidth: 400, paddingHorizontal: 40 },
            ],
            { gap: Spacing.lg, width: "100%", alignItems: "center" },
          ]}
        >
          <Text variant="headlineMedium">
            Fedezd fel a segítői hálózatot a zsebedben
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

const Trust = () => {
  const { isDesktop, screenPadding } = useBreakpoint();
  return (
    <View style={{ marginHorizontal: screenPadding }}>
      <ThemedView
        style={[{ paddingVertical: Spacing.lg, alignItems: "flex-start" }]}
        responsive={800}
      >
        <View
          style={[
            isDesktop && [styles.flex1, {}],
            { gap: Spacing.lg, width: "100%", alignItems: "center" },
          ]}
        >
          <Text variant="displayMedium">
            Bizalom és biztonság
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
        style={[{ paddingVertical: Spacing.lg, alignItems: "flex-start", gap: Spacing.xxxl }]}
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
            { gap: Spacing.lg, width: "100%", alignItems: "center" },
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

  return (
    <ThemedView
      //onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      style={{
        alignItems: "center",
        justifyContent: "center",
        margin: Spacing.xl,
        padding: Spacing.xl,
        gap: Spacing.lg,
      }}
      type="card"
    >
      <View
        style={{
          gap: Spacing.lg,
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
        style={[{ paddingVertical: Spacing.lg, alignItems: "flex-start", gap: Spacing.xxxl }]}
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
            { gap: Spacing.lg, width: "100%", alignItems: "center" },
          ]}
        >
          <View style={{ width: "100%", padding: Spacing.xxl, gap: Spacing.lg }}>
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
    <View style={{ marginHorizontal: Spacing.xxxl }}>
      <ThemedView
        style={[{ paddingVertical: Spacing.lg, alignItems: "flex-start" }]}
        responsive={800}
      >
        <View
          style={[
            isDesktop && [styles.flex1, {}],
            { gap: Spacing.lg, width: "100%", alignItems: "flex-start", zIndex: 10 },
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
          <ThemedView responsive={1000} style={{ gap: Spacing.lg, zIndex: 10 }}>
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
      style={{ flexDirection: "row", padding: Spacing.xxxl }}
    >
      <View style={[styles.flex1, { flexDirection: "row", alignItems: "center", justifyContent: "center" }]}>
        <Smiley style={{ width: 40, height: 40, borderRadius: BorderRadius.sm, zIndex: 100000 }} />
        <Logo style={{ width: 180, height: 30, zIndex: 20 }} />
      </View>
    </ThemedView>
  );
};

export default function App() {
  const { uid }: UserState = useSelector((state: RootState) => state.user);
  const theme = useAppTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setStatusBarColor("red"));
    navigation.setOptions({ header: () => <ThemedView style={{flexDirection:"row",alignItems:"center",justifyContent:"center",padding:Spacing.xxxl,gap:Spacing.md}}>
          <Smiley style={{width:50,height:50}}/>
          <Logo style={{ minWidth: 200, minHeight: 55, zIndex: 20 }} />
        </ThemedView> });
  }, []);

  if (uid) return <Redirect href="/home" />;
  return (
    <ScrollView contentContainerStyle={{ backgroundColor: theme.colors.background }} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      
      <ThemedView type="default" style={{ alignItems: "center" }}>
        <View style={{ flex: 1, gap: Spacing.lg, maxWidth: 1000, width: "100%" }}>
          <Hero />
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
    padding: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: Spacing.xs,
    elevation: 2,
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
    borderRadius: BorderRadius.lg,
    width: "100%",
  },
  rowWrap: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  colStack: {
    flexDirection: "column",
  },
  stepCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.xs,
  },
  stepCol: {
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
});
