import React, { useEffect, useState } from "react";
import { ThemedView } from "../ThemedView";
import { Icon, IconButton, List, Text } from "react-native-paper";
import { Link } from "expo-router";
import { supabase } from "@/lib/supabase/supabase";
import { Tables } from "@/database.types";
import typeToIcon from "@/lib/functions/typeToIcon";
import getLinkForContact from "@/lib/functions/getLinkForContact";

export interface ContactListProps {
  uid: string;
  edit?: boolean;
}

export function ContactList({ uid, edit }: ContactListProps) {
  const [contacts, setContacts] = useState<Tables<"contacts">[]>([]);

  useEffect(() => {
    const loadContacts = () => {
      supabase
        .from("contacts")
        .select("*")
        .eq("author", uid)
        .then((res) => {
          console.log(res);

          if (res.data) setContacts(res.data);
        });
    };
    loadContacts();
  }, [uid]);
  return (
    <ThemedView>
      <List.Section>
        {contacts.map((contact) => (
          <Link
            key={contact.id}
            asChild
            href={getLinkForContact(contact, edit)}
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
