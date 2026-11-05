import { fireEvent, screen } from "@testing-library/react-native";

import { MessageItem } from "@/components/chat/MessageItem";
import { login } from "@/redux/reducers/userReducer";
import { __resetSupabase } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/supabase/supabase", () => require("@/test-utils/mocks/supabase"));

const message = (author: string) => ({
  id: 1,
  author,
  text: "Sziasztok!",
  reply_to: null,
  created_at: "2026-09-02T10:00:00Z",
});

const author = {
  id: "u2",
  full_name: "Kovács Anna",
  username: null,
  avatar_url: null,
};

const renderItem = async (props: Partial<Parameters<typeof MessageItem>[0]>) => {
  const store = createTestStore();
  store.dispatch(login("me"));
  return renderWithProviders(
    <MessageItem
      message={message("u2")}
      selected={false}
      onPress={jest.fn()}
      hearted={false}
      onToggleHeart={jest.fn()}
      onLongPress={jest.fn()}
      {...props}
    />,
    { store },
  );
};

beforeEach(() => __resetSupabase());

describe("MessageItem in a group chat", () => {
  it("shows the author's name on the first message of a run", async () => {
    await renderItem({ author, showAuthor: true });

    expect(screen.getByText("Sziasztok!")).toBeTruthy();
    expect(screen.getByText("Kovács Anna")).toBeTruthy();
  });

  it("leaves the name off later messages of the same run", async () => {
    await renderItem({ author, showAuthor: false });

    expect(screen.queryByText("Kovács Anna")).toBeNull();
  });

  it("never labels my own messages", async () => {
    await renderItem({ message: message("me"), author: { ...author, id: "me" }, showAuthor: true });

    expect(screen.queryByText("Kovács Anna")).toBeNull();
  });

  it("stays unchanged in 1:1 chats, where no author is passed", async () => {
    await renderItem({});

    expect(screen.getByText("Sziasztok!")).toBeTruthy();
    expect(screen.queryByText("Kovács Anna")).toBeNull();
  });
});

describe("MessageItem replies and hearts", () => {
  const quoted = { ...message("u2"), id: 7, text: "Ki jön holnap?" };

  it("jumps to the quoted message when the quote is tapped", async () => {
    const onReplyPress = jest.fn();
    await renderItem({
      message: { ...message("me"), reply_to: 7 },
      replyToMessage: quoted,
      onReplyPress,
    });

    await fireEvent.press(screen.getByText("Ki jön holnap?"));

    expect(onReplyPress).toHaveBeenCalledTimes(1);
  });

  it("does not offer a jump when the quoted message was deleted", async () => {
    await renderItem({ message: { ...message("me"), reply_to: 7 }, replyToDeleted: true });

    expect(screen.getByText("Törölt üzenetre válaszolt")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("counts the hearts when more than one person gave one", async () => {
    await renderItem({ hearted: true, heartCount: 3 });

    expect(screen.getByText("3")).toBeTruthy();
  });

  it("shows a single heart without a number", async () => {
    await renderItem({ hearted: true, heartCount: 1 });

    expect(screen.queryByText("1")).toBeNull();
  });
});
