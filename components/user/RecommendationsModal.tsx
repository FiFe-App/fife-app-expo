import { Tables } from "@/database.types";
import elapsedTime from "@/lib/functions/elapsedTime";
import { supabase } from "@/lib/supabase/supabase";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  Divider,
  IconButton,
  Modal,
  Text,
  TouchableRipple,
} from "react-native-paper";
import SupabaseImage from "../SupabaseImage";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

interface RMP {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  uid: string;
  name: string;
}

interface RecommendElement extends Tables<"profileRecommendations"> {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const RecommendationsModal = ({ show, setShow, uid, name }: RMP) => {
  const [list, setList] = useState<RecommendElement[]>([]);

  useEffect(() => {
    if (show) {
      supabase
        .from("profileRecommendations")
        .select(
          "*, profiles!profileRecommendations_author_fkey(full_name,avatar_url)",
        )
        .eq("profile_id", uid)
        .then((res) => {
          if (res.data) {
            console.log(res.data);
            setList(res.data);
          }
        });
    }
  }, [show, uid]);

  return (
    <Modal
      visible={show}
      onDismiss={() => {
        setShow(false);
      }}
    >
      <ThemedView
        style={{
          padding: 20,
          margin: 30,
        }}
      >
        <ThemedText>{name} pajtásai:</ThemedText>
        {list.map((rec, ind) => (
          <>
            <Link
              asChild
              href={{
                pathname: "/user/[uid]",
                params: { uid: rec.author },
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
                  <SupabaseImage
                    bucket="avatars"
                    path={rec.author + "/" + rec.profiles?.avatar_url}
                    style={{ width: 40, height: 40, marginRight: 16 }}
                  />
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <Text>{rec.profiles?.full_name}</Text>
                    <Text>{elapsedTime(rec.created_at)} jelölte pajtásnak</Text>
                  </View>
                  <IconButton icon="account" />
                </View>
              </TouchableRipple>
            </Link>
            {list.length > ind + 1 && <Divider />}
          </>
        ))}
      </ThemedView>
    </Modal>
  );
};

export default RecommendationsModal;
