import { Tables } from "@/database.types";
import probabilityToText from "@/lib/functions/probabilityToText";
import { supabase } from "@/lib/supabase/supabase";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Divider, IconButton, Text, TouchableRipple } from "react-native-paper";
import SupabaseImage from "../SupabaseImage";
import { ThemedView } from "../ThemedView";
import ProfileImage from "../ProfileImage";

interface RMP {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  id: number;
  name: string;
}

interface Element extends Tables<"eventResponses"> {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const EventGoingResponses = ({ id, name }: RMP) => {
  const [list, setList] = useState<Element[]>([]);

  useEffect(() => {
    supabase
      .from("eventResponses")
      .select("*, profiles ( full_name, avatar_url )")
      .order("value", { ascending: false })
      .eq("event_id", id)
      .then((res) => {
        if (res.data) {
          setList(res.data);
        }
      });
  }, [id]);

  return (
    <ThemedView>
      {list.map((rec, ind) => (
        <>
          <Link
            asChild
            href={{
              pathname: "/user/[uid]",
              params: { uid: rec.user_id },
            }}
          >
            <TouchableRipple>
              <View
                style={{
                  flexDirection: "row",
                  padding: 4,
                  alignItems: "center",
                }}
              >
                <ProfileImage
                  uid={rec.user_id}
                  avatar_url={rec.profiles?.avatar_url}
                  size={40}
                  style={{ width: 40, height: 40, marginRight: 16 }}
                />
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <Text>{rec.profiles?.full_name}</Text>
                  <Text>{probabilityToText(rec.value)}</Text>
                </View>
                <IconButton icon="account" />
              </View>
            </TouchableRipple>
          </Link>
          {list.length > ind + 1 && <Divider />}
        </>
      ))}
    </ThemedView>
  );
};

export default EventGoingResponses;
