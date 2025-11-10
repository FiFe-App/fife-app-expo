import React, { useCallback, useEffect, createContext, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTutorialStep, setTutorialActive } from "@/redux/reducers/tutorialReducer";
import {
  View,
  StyleSheet, Dimensions
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { RootState } from "@/redux/store";
import { Button } from "../Button";
import { theme } from "@/assets/theme";
import Smiley from "../Smiley";

const dimensions = Dimensions.get("screen");

// Context type
export type TutorialContextType = {
  handleNextTutorialStep: () => void;
};

// Context
export const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const tutorialSteps: { message?: string; description?: string; key?: string; page: string }[] = [
  {
    message: "Üdvözöllek a FiFe Appban!",
    description: "Ez egy bemutató a funkciókról, átugorhatod ha akarod.",
    page: "/home"
  },    
  {
    key:"first-user",
    message: "Ez a főoldal, itt láthatod az újonan regisztrált tagokat, és hogy mihez értenek",
    page: "/home"
  },
  {
    key: "biznisz",
    message: "A bizniszeket itt, alul találod.",
    page: "/home"
  },
  {
    message: "Ez a biznisz kereső oldal",
    description:"Itt kereshetsz a környékeden segítséget.",
    page: "/biznisz"
  },
  {
    key:"first-biznisz",
    message: "Ez egy biznisz",
    description:"Láthatod, hogy az adott emberhez milyen témákban fordulhatsz.",
    page: "/biznisz"
  },
  {
    key: "filter",
    message: "Ha egy külön helyen keresnél, az kiválaszthatod ezzel a gombbal.",
    page: "/biznisz"
  },
  {
    key: "map-switch",
    message:"Térkép",
    description: "Ezeket a találatokat láthatod térképen is, ha erre a gombra nyomsz.",
    page: "/biznisz"
  },
  {
    key: "user",
    message: "A profil oldalon a saját adataidat láthatod",
    page: "/biznisz"
  },
  {
    key:"edit-profile",
    message:
        "Itt szerkesztheted a elérhetőségeid, adataid.",
    page: "/user"
  },
  {
    key:"user-biznisz-tabs",
    message:
        "Itt láthatod a bizniszeidet.",
    page: "/user"
  },
  {
    message:
        "Ennyi volt a bemutató, nézz körül!",
    page: "/user"
  },
];

const TutorialOverlay = ({ children }: { children?: ReactNode }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const user = useSelector(
    (state: RootState) => state.user,
  );
  const layout = {
    width: dimensions.width - insets.left - insets.right,
    height: dimensions.height - insets.top - insets.bottom,
  };
  const pathname = usePathname();
  const { tutorialStep, isTutorialActive, tutorialLayouts } = useSelector(
    (state: RootState) => state.tutorial
  );
  //dispatch(setTutorialActive(true));
  //dispatch(setTutorialStep(0));

  const currentStep = tutorialSteps[tutorialStep];
  const highlight = tutorialLayouts?.[currentStep.key as string] || {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  const radius = 8;

  const handlePrev = useCallback(() => {
    const prevStep = tutorialSteps?.[tutorialStep - 1];
    if (tutorialStep > 0) {
      if (currentStep.page != prevStep.page) {
        router.navigate(prevStep.page);
        // Optionally, you may want to delay the step change until after navigation
        setTimeout(() => {
          dispatch(setTutorialStep(tutorialStep - 1));
        }, 300);
      } else {
        dispatch(setTutorialStep(tutorialStep - 1));
      }
    } else {
      dispatch(setTutorialActive(false)); // End tutorial
    }
  }, [dispatch, tutorialStep, tutorialSteps]);

  const handleNext = useCallback(() => {
    const nextStep = tutorialSteps[tutorialStep + 1];
    if (tutorialStep < tutorialSteps.length - 1) {
      dispatch(setTutorialStep(tutorialStep + 1));
      if (currentStep.page != nextStep.page)
        router.navigate(nextStep.page);
    } else {
      dispatch(setTutorialActive(false)); // End tutorial
    }
  },[dispatch, tutorialStep, tutorialSteps.length]);

  useEffect(() => {
    if (pathname == "/"+currentStep?.key) {
      handleNext();
    }
  }, [currentStep?.key, handleNext, pathname]);

  console.log(isTutorialActive, pathname);
  
  if (isTutorialActive && user && pathname != "/" && pathname != "/login" && pathname != "/csatlakozom")
    return (
      <TutorialContext.Provider value={{ handleNextTutorialStep: handleNext }}>
        <Animated.View
          entering={FadeIn.delay(1000)}
          exiting={FadeOut}
          style={[styles.overlay]}
          pointerEvents="none"
        >
          <View
            pointerEvents="auto"
            style={[
              styles.dimmed,
              styles.absolute,
              {
                top: -insets.top,
                height: highlight.y + insets.top,
                width: "100%",
              },
            ]}
          />

          {/* Transparent "hole" */}
          {!!highlight.height && (
            <View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  flexDirection: "row",
                  top: highlight.y,
                  height: highlight.height,
                  width: "100%",
                },
              ]}
            >
              {currentStep.key && <View
                pointerEvents="auto"
                style={[
                  styles.dimmed,
                  {
                    width: highlight.x,
                  },
                ]}
              />}
              <View
                pointerEvents="none"
                style={[
                  {
                    width: highlight.width,
                    height: highlight.height,
                    zIndex: 100,
                  },
                ]}
              />
              <View
                pointerEvents="auto"
                style={[
                  styles.dimmed,
                  {
                    width: layout.width - highlight.width - highlight.x,
                  },
                ]}
              />
            </View>
          )}
          <View
            pointerEvents="auto"
            style={[
              styles.dimmed,
              styles.absolute,
              {
                top: highlight.y + highlight.height,
                bottom: -insets.bottom,
                width: "100%",
              },
            ]}
          />
          {currentStep.key && <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: highlight.x - radius / 2,
              top: highlight.y - radius / 2,
              width: highlight.width + radius,
              height: highlight.height + radius,
              borderWidth: 4,
              zIndex: 100,
              borderRadius: radius,
              borderColor: "white",
            }}
          />}
          <View
            pointerEvents="auto"
            style={{
              alignItems: "center",
              position: "absolute",
              // Place text below highlight if highlight is in top half, otherwise above
              top:
                layout.height / 2 > highlight.y + highlight.height / 2
                  ? highlight.y + highlight.height + 20
                  : undefined,
              bottom:
                layout.height / 2 <= highlight.y + highlight.height / 2
                  ? layout.height - highlight.y + 20
                  : undefined,
            }}
          >
            <Smiley style={{marginBottom:8}} />
            {/* Tutorial message */}
            <ThemedText style={[styles.message,{color:theme.colors.onSecondary}]} type="defaultSemiBold" variant="headlineMedium">{currentStep.message}</ThemedText>
            {currentStep.description && <ThemedText style={[styles.message,{color:theme.colors.onSecondary}]} variant="headlineSmall">{currentStep.description}</ThemedText>
            }
            {/* Next button */}
            <View style={{ flexDirection: "row", gap: 24 }}>
              <Button
                mode="elevated"
                onPress={handlePrev}>
                {tutorialStep > 0 ? "Vissza" : "Átugrom"}
              </Button>
              <Button
                mode="contained"
                onPress={handleNext}>
                {tutorialStep < tutorialSteps.length - 1
                  ? "Következő"
                  : "Gyerünk fifézni!"}
              </Button>
            </View>
          </View>
        </Animated.View>
        {children}
      </TutorialContext.Provider>
    );

  // Render children if overlay is not active
  return <TutorialContext.Provider value={{ handleNextTutorialStep: handleNext }}>{children}</TutorialContext.Provider>;
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    overflow:"hidden"
  },
  dimmed: {
    backgroundColor: "#000000de",
  },
  absolute: {
    position: "absolute",
  },
  message: {
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: "#ff0033",
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 22,
  },
});

export default TutorialOverlay;
