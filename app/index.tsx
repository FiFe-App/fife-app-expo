import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { ScrollView, StyleSheet, View } from "react-native";
import { Image, ImageSource } from "expo-image";
import { Text } from "react-native-paper";
import { ThemedInput as TextInput } from "@/components/ThemedInput";
import { useBreakpoint } from "@/components/layout/ResponsiveLayout";
import { Link, Redirect } from "expo-router";
import { useState } from "react";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { useSelector } from "react-redux";
import Smiley from "@/components/Smiley";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const Header = () => {
  return (
    <ThemedView style={styles.headerRow} type="default">
      <View style={styles.flex1}>
        <LanguageSwitcher variant="icon" />
      </View>

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
  const { t } = useTranslation();
  return (
    <View style={{ paddingTop: 32, marginHorizontal: screenPadding }}>
      <Text variant="displayMedium">
        {t("landing.hero.title")}
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
            {t("landing.hero.subtitle")}
          </Text>
          <Link asChild href="/csatlakozom">
            <Button style={styles.loginButton} type="secondary" big>
              {t("landing.hero.register")}
            </Button>
          </Link>
          <Link asChild href="/login">
            <Button style={styles.loginButton} mode="contained" big>
              {t("landing.hero.login")}
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
  image: ImageSource;
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
  const { t } = useTranslation();
  return (
    <View style={{ marginHorizontal: screenPadding }}>
      <Text variant="displayMedium">{t("landing.howItWorks.title")}</Text>
      <View style={{ paddingHorizontal: isDesktop ? 64 : 4 }}>
        <View
          style={[{ gap: 16 }, isDesktop ? styles.rowWrap : styles.colStack]}
        >
          <StepItem
            image={require("../assets/images/Funkcio1.png")}
            title={t("landing.howItWorks.step1Title")}
            description={t("landing.howItWorks.step1Description")}
          />
          <StepItem
            image={require("../assets/images/Funkcio 2.png")}
            title={t("landing.howItWorks.step2Title")}
            description={t("landing.howItWorks.step2Description")}
          />
          <StepItem
            image={require("../assets/images/Funkcio1.png")}
            title={t("landing.howItWorks.step3Title")}
            description={t("landing.howItWorks.step3Description")}
          />
        </View>
      </View>
    </View>
  );
};

const Trust = () => {
  const { isDesktop, screenPadding } = useBreakpoint();
  const { t } = useTranslation();
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
            {t("landing.trust.title")}
          </Text>
          <Text variant="bodyLarge">
            {t("landing.trust.description")}
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
  const { t } = useTranslation();
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
          <Text variant="displayMedium">{t("landing.about.title")}</Text>
          <Text variant="bodyLarge">
            {t("landing.about.description")}
          </Text>
        </View>
      </ThemedView>
    </View>
  );
};

const Banner = () => {
  const { isDesktop } = useBreakpoint();
  const { t } = useTranslation();
  const [height, setHeight] = useState(100);

  return (
    <ThemedView
      responsive={600}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
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
          {t("landing.banner.title")}
        </Text>
      </View>
      <Link href="/csatlakozom" asChild>
        <Button mode="contained">{t("landing.banner.register")}</Button>
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
            source={require("../assets/images/Phone.png")}
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
  const { t } = useTranslation();
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
          <Text variant="displayMedium">{t("landing.aboutMe.title")}</Text>
          <Text variant="bodyLarge">
            {t("landing.aboutMe.description")}
          </Text>
          <ThemedView responsive={1000} style={{ gap: 16, zIndex: 10 }}>
            <Link href="/projekt" asChild>
              <Button type="secondary" big>
                {t("landing.aboutMe.joinProject")}
              </Button>
            </Link>
            <Link href="https://www.patreon.com/c/fifeapp" asChild>
              <Button mode="contained" big>
                {t("landing.aboutMe.patreon")}
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
          source={require("../assets/Logo.png")}
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
    <ScrollView style={{ flex: 1 }}>
      <Header />
      <ThemedView type="default" style={{ flex: 1, alignItems: "center" }}>
        <View style={{ flex: 1, gap: 16, maxWidth: 1000 }}>
          <Hero />
          <HowItWorks />
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
