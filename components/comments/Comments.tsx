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
  Text,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
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

const Comments = ({ path, placeholder, limit = 10 }: CommentsProps) => {
  const dispatch = useDispatch();
  const navigation = router;

  const { uid, name }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const { comments }: CommentsState = useSelector(
    (state: RootState) => state.comments2,
  );
  const commentsChannel = supabase.channel("room");
  const author = name;
  const [text, setText] = useState("");
  const [image, setImage] = useState<ExpoImagePicker.ImagePickerAsset | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
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
        .select()
        .order("created_at", { ascending: false });
      if (data) dispatch(addComments(data));
      console.log(error);
    };

    getMessages();

    commentsChannel
      .on<Comment>(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (data) => {
          if (data.eventType === "INSERT") {
            dispatch(addComment(data.new));
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

  const openMenu = () => setShowMenu(true);
  const closeMenu = () => setShowMenu(false);

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
      console.log(result);

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
          author_name: author,
          text,
          key: path,
        })
        .select()
        .then(async ({ data, error }) => {
          setLoading(false);

          if (image && !error) {
            const upload = await uploadImage(uid + "/" + path, data?.[0].id);
            console.log("image upload", upload);

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
    openMenu();
  };
  const deleteComment = async (comment: Comment) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment.id);
    if (!error) {
      setShowMenu(false);
      dispatch(deleteCommentSlice(comment.id));
      console.log(comment.id);

      if (comment.image !== "") removeImage(comment);
      //TODO TOAST
    } else {
      console.log(error);
      setShowMenu(false);
    }
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
        <View style={{ flexGrow: 1 }}>
          <TextInput
            style={{}}
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
        {image ? (
          <ImageBackground source={{ uri: image.uri }}>
            <IconButton icon="close" onPress={dismissImage} />
          </ImageBackground>
        ) : (
          <IconButton icon="image" onPress={pickImage} disabled={!uid} />
        )}
        <Button
          icon="arrow-left-bottom-bold"
          onPress={handleSend}
          disabled={!uid || !text}
          style={{ height: "100%", margin: 0 }}
          loading={loading}
        >
          <Text>Küldés</Text>
        </Button>
      </View>
      <View style={{ flexDirection: "row", padding: 10 }}>
        <Text style={{ flex: 1 }}>Kommentek:</Text>
        <Text>Újabbak elöl</Text>
      </View>
      {!!comments?.length && (
        <ScrollView
          style={{ minHeight: 200 }}
          contentContainerStyle={{ flexDirection: "column", paddingBottom: 10 }}
        >
          {comments.map((comment, ind) => {
            return (
              <View
                key={"comment" + ind}
                style={[{ flexDirection: "row", maxWidth: "100%", margin: 5 }]}
              >
                <View style={{ backgroundColor: "white", flex: 1, padding: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", flex: 1 }}>
                      <Pressable
                        onPress={() => {
                          if (comment?.author)
                            navigation.push({
                              pathname: "user/" + comment.author,
                            });
                        }}
                      >
                        <Text style={{ fontWeight: "bold" }}>
                          {comment.author_name}
                        </Text>
                      </Pressable>
                      <Text> {elapsedTime(comment.created_at)}</Text>
                    </View>
                  </View>
                  <UrlText text={comment.text} />
                </View>
                {comment.image && (
                  <Pressable onPress={() => setSelectedComment(comment)}>
                    <SupabaseImage
                      path={comment.image}
                      style={{ width: 100, height: 100 }}
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
              </View>
            );
          })}
        </ScrollView>
      )}

      {uid && (
        <Menu visible={showMenu} onDismiss={closeMenu} anchor={menuAnchor}>
          {menuAnchor?.comment?.author === uid ? (
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
                  navigation.push("user/" + menuAnchor?.comment.author);
                  setShowMenu(false);
                }}
                title={menuAnchor?.comment?.author_name + " profilja"}
                leadingIcon="account"
              />
              <Menu.Item
                onPress={() => {}}
                title="Problémám van ezzel a kommenttel."
                leadingIcon="alert"
                disabled
              />
            </>
          )}
        </Menu>
      )}
      {downloading ? (
        <ActivityIndicator />
      ) : (
        !comments?.length && (
          <Text style={{ padding: 20 }}>Még nem érkezett komment</Text>
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
