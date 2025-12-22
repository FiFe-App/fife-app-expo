import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FAB, List } from "react-native-paper";
import { ThemedView } from "../ThemedView";
import { useDispatch, useSelector } from "react-redux";
import { ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "../ThemedText";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import UserItem from "../user/UserItem";
import { RootState } from "@/redux/store";
import { theme } from "@/assets/theme";
import { useTranslation } from "react-i18next";

export interface ContactListProps {
  uid: string;
}

export function SavedProfiles({ uid }: ContactListProps) {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Tables<"profiles">[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      const loadContacts = () => {
        if (!uid) return;
        supabase
          .from("profileRecommendations")
          .select("profile:profileRecommendations_profile_id_fkey(*, buzinesses:buziness(title)), author")
          .eq("author", uid)
          .then((res) => {
            if (res.data) {
              setContacts(res.data.map((r) => r.profile));
            }
            setLoading(false);
          });
      };
      loadContacts();
      if (uid) dispatch(viewFunction({ key: "contactsProfile", uid }));
      return () => { };
    }, [uid]),
  );
  return (
    <>
      <ThemedView style={{ flex: 1 }}>
        {contacts.length > 0 && <ThemedText variant="labelLarge" style={{ padding: 6, color: theme.colors.secondary, fontWeight: "bold" }}>{t("biznisz.savedProfiles.trustedLabel")}</ThemedText>
        }<ScrollView contentContainerStyle={{ flex: 1 }}>
          {loading && (
            <View
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <ActivityIndicator />
            </View>
          )}
          <List.Section style={{ gap: 8 }}>
            {!loading &&
              (contacts.length ? (
                contacts.map((contact) => (
                  <UserItem key={contact.id} data={contact} />
                ))
              ) : (
                <View style={{ alignItems: "center", gap: 16, padding: 8 }}>
                  <Image
                    source={require("../../assets/images/HeroImage.png")}
                    style={{ height: 200, width: "100%" }}
                    contentFit="contain"
                  />
                  <ThemedText type="subtitle">
                    {t("biznisz.savedProfiles.empty")}
                  </ThemedText>
                </View>
              ))}
          </List.Section>
        </ScrollView>
      </ThemedView>

    </>
  );
}

const styles = StyleSheet.create({
  fabStyle: {
    bottom: 16,
    right: 16,
    position: "absolute",
  },
});
