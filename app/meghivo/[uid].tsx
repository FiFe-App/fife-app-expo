import { Logo } from "@/components/Logo";
import ProfileImage from "@/components/ProfileImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { setInvitedBy } from "@/redux/reducers/appReducer";
import { RootState } from "@/redux/store";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

type Inviter = Pick<Tables<"profiles">, "id" | "full_name" | "username" | "avatar_url">;

const AVATAR_SIZE = 160;

/**
 * Landing page of an invite link (https://fifeapp.hu/meghivo/<uid>).
 *
 * Whoever opens it is almost always a stranger to the app, so the page has one
 * job: show them a face they recognise and a single way forward. Tapping
 * "Csatlakozom" remembers the inviter (redux, persisted) and hands the visitor
 * to the normal registration flow; the invitation itself is recorded at the
 * end of it, once the new profile exists.
 */
export default function Invitation() {
  const { uid: paramUid } = useLocalSearchParams<{ uid: string }>();
  const inviterUid: string = paramUid ?? "";
  const myUid = useSelector((state: RootState) => state.user.uid);
  const dispatch = useDispatch();

  const [inviter, setInviter] = useState<Inviter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inviterUid) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .eq("id", inviterUid)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setInviter(data ?? null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inviterUid]);

  const join = () => {
    // Kept in the store rather than in the URL: the flow leaves the app for the
    // confirmation e-mail and comes back on a fresh launch, so a route param
    // would not survive to the end of the registration.
    dispatch(setInvitedBy(inviterUid));
    router.push("/csatlakozom");
  };

  const inviterName = inviter?.full_name || inviter?.username || "";
  const myOwnLink = !!myUid && myUid === inviterUid;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: Spacing.xl,
          padding: Spacing.lg,
        }}
      >
        <Logo style={{ width: 200, height: 40 }} />

        {loading && <ActivityIndicator />}

        {!loading && !inviter && (
          <>
            <ThemedText type="subtitle" style={{ textAlign: "center" }}>
              Ez a meghívó már nem él.
            </ThemedText>
            <ThemedText style={{ textAlign: "center" }}>
              Attól még szeretettel várunk! A FiFe App egy segítői hálózat, ahol
              megbízható emberekre találhatsz a környékeden.
            </ThemedText>
            {myUid ? (
              <Link href="/me" asChild>
                <Button mode="contained">Vissza az appba</Button>
              </Link>
            ) : (
              <Link href="/csatlakozom" asChild>
                <Button mode="contained">Csatlakozom</Button>
              </Link>
            )}
          </>
        )}

        {!loading && inviter && (
          <>
            <ProfileImage
              uid={inviter.id}
              avatar_url={inviter.avatar_url}
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: BorderRadius.full,
              }}
            />
            <ThemedText type="title" style={{ textAlign: "center" }}>
              {`${inviterName} meghívott a FiFe Appba!`}
            </ThemedText>
            <ThemedText style={{ textAlign: "center" }}>
              A FiFe App egy segítői hálózat: megoszthatod, mihez értesz, és
              megtalálhatod azokat, akik segíthetnek neked a környékeden.
            </ThemedText>

            <View style={{ width: "100%", maxWidth: 400, gap: Spacing.sm }}>
              {myOwnLink ? (
                <>
                  <ThemedText style={{ textAlign: "center" }}>
                    Ezt látja majd az, akinek elküldöd a meghívódat.
                  </ThemedText>
                  <Link href="/me" asChild>
                    <Button mode="contained">Vissza az appba</Button>
                  </Link>
                </>
              ) : myUid ? (
                <>
                  <ThemedText style={{ textAlign: "center" }}>
                    Te már tag vagy, úgyhogy ezt a meghívót add tovább bátran!
                  </ThemedText>
                  <Link href={`/user/${inviter.id}`} asChild>
                    <Button mode="contained">Megnézem a profilját</Button>
                  </Link>
                </>
              ) : (
                <Button mode="contained" onPress={join}>
                  Csatlakozom
                </Button>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}
