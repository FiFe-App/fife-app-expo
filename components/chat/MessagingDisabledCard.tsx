import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { enableMessaging } from "@/lib/chat/messagingContact";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { addSnack } from "@/redux/reducers/infoReducer";
import { setMessagingEnabled } from "@/redux/reducers/userReducer";

interface MessagingDisabledCardProps {
  /** Whether the current user has messaging enabled */
  myMessagingEnabled?: boolean;
  /** Whether the other user has messaging enabled (only relevant in ChatScreen) */
  otherMessagingEnabled?: boolean;
  /** Called after the current user successfully enables messaging */
  onEnabled?: () => void;
}

export function MessagingDisabledCard({
  myMessagingEnabled = false,
  onEnabled,
}: MessagingDisabledCardProps) {
  const { uid } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const [enabling, setEnabling] = useState(false);

  const handleEnable = async () => {
    if (!uid) return;

    setEnabling(true);

    try {
      const { error } = await enableMessaging(uid);
      if (error) {
        dispatch(
          addSnack({
            title: `Az üzenetküldés bekapcsolása nem sikerült: ${error}`,
          }),
        );
        return;
      }

      dispatch(setMessagingEnabled(true));
      dispatch(addSnack({ title: "Üzenetküldés bekapcsolva" }));
      onEnabled?.();
    } catch (error) {
      console.error("Error enabling messaging:", error);
      dispatch(
        addSnack({ title: "Az üzenetküldés bekapcsolása nem sikerült." }),
      );
    } finally {
      setEnabling(false);
    }
  };

  const showEnableButton = !myMessagingEnabled;
  const title = !myMessagingEnabled
    ? "Nincs bekapcsolva az üzenetküldés a profilodban"
    : "A másik félnél nincs bekapcsolva az üzenetküldés";
  const description = !myMessagingEnabled
    ? "Az üzenetek küldéséhez és fogadásához be kell kapcsolnod az üzenetküldést az elérhetőségeid között."
    : "Sajnos addig nem tudsz üzenetet küldeni, amíg a másik fél nem kapcsolja be az üzenetküldést.";

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {description}
          </Text>
          {showEnableButton && (
            <Button
              mode="contained"
              onPress={handleEnable}
              loading={enabling}
              disabled={enabling}
              style={styles.button}
            >
              Kattints a bekapcsolásához
            </Button>
          )}
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
