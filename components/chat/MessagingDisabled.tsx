import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";
import { supabase } from "@/lib/supabase/supabase";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { addSnack } from "@/redux/reducers/infoReducer";

interface MessagingDisabledProps {
  onEnabled?: () => void;
}

export function MessagingDisabled({ onEnabled }: MessagingDisabledProps) {
  const theme = useTheme();
  const { uid } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const [enabling, setEnabling] = useState(false);

  const enableMessaging = async () => {
    if (!uid) return;

    setEnabling(true);

    try {
      // Check if MESSAGE contact already exists
      const { data: existing } = await supabase
        .from("contacts")
        .select("*")
        .eq("author", uid)
        .eq("type", "MESSAGE")
        .maybeSingle();

      if (existing) {
        // Update existing contact
        const { error } = await supabase
          .from("contacts")
          .update({ data: "enabled", public: true })
          .eq("id", existing.id);

        if (error) {
          console.error("Error updating MESSAGE contact:", error);
          return;
        }
      } else {
        // Create new MESSAGE contact
        const { error } = await supabase.from("contacts").insert({
          author: uid,
          type: "MESSAGE",
          data: "enabled",
          public: true,
          title: null,
        });

        if (error) {
          console.error("Error creating MESSAGE contact:", error);
          return;
        }
      }

      dispatch(
        addSnack({
          title: "Üzenetküldés bekapcsolva",
        })
      );

      if (onEnabled) {
        onEnabled();
      }
    } catch (error) {
      console.error("Error enabling messaging:", error);
    } finally {
      setEnabling(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text
            variant="titleMedium"
            style={[styles.title, { color: theme.colors.error }]}
          >
            Nincs bekapcsolva az üzenetküldés a profilodban
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Az üzenetek küldéséhez és fogadásához be kell kapcsolnod az
            üzenetküldést az elérhetőségeid között.
          </Text>
          <Button
            mode="contained"
            onPress={enableMessaging}
            loading={enabling}
            disabled={enabling}
            style={styles.button}
          >
            Kattints a bekapcsolásához
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});
