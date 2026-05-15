import { clearOptions } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { router, useNavigation, usePathname, useSegments } from "expo-router";
import React, { ReactNode, useRef } from "react";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { Appbar, Icon, Portal, Surface, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import BuzinessSearchInput from "./BuzinessSearchInput";
import { storeBuzinesses } from "@/redux/reducers/buzinessReducer";

export const MyAppbar = ({ center, title, style }: { center?: ReactNode, title?: string, style?: ViewStyle }) => {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const { options } = useSelector((state: RootState) => state.info);
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useDispatch();
  const segments = useSegments();
  const pathname = usePathname();
  const prevSegmentsKey = useRef<string | null>(null);

  useEffect(() => {
    const key = segments.join("/");
    if (prevSegmentsKey.current !== null && prevSegmentsKey.current !== key) {
      dispatch(clearOptions());
    }
    prevSegmentsKey.current = key;
  }, [dispatch, segments]);


  return (
    <>
      <Appbar.Header
        mode="center-aligned"
        style={[{
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          width: "100%"
        }, style]}
      >
        <View style={{ width: 48 }} >
          {
            navigation.canGoBack() && pathname !== "/home" && pathname !== "/" 
            && <Appbar.BackAction onPress={navigation.goBack} />
          }
        </View>
        {center ? <View style={{ flex: 1 }}>{center}</View>
          : title ?
            <Appbar.Content titleStyle={{ fontFamily: "Piazzolla-ExtraBold", fontSize: 20 }} title={title} style={{ flex: 1 }} />
            : <BuzinessSearchInput 
            onSearch={() => {
              dispatch(storeBuzinesses([]));
              router.push("/biznisz");
            }} /> }
        {options.length > 0 ? (
          <>
            {options?.length === 1 && <Appbar.Action {...options[0]} />}
            {options?.length > 1 && (
              <Appbar.Action
                icon="dots-vertical"
                onPress={() => setShowMenu(true)}
              />
            )}
          </>
        ) : <View style={{ width: 48 }} />}
      </Appbar.Header>

      {showMenu && (
        <Portal>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowMenu(false)}
          >
            <Surface
              style={{
                position: "absolute",
                top: Spacing.xxxl + Spacing.xl,
                right: Spacing.sm,
                borderRadius: BorderRadius.md,
                paddingVertical: Spacing.xs,
                elevation: 4,
              }}
            >
              {options.map((option, ind) => (
                <Pressable
                  key={"option" + ind}
                  onPress={() => {
                    setShowMenu(false);
                    option.onPress?.();
                  }}
                  disabled={option.disabled}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: Spacing.md,
                    paddingHorizontal: Spacing.lg,
                    gap: Spacing.md,
                    opacity: option.disabled ? 0.5 : 1,
                    backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent",
                  })}
                >
                  {option.icon && <Icon source={option.icon} size={20} color={theme.colors.onSurface} />}
                  <Text variant="bodyMedium">{option.title}</Text>
                </Pressable>
              ))}
            </Surface>
          </Pressable>
        </Portal>
      )}
    </>
  );
};
