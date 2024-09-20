import React from "react";
import { ThemedView } from "../ThemedView";
import { List } from "react-native-paper";
import { Link } from "expo-router";

export interface ContactListProps {
  prop?: string;
}

export function ContactList({ prop = "default value" }: ContactListProps) {
  return (
    <ThemedView>
      <List.Section>
        <List.Accordion title="Elérhetőségeim">
          <List.Item
            title="kristofakos1229@gmail.com"
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          <List.Item
            title="+36 20 372 7690"
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
          <Link asChild href="user/e53e948e-debe-44c1-852b-e94c29ffcb9b">
            <List.Item title="Írok neki üzenetet" />
          </Link>
        </List.Accordion>
      </List.Section>
    </ThemedView>
  );
}
