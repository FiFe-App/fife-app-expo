import { Tables } from "@/database.types";
import getLinkForContact from "@/lib/functions/getLinkForContact";
import typeToIcon from "@/lib/functions/typeToIcon";
import { supabase } from "@/lib/supabase/supabase";
import { Link, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { List } from "react-native-paper";
import { ThemedView } from "../ThemedView";
import * as Clipboard from "expo-clipboard";
import { useDispatch } from "react-redux";
import { addSnack } from "@/lib/redux/reducers/infoReducer";

export interface ContactListProps {
  uid: string;
  edit?: boolean;
}

export function ContactList({ uid, edit }: ContactListProps) {
  const [contacts, setContacts] = useState<Tables<"contacts">[]>([]);
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
          });
      };
      loadContacts();
      return () => {};
    }, [uid]),
  );
  return (
    <ThemedView>
      <List.Section>
        {contacts.map((contact) => (
          <Link
            key={contact.id}
            asChild
            href={getLinkForContact(contact, edit)}
            aria-valuetext="hello"
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
              title={contact.title || contact.data}
              left={(props) => (
                <List.Icon {...props} icon={typeToIcon(contact.type)} />
              )}
              right={
                edit
                  ? () => <List.Icon icon="pencil" style={{ height: 24 }} />
                  : undefined
              }
            />
          </Link>
        ))}
        <Link
          asChild
          href={
            edit
              ? {
                  pathname: "/contact-edit",
                }
              : {
                  pathname: "/user/[uid]",
                  params: { uid },
                }
          }
        >
          <List.Item
            left={(props) => (
              <List.Icon {...props} icon={edit ? "plus" : "message-text"} />
            )}
            title={edit ? "Új elérhetőség felvétele" : "Írok neki üzenetet"}
          />
        </Link>
      </List.Section>
    </ThemedView>
  );
}
