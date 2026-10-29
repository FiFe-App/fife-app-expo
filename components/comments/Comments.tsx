import elapsedTime from "@/lib/functions/elapsedTime";
import {
  addComment,
  addComments,
  clearComments,
  deleteComment as deleteCommentSlice,
  editComment,
} from "@/redux/reducers/commentsReducer";
import { RootState } from "@/redux/store";
import { CommentsState, UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { trackEvent } from "@/lib/analytics";
import * as ExpoImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  GestureResponderEvent,
  ImageBackground,
  Pressable,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Icon,
  IconButton,
  Menu,
  Modal,
  Portal,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import SupabaseImage from "../SupabaseImage";
import UrlText from "../UrlText";
import { Comment, CommentsProps } from "./comments.types";
import { ThemedText } from "../ThemedText";
import { addSnack } from "@/redux/reducers/infoReducer";
import { getLoginHref } from "@/lib/auth/loginRedirect";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import ReportContentModal from "../user/ReportContentModal";
import BlockUserModal from "../user/BlockUserModal";

const Comments = ({ path, placeholder, limit = 10, style, publicComments, closed, closedText }: CommentsProps) => {
  const dispatch = useDispatch();
  const navigation = router;
  const theme = useTheme();

  const { uid, name }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const { comments }: CommentsState = useSelector(
    (state: RootState) => state.comments,
  );
  const author = name;
  const [text, setText] = useState("");
  const [image, setImage] = useState<ExpoImagePicker.ImagePickerAsset | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<{
    x: number;
    y: number;
    comment: Comment;
  } | null>(null);

  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [reportedComment, setReportedComment] = useState<Comment | null>(null);
  const [blockCandidate, setBlockCandidate] = useState<Comment | null>(null);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const mountId = useRef(Date.now()).current;

  useEffect(() => {
    dispatch(clearComments());

    if (publicComments) {
      dispatch(addComments(publicComments));
      return;
    }

    const channel = supabase.channel(`${path}:${mountId}`);

    const getMessages = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles ( full_name )")
        .eq("key", path)
        .order("created_at", { ascending: false });
      if (data) dispatch(addComments(data));
      console.log(error);
    };

    getMessages();

    channel
      .on<Comment>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          // eslint-disable-next-line prettier/prettier
          filter: "key=eq." + path,
        },
        (data) => {
          //supabase.from("profiles").select("full_name").eq("id", data.new?.id);
          if (data.eventType === "INSERT") {
            supabase
              .from("profiles")
              .select("full_name")
              .eq("id", data.new?.author)
              .then((res) => {
                if (res.data && res.data[0].full_name)
                  dispatch(
                    addComment({
                      ...data.new,
                      profiles: { full_name: res.data[0].full_name },
                    }),
                  );
              });
          }
          if (data.eventType === "UPDATE") {
            dispatch(editComment(data.new));
          }
          if (data.eventType === "DELETE") {
            if (data.old.id) dispatch(deleteCommentSlice(data.old.id));
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("subscribed to", channel);
        }
      });

    setTimeout(() => {
      setDownloading(false);
    }, 3000);
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, limit, path, publicComments]);

  useEffect(() => {
    if (comments.length) setDownloading(false);
  }, [comments]);

  // Comments from people you blocked are hidden.
  useEffect(() => {
    if (!uid) return;
    supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", uid)
      .then(({ data }) =>
        setBlockedIds(new Set((data ?? []).map((b) => b.blocked_id))),
      );
  }, [uid]);

  const visibleComments = comments.filter(
    (comment) => !comment.author || !blockedIds.has(comment.author),
  );

  const closeMenu = () => setMenuAnchor(null);

  const pickImage = async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    }).catch((error) => {
      console.log(error);
    });

    if (result && !result?.canceled) {
      setImage(result.assets[0]);
    } else console.log("cancelled");
  };
  const handleSend = async () => {
    if (author && text && uid && !loading) {
      setLoading(true);
      await supabase
        .from("comments")
        .insert({
          author: uid,
          text,
          key: path,
        })
        .select()
        .then(async ({ data, error }) => {
          if (error) {
            setLoading(false);
            console.error("Error posting comment:", error);
            dispatch(
              addSnack({
                title: error.message
                  ? `Hiba a komment küldésekor: ${error.message}`
                  : "Hiba a komment küldésekor. Próbáld újra később.",
              }),
            );
            return;
          }

          if (data && data.length > 0) {
            trackEvent("comment_posted", { hasImage: !!image });
            dispatch(
              addComment({
                ...data[0],
                profiles: { full_name: author },
              }),
            );

            if (image) {
              await uploadImage(uid + "/" + path, data[0].id);
              setImage(null);
            }
          }

          // Only now: sending again while the image uploads would post twice.
          setLoading(false);
          setText("");
        })
        .catch((error) => {
          setLoading(false);
          console.error("Unexpected error posting comment:", error);
          dispatch(
            addSnack({
              title: "Váratlan hiba történt. Próbáld újra később.",
            }),
          );
        });
    }
  };
  const uploadImage = async (storagePath: string, key: number) => {
    if (!image) return;
    // iOS leaves fileName null for edited picks and under limited photo
    // access, so fall back to the cached file's own name.
    const fileName = image.fileName || image.uri.split("/").pop() || `${Date.now()}.jpg`;

    const arrayBuffer = await (await fetch(image.uri)).arrayBuffer();
    const { data, error } = await supabase.storage
      .from("comments")
      .upload(storagePath + "/" + key + "/" + fileName, arrayBuffer, {
        contentType: image.mimeType ?? "image/jpeg",
        upsert: false,
      });
    if (error || !data?.path) {
      console.error("Comment image upload error:", error);
      dispatch(addSnack({ title: "A kép feltöltése nem sikerült." }));
      return;
    }

    const { error: updateError } = await supabase
      .from("comments")
      .update({ image: data.path })
      .eq("id", key);
    if (updateError) {
      console.error("Comment image DB update error:", updateError);
      dispatch(addSnack({ title: "A kép feltöltése nem sikerült." }));
      return;
    }
    // Show it straight away instead of waiting for the realtime UPDATE.
    dispatch(editComment({ id: key, image: data.path } as Comment));
  };
  const showCommentMenu = (event: GestureResponderEvent, comment: Comment) => {
    const { nativeEvent } = event;

    const anchor = {
      x: nativeEvent.pageX,
      y: nativeEvent.pageY,
      comment,
    };

    setMenuAnchor(anchor);
  };
  const deleteComment = async (comment: Comment) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment.id);
    if (!error) {
      dispatch(deleteCommentSlice(comment.id));
      console.log(comment.id);

      if (comment.image !== "") removeImage(comment);

      dispatch(addSnack({ title: "Törölted a kommented!" }));
    } else {
      console.log(error);
    }
    setMenuAnchor(null);
  };
  const removeImage = (comment: Comment) => {
    if (comment.image) {
      supabase.storage
        .from("comments")
        .remove([comment.image])
        .then(() => {
          console.log("image deleted");
        })
        .catch((error) => {
          // Uh-oh, an error occurred!
          console.log("image delete error", error);
        });
    }
  };
  const dismissImage = () => {
    setImage(null);
  };

  return (
    <View
      style={[{ flex: 1 }, style]}
    >
      {
        <View style={{ paddingBottom: 10, flex:1, minHeight: 200 }}>
          {!!visibleComments.length &&
            visibleComments.map((comment, ind) => {
              return (
                <View
                  key={"comment" + ind}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: Spacing.sm,
                    paddingVertical: Spacing.md,
                    borderBottomWidth: ind < visibleComments.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.outlineVariant,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "baseline",
                        gap: Spacing.sm,
                        flexWrap: "wrap",
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          if (!comment?.author) return;
                          // A profile is members-only: a signed-out reader of a
                          // public page gets the login screen, and lands on the
                          // profile once they are in.
                          navigation.navigate(
                            uid
                              ? {
                                  pathname: "/user/[uid]",
                                  params: { uid: comment.author },
                                }
                              : getLoginHref(`/user/${comment.author}`),
                          );
                        }}
                      >
                        <ThemedText style={{ fontWeight: "bold", fontSize: 14 }}>
                          {comment?.profiles?.full_name ?? "Törölt felhasználó"}
                        </ThemedText>
                      </Pressable>
                      <ThemedText
                        style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}
                      >
                        {elapsedTime(comment.created_at)}
                      </ThemedText>
                    </View>
                    <UrlText text={comment.text} style={{ fontSize: 15, lineHeight: 22 }} />
                  </View>
                  {comment.image && (
                    <Pressable onPress={() => setSelectedComment(comment)}>
                      <SupabaseImage
                        bucket="comments"
                        path={comment.image}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: BorderRadius.md,
                        }}
                      />
                    </Pressable>
                  )}
                  {uid && (
                    <IconButton
                      icon="dots-vertical"
                      onPress={(e) => showCommentMenu(e, comment)}
                      size={18}
                      iconColor={theme.colors.onSurfaceVariant}
                      style={{ margin: 0 }}
                    />
                  )}
                </View>
              );
            })}
        </View>
      }
      {downloading && !publicComments && !comments.length ? (
        <ActivityIndicator />
      ) : (
        !comments?.length && (
          <ThemedText style={{ padding: Spacing.xl, textAlign:"center" }}>
            Még nem érkezett vélemény
          </ThemedText>
        )
      )}
      {closed ? (
        <View
          testID="comments-closed"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.sm,
            padding: Spacing.md,
            borderRadius: BorderRadius.md,
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          <Icon source="lock-outline" size={20} color={theme.colors.onSurfaceVariant} />
          <ThemedText style={{ flex: 1, color: theme.colors.onSurfaceVariant }}>
            {closedText ?? "A hozzászólás le van zárva."}
          </ThemedText>
        </View>
      ) : (
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={{ paddingRight: 95 }}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            submitBehavior="submit"
            disabled={!uid || loading}
            placeholder={
              uid
                ? placeholder
                  ? placeholder
                  : "Kommented"
                : "Jelentkezz be a hozzászóláshoz."
            }
          />
        </View>
        <View style={{ position: "absolute", right: 0, flexDirection: "row" }}>
          {image ? (
            <ImageBackground source={{ uri: image.uri }}>
              <IconButton icon="close" onPress={dismissImage} />
            </ImageBackground>
          ) : (
            <IconButton icon="image" onPress={pickImage} disabled={!uid} />
          )}
          <IconButton
            icon="send"
            onPress={handleSend}
            disabled={!uid || !text}
            loading={loading}
          />
        </View>
      </View>
      )}

      <Menu
        visible={!!uid && !!menuAnchor}
        onDismiss={closeMenu}
        anchor={menuAnchor}
      >
        {!!menuAnchor &&
          (menuAnchor?.comment?.author === uid ? (
            <>
              <Menu.Item
                onPress={() => deleteComment(menuAnchor.comment)}
                title="Törlés"
                leadingIcon="delete"
              />
            </>
          ) : (
            <>
              {menuAnchor?.comment?.author ? (
                <Menu.Item
                  onPress={() => {
                    navigation.navigate({
                      pathname: "/user/[uid]",
                      params: { uid: menuAnchor.comment.author },
                    });
                    setMenuAnchor(null);
                  }}
                  title={(menuAnchor?.comment?.profiles?.full_name ?? "Törölt felhasználó") + " profilja"}
                  leadingIcon="account"
                />
              ) : (
                <Menu.Item
                  title="Törölt felhasználó"
                  leadingIcon="account-off"
                  disabled
                />
              )}
              <Menu.Item
                onPress={() => {
                  setReportedComment(menuAnchor.comment);
                  setMenuAnchor(null);
                }}
                title="Jelentés"
                leadingIcon="alert-octagon"
              />
              {!!menuAnchor?.comment?.author && (
                <Menu.Item
                  onPress={() => {
                    setBlockCandidate(menuAnchor.comment);
                    setMenuAnchor(null);
                  }}
                  title="Felhasználó letiltása"
                  leadingIcon="account-cancel"
                />
              )}
            </>
          ))}
      </Menu>

      <Portal>
        <ReportContentModal
          show={!!reportedComment}
          setShow={(show) => {
            if (!show) setReportedComment(null);
          }}
          targetType="comment"
          targetId={reportedComment?.id}
          reportedUserId={reportedComment?.author ?? null}
          label={reportedComment?.profiles?.full_name ?? ""}
          excerpt={reportedComment?.text}
        />
        <BlockUserModal
          show={!!blockCandidate}
          setShow={(show) => {
            if (!show) setBlockCandidate(null);
          }}
          profileId={blockCandidate?.author ?? ""}
          profileName={blockCandidate?.profiles?.full_name ?? "Ez a felhasználó"}
          onBlocked={() => {
            const blockedId = blockCandidate?.author;
            if (blockedId) setBlockedIds((prev) => new Set(prev).add(blockedId));
            setBlockCandidate(null);
          }}
        />
      </Portal>

      {selectedComment?.image && (
        <Portal>
          <Modal
            visible={!!selectedComment}
            onDismiss={() => setSelectedComment(null)}
            contentContainerStyle={{ shadowOpacity: 0 }}
          >
            <Pressable onPress={() => setSelectedComment(null)}>
              <SupabaseImage
                bucket="comments"
                path={selectedComment.image}
                style={{ height: 600 }}
                resizeMode="contain"
              />
            </Pressable>
          </Modal>
        </Portal>
      )}
    </View>
  );
};

export default Comments;
