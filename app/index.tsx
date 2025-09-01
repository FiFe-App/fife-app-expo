import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { ThemedInput as TextInput } from "@/components/ThemedInput";
import { useBreakpoint } from "@/components/layout/ResponsiveLayout";
import { Link } from "expo-router";
import { useState } from "react";

const Header = () => {
  const { isDesktop } = useBreakpoint();
  return (
    <ThemedView style={styles.headerRow} type="default">
      <View style={styles.flex1} />

      <View style={styles.centerRow}>
        <View style={styles.titleRow}>
          <Image
            source={require("../assets/Logo.png")}
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
            Fedezz fel egy segítői hálózatot, ebben az új, közösségi
            alkalmazásban.
          </Text>
          <Link asChild href="/csatlakozom">
            <Button style={styles.loginButton} type="secondary" big>
              Regisztrálok
            </Button>
          </Link>
          <Link asChild href="/login">
            <Button style={styles.loginButton} mode="contained" big>
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
            source={require("../assets/images/HeroImage.png")}
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

// A single step in the "Hogyan működik?" section
const StepItem = ({
  image,
  title,
  description,
}: {
  image: any;
  title: string;
  description: string;
}) => {
  const { isDesktop } = useBreakpoint();
  return (
    <ThemedView
      style={[
        styles.stepCard,
        isDesktop ? styles.stepCol : styles.stepRow,
        isDesktop ? {} : { alignItems: "flex-start" },
      ]}
    >
      <Image
        source={image}
        contentFit="contain"
        style={
          isDesktop
            ? { width: "100%", height: 260 }
            : { height: 100, width: 100, marginRight: 12 }
        }
      />
      <View
        style={{
          flex: 1,
          alignItems: isDesktop ? "center" : "stretch",
          paddingTop: isDesktop ? 0 : 8,
        }}
      >
        <Text
          variant="headlineSmall"
          style={{
            textAlign: isDesktop ? "center" : "left",
          }}
        >
          {title}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ marginTop: 6, textAlign: isDesktop ? "center" : "left" }}
        >
          {description}
        </Text>
      </View>
    </ThemedView>
  );
};

const HowItWorks = () => {
  const { isDesktop, screenPadding } = useBreakpoint();
  return (
    <View style={{ marginHorizontal: screenPadding }}>
      <Text variant="displayMedium">Hogyan működik?</Text>
      <View style={{ paddingHorizontal: isDesktop ? 64 : 4 }}>
        <View
          style={[{ gap: 16 }, isDesktop ? styles.rowWrap : styles.colStack]}
        >
          <StepItem
            image={require("../assets/images/Funkcio1.png")}
            title="Csatlakozz hozzánk!"
            description="Hozd létre a profilod, és oszd meg az erőforrásaidat."
          />
          <StepItem
            image={require("../assets/images/Funkcio 2.png")}
            title="Keress segítséget!"
            description="Találj a környékeden tevékenykedő fiféket."
          />
          <StepItem
            image={require("../assets/images/Funkcio1.png")}
            title="Építs kapcsolatokat!"
            description="Jelöld meg kiket tartasz megbízhatónak."
          />
        </View>
      </View>
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
            source={require("../assets/images/trust-connections.png")}
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
      >
        <View
          style={[
            styles.flex1,
            styles.rightSide,
            {
              width: "100%",
              justifyContent: "center",
              order: isDesktop ? 0 : 3,
            },
          ]}
        >
          <Image
            source={require("../assets/images/Community.png")}
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
  const [height, setHeight] = useState(100);

  return (
    <ThemedView
      responsive={600}
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
      <ThemedView
        style={{
          position: "fixed",
          left: 0,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          height,
        }}
        type="card"
      />
      <View
        style={{
          gap: 16,
          maxWidth: 500,
          flexDirection: "row",
          flex: isDesktop ? 1 : undefined,
        }}
      >
        <Image
          source={require("../assets/images/Slimey.png")}
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
      <Link href="/csatlakozom">
        <Button mode="contained">Regisztrálok</Button>
      </Link>
    </ThemedView>
  );
};
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
      >
        <View
          style={[
            styles.flex1,
            styles.rightSide,
            { width: "100%", justifyContent: "center", flex: undefined },
          ]}
        >
          <Image
            source={require("../assets/images/Phone.png")}
            contentFit="contain"
            style={{ width: "100%", minHeight: 350, zIndex: 20 }}
          />
        </View>
        <View
          style={[
            isDesktop ? [styles.flex1] : { order: -1 },
            { gap: 16, width: "100%", alignItems: "center" },
          ]}
        >
          <View style={{ width: "100%", padding: 24, gap: 16 }}>
            <Text variant="labelLarge">Email címed</Text>
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
            ezek, kérlek támogasd a FiFe Appot!
          </Text>
          <ThemedView responsive={1000} style={{ gap: 16, zIndex: 10 }}>
            <Button type="secondary" big>
              Beszállnál a projektbe?
            </Button>
            <Link href="https://www.patreon.com/c/fifeapp">
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
            source={require("../assets/images/Trust.png")}
            contentFit="contain"
            style={{ width: "100%", minHeight: 350, zIndex: 5 }}
          />
        </View>
      </ThemedView>
    </View>
  );
};

const Footer = () => {
  return (
    <ThemedView
      responsive={600}
      type="card"
      style={{ flexDirection: "row", padding: 48 }}
    >
      <View style={styles.flex1}>
        <Text>Rólunk</Text>
      </View>
      <View style={styles.flex1}>
        <Text>Rólunk</Text>
      </View>
      <View style={styles.flex1}>
        <Text>Rólunk</Text>
      </View>
      <View style={styles.flex1}>
        <Image
          source={require("../assets/Logo.png")}
          style={{ width: 239, height: 40, zIndex: 20 }}
          contentFit="contain"
        />
      </View>
    </ThemedView>
  );
};

export default function App() {
  return (
    <ScrollView style={{ flex: 1 }}>
      <Header />
      <ThemedView type="default" style={{ flex: 1, alignItems: "center" }}>
        <View style={{ flex: 1, gap: 16, maxWidth: 1000 }}>
          <Hero />
          <HowItWorks />
          <Trust />
          <About />
          <Banner />
          <Newsletter />
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
    borderRadius: 16,
    gap: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  stepCol: {
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
});
