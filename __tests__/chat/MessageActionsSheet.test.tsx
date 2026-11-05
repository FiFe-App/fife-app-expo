import { fireEvent, screen } from "@testing-library/react-native";

import { MessageActionsSheet } from "@/components/chat/MessageActionsSheet";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("MessageActionsSheet", () => {
  it("offers deleting on your own messages and nothing else", async () => {
    const onDelete = jest.fn();
    await renderWithProviders(
      <MessageActionsSheet visible onDismiss={jest.fn()} onDelete={onDelete} />,
    );

    expect(screen.queryByText("Jelentés")).toBeNull();
    expect(screen.queryByText("Letiltás")).toBeNull();
    await fireEvent.press(screen.getByText("Törlés"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("offers reporting and blocking on other people's messages", async () => {
    const onReport = jest.fn();
    const onBlock = jest.fn();
    await renderWithProviders(
      <MessageActionsSheet
        visible
        onDismiss={jest.fn()}
        onReport={onReport}
        onBlock={onBlock}
      />,
    );

    expect(screen.queryByText("Törlés")).toBeNull();
    await fireEvent.press(screen.getByText("Jelentés"));
    await fireEvent.press(screen.getByText("Letiltás"));
    expect(onReport).toHaveBeenCalled();
    expect(onBlock).toHaveBeenCalled();
  });
});
