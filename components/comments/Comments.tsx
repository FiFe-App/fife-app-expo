import elapsedTime from "@/lib/functions/elapsedTime";
import {
  addComment,
  addComments,
  clearComments,
  deleteComment as deleteCommentSlice,
  editComment,
} from "@/lib/redux/reducers/commentsReducer";
import { RootState } from "@/lib/redux/store";
import { CommentsState, UserState } from "@/lib/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import * as ExpoImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  GestureResponderEvent,
  ImageBackground,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Card,
  IconButton,
  Menu,
  Modal,
  Portal,
  TextInput,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import SupabaseImage from "../SupabaseImage";
import UrlText from "./UrlText";
import { Comment, CommentsProps } from "./comments.types";
import { ThemedText } from "../ThemedText";
import { addSnack } from "@/lib/redux/reducers/infoReducer";

const Comments = ({ path, placeholder, limit = 10 }: CommentsProps) => {
  const dispatch = useDispatch();
  const navigation = router;

  const { uid, name }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const { comments }: CommentsState = useSelector(
    (state: RootState) => state.comments,
  );
  const commentsChannel = supabase.channel(path);
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

  useEffect(() => {
    dispatch(clearComments());

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

    commentsChannel
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
          console.log("subscribed to", commentsChannel);
        }
      });

    setTimeout(() => {
      setDownloading(false);
    }, 3000);
    return () => {
      supabase.removeChannel(commentsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, limit, path]);

  useEffect(() => {
    if (comments.length) setDownloading(false);
  }, [comments]);

  const closeMenu = () => setMenuAnchor(null);

  const pickImage = async () => {
    let result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      base64: true,
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
          setLoading(false);

          if (image && !error) {
            await uploadImage(uid + "/" + path, data?.[0].id);

            setImage(null);
            setLoading(false);
            setText("");
          } else {
            setLoading(false);
            setText("");
          }
        });
    }
  };
  const uploadImage = async (storagePath: string, key: number) => {
    if (!image || !image.fileName) return;

    console.log("path: " + storagePath + "/" + key + "/" + image.fileName);

    const response = await fetch(image.uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const upload = await supabase.storage
      .from("comments")
      .upload(storagePath + "/" + key + "/" + image.fileName, arrayBuffer, {
        contentType: image.mimeType,
        upsert: false,
      })
      .then(async ({ data, error }) => {
        const path = data?.path;
        supabase
          .from("comments")
          .update({ image: path })
          .eq("id", key)
          .then(({ data, error }) => {
            if (error) {
              console.log(
                "DB update with image error, on " +
                  storagePath +
                  "/" +
                  key +
                  "/image",
                error,
              );
              return error;
            }
            console.log("DB update with image success", key);
            return image;
          });
      })
      .catch((error) => {
        return error;
      });

    return upload;
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
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={{ paddingRight: 95 }}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
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
      {false && (
        <View style={{ flexDirection: "row", padding: 10 }}>
          <ThemedText style={{ flex: 1 }}>Kommentek:</ThemedText>
          <ThemedText>Újabbak elöl</ThemedText>
        </View>
      )}
      {!!comments?.length && (
        <ScrollView
          contentContainerStyle={{
            flexDirection: "column",
            paddingBottom: 10,
            gap: 8,
            padding: 4,
          }}
        >
          {comments.length &&
            comments.map((comment, ind) => {
              return (
                <Card key={"comment" + ind} contentStyle={{}}>
                  <Card.Content
                    style={[
                      { flexDirection: "row", maxWidth: "100%", padding: 0 },
                    ]}
                  >
                    <View style={{ flex: 1, padding: 8 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <View style={{ flexDirection: "row", flex: 1 }}>
                          <Pressable
                            onPress={() => {
                              if (comment?.author)
                                navigation.navigate({
                                  pathname: "/user/[uid]",
                                  params: { uid: comment.author },
                                });
                            }}
                          >
                            <ThemedText style={{ fontWeight: "bold" }}>
                              {comment?.profiles?.full_name}
                            </ThemedText>
                          </Pressable>
                          <ThemedText>
                            {" "}
                            {elapsedTime(comment.created_at)}
                          </ThemedText>
                        </View>
                      </View>
                      <UrlText text={comment.text} />
                    </View>
                    {comment.image && (
                      <Pressable onPress={() => setSelectedComment(comment)}>
                        <SupabaseImage
                          bucket="comments"
                          path={comment.image}
                          style={{
                            width: 100,
                            height: 100,
                            borderTopRightRadius: 12,
                            borderBottomRightRadius: 12,
                          }}
                        />
                      </Pressable>
                    )}
                    {uid && (
                      <IconButton
                        icon="dots-vertical"
                        onPress={(e) => showCommentMenu(e, comment)}
                        size={18}
                        iconColor={comment.image ? "white" : "black"}
                        style={{ margin: 0, position: "absolute", right: 0 }}
                      />
                    )}
                  </Card.Content>
                </Card>
              );
            })}
        </ScrollView>
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
              <Menu.Item
                onPress={() => {
                  navigation.navigate({
                    pathname: "/user/[uid]",
                    params: { uid: menuAnchor.comment.author },
                  });
                  setMenuAnchor(null);
                }}
                title={menuAnchor?.comment?.profiles?.full_name + " profilja"}
                leadingIcon="account"
              />
              <Menu.Item
                onPress={() => {}}
                title="Problémám van ezzel a kommenttel."
                leadingIcon="alert"
                disabled
              />
            </>
          ))}
      </Menu>

      {downloading && !comments.length ? (
        <ActivityIndicator />
      ) : (
        !comments?.length && (
          <ThemedText style={{ padding: 20 }}>
            Még nem érkezett komment
          </ThemedText>
        )
      )}
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
