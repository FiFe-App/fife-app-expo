import elapsedTime from "@/lib/functions/elapsedTime";
import { RootState } from "@/redux/store";
import { User } from "@/redux/store.type";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Chip, Icon, Surface, Text } from "react-native-paper";
import { useSelector } from "react-redux";
import ProfileImage from "../ProfileImage";

interface UserItemProps {
  data: User;
  showOptions?: boolean;
}

const UserItem = ({ data, showOptions }: UserItemProps) => {
  const { id, full_name, avatar_url, created_at } = data;
  const recommendations = data?.recommendations || 0;
  const buzinesses = ["Webfejlesztő"]
  const { uid: myuid } = useSelector((state: RootState) => state.user);

  return (
    <Link href={{ pathname: "/user/[uid]", params: { uid: id } }} asChild>
      <Surface style={styles.container} elevation={2} mode="flat">
        <View style={{ flexDirection: "row", gap: 12 }}>
          <ProfileImage
            modal
            uid={id}
            size={80}
            avatar_url={data.avatar_url}
            style={{ width: 80, height: 80 }}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="titleLarge">{full_name}</Text>
            <View style={{ flexWrap: "wrap", flexDirection: "row", gap: 4 }}>
              {buzinesses?.map((e, i) => {
                if (e.trim())
                  return (
                    <Chip key={"buziness" + i} textStyle={{ margin: 4 }}>
                      <Text variant="labelMedium">{e}</Text>
                    </Chip>
                  );
              })}
            </View>
            <View
              style={{
                marginRight: 8,
                flexDirection: "row",
                gap: 16
              }}
            >
              <View style={{}}>
                {!showOptions && !!created_at && (
                  <Text style={{}}>
                    <Icon size={16} source="calendar" /> <Text>{elapsedTime(created_at)}</Text>
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text>
                  <Icon size={16} source="account-group" />{" "}
                  <Text>{recommendations} ember ajánlja</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Surface>
    </Link>
  );
};

export default UserItem;

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 8,
    marginHorizontal: 4,
    padding: 8,
  },
});
