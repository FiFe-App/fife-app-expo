import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleProp, ViewStyle, TextStyle } from "react-native";
import { HelperText, TextInput } from "react-native-paper";
import { supabase } from "@/lib/supabase/supabase";
import { useTranslation } from "react-i18next";

export interface UsernameInputProps {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle | TextStyle>;
  excludeUid?: string; // allow existing username for this uid
  onAvailabilityChange?: (available: boolean | undefined) => void;
}

export const UsernameInput: React.FC<UsernameInputProps> = ({
  label,
  value,
  onChangeText,
  disabled,
  style,
  excludeUid,
  onAvailabilityChange,
}) => {
  const { t } = useTranslation();
  const [available, setAvailable] = useState<boolean | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);

  const normalized = useMemo(() => value?.trim(), [value]);

  useEffect(() => {
    if (onAvailabilityChange) onAvailabilityChange(available);
  }, [available, onAvailabilityChange]);

  useEffect(() => {
    // Reset when empty or too short
    if (!normalized || normalized.length < 3) {
      setAvailable(undefined);
      setChecking(false);
      return;
    }
    setChecking(true);
    // Debounce the lookup
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("username", normalized);
        if (error) {
          setAvailable(undefined);
        } else {
          if (!data || data.length === 0) {
            setAvailable(true);
          } else {
            // If only match is the current user, treat as available
            const others = excludeUid
              ? data.filter((d) => d.id !== excludeUid)
              : data;
            setAvailable(others.length === 0);
          }
        }
      } catch (err) {
        console.warn(err);
        setAvailable(undefined);
      } finally {
        setChecking(false);
      }
    }, 350) as unknown as number;
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [normalized, excludeUid]);

  const rightIcon = checking
    ? undefined
    : available === undefined
      ? undefined
      : available
        ? "check-circle"
        : "close-circle";

  return (
    <View style={style as ViewStyle}>
      <TextInput
        label={label || t("profile.edit.username")}
        value={value}
        disabled={disabled}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="default"
        inputMode="text"
        autoComplete="username-new"
        textContentType="username"
        left={<TextInput.Affix textStyle={{ opacity: 0.5 }} text="www.fifeapp.hu/@" />}
        onChangeText={onChangeText}
        right={rightIcon ? <TextInput.Icon icon={rightIcon} /> : undefined}
      />
      <HelperText
        type={
          available === false
            ? "error"
            : "info"
        }
        style={{ lineHeight: 16 }}
        visible={available === false || true}
      >
        {available === false
          ? t("profile.edit.usernameExists")
          : t("profile.edit.usernameHelp")}
      </HelperText>
    </View>
  );
};

export default UsernameInput;
