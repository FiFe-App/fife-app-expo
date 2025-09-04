import { Tables } from "@/database.types";
import getLinkForContact from "@/lib/functions/getLinkForContact";
import typeToIcon from "@/lib/functions/typeToIcon";
import { supabase } from "@/lib/supabase/supabase";
import { Link, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FAB, List } from "react-native-paper";
import { ThemedView } from "../ThemedView";
import * as Clipboard from "expo-clipboard";
import { useDispatch } from "react-redux";
import { addSnack } from "@/redux/reducers/infoReducer";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "../ThemedText";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import typeToValueLabel from "@/lib/functions/typeToValueLabel";
import typeToPrefix from "@/lib/functions/typeToPrefix";
import typeToPlaceholder from "@/lib/functions/typeToPlaceholder";

export interface ContactListProps {
  uid: string;
  edit?: boolean;
}

export function ContactList({ uid, edit }: ContactListProps) {
  const [contacts, setContacts] = useState<Tables<"contacts">[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      const loadContacts = () => {
        supabase
          .from("contacts")
          .select("*")
          .eq("author", uid)
          .then((res) => {
            if (res.data) setContacts(res.data);
            setLoading(false);
          });
      };
      loadContacts();
      if (uid) dispatch(viewFunction({ key: "contactsProfile", uid }));
      return () => {};
    }, [uid]),
  );
  return (
    <>
      <ThemedView style={{ flex: 1 }}>
        {loading && (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator />
          </View>
        )}
        <List.Section>
          {!loading &&
            (contacts.length ? (
              contacts.map((contact) => (
                <Link
                  key={contact.id}
                  asChild
                  rel="nofollow"
                  target="_blank"
                  href={getLinkForContact(contact, edit)}
                  onLongPress={() => {
                    Clipboard.setStringAsync(contact.data).then((res) => {
                      dispatch(
                        addSnack({
                          title: "Vágólapra másolva!",
                        }),
                      );
                    });
                  }}
                >
                  <List.Item
                    title={contact.data}
                    description={
                      contact.title || typeToValueLabel(contact.type)
                    }
                    descriptionNumberOfLines={0}
                    left={(props) => (
                      <List.Icon {...props} icon={typeToIcon(contact.type)} />
                    )}
                    right={(props) => (
                      <List.Icon {...props} icon="open-in-new" />
                    )}
                  />
                </Link>
              ))
            ) : (
              <View style={{ alignItems: "center", gap: 16, padding: 8 }}>
                <Image
                  source={require("../../assets/images/img-map.png")}
                  style={{ height: 200, width: 200 }}
                />
                <ThemedText type="subtitle">
                  Itt fognak megjelenni az elérhetőségeid, hogy könnyebben
                  elérjenek.
                </ThemedText>
              </View>
            ))}
        </List.Section>
      </ThemedView>

      {edit && (
        <FAB
          icon={"pencil"}
          label={"Szerkesztés"}
          style={[styles.fabStyle]}
          onPress={() => router.push("/user/edit")}
        />
      )}
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
