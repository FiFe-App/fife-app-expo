import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ExpoImagePicker from "expo-image-picker";

import BuzinessMediaUpload from "@/components/buziness/BuzinessMediaUpload";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

// The tiles render real players; this suite is about the add flow, not playback.
jest.mock("@/components/media/MediaView", () => "MediaView");

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: "Images" },
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

const launchImageLibraryAsync =
  ExpoImagePicker.launchImageLibraryAsync as jest.Mock;
const getDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock;

const openPicker = async () => {
  fireEvent.press(await screen.findByLabelText("Média hozzáadása"));
};

describe("BuzinessMediaUpload", () => {
  it("offers a single add button rather than one per media kind", async () => {
    await renderWithProviders(
      <BuzinessMediaUpload media={[]} setMedia={jest.fn()} />,
    );

    expect(await screen.findByLabelText("Média hozzáadása")).toBeTruthy();
    // The three kinds only appear once the button is pressed.
    expect(screen.queryByText("Kép")).toBeNull();
    expect(screen.queryByText("Videó")).toBeNull();
    expect(screen.queryByText("Hang")).toBeNull();
  });

  it("asks which kind to add", async () => {
    await renderWithProviders(
      <BuzinessMediaUpload media={[]} setMedia={jest.fn()} />,
    );

    await openPicker();

    expect(await screen.findByText("Mit szeretnél hozzáadni?")).toBeTruthy();
    expect(screen.getByText("Kép")).toBeTruthy();
    expect(screen.getByText("Videó")).toBeTruthy();
    expect(screen.getByText("Hang")).toBeTruthy();
  });

  it("picks a video from the gallery", async () => {
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///clip.mp4", fileName: "clip.mp4", fileSize: 1024 }],
    });
    const setMedia = jest.fn();

    await renderWithProviders(
      <BuzinessMediaUpload media={[]} setMedia={setMedia} />,
    );

    await openPicker();
    fireEvent.press(await screen.findByText("Videó"));

    await waitFor(() =>
      expect(launchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({ mediaTypes: ["videos"], base64: false }),
      ),
    );
    await waitFor(() =>
      expect(setMedia).toHaveBeenCalledWith([
        expect.objectContaining({
          uri: "file:///clip.mp4",
          mediaType: "video",
          status: "toUpload",
        }),
      ]),
    );
  });

  it("picks audio from the file manager, not the gallery", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///song.mp3",
          name: "song.mp3",
          size: 2048,
          mimeType: "audio/mpeg",
        },
      ],
    });
    const setMedia = jest.fn();

    await renderWithProviders(
      <BuzinessMediaUpload media={[]} setMedia={setMedia} />,
    );

    await openPicker();
    fireEvent.press(await screen.findByText("Hang"));

    await waitFor(() =>
      expect(getDocumentAsync).toHaveBeenCalledWith(
        expect.objectContaining({ type: "audio/*" }),
      ),
    );
    expect(launchImageLibraryAsync).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(setMedia).toHaveBeenCalledWith([
        expect.objectContaining({
          uri: "file:///song.mp3",
          mediaType: "audio",
          mimeType: "audio/mpeg",
          status: "toUpload",
        }),
      ]),
    );
  });

  it("refuses a file over the size limit", async () => {
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///huge.mp4",
          fileName: "huge.mp4",
          fileSize: 51 * 1024 * 1024,
        },
      ],
    });
    const setMedia = jest.fn();

    await renderWithProviders(
      <BuzinessMediaUpload media={[]} setMedia={setMedia} />,
    );

    await openPicker();
    fireEvent.press(await screen.findByText("Videó"));

    await waitFor(() => expect(launchImageLibraryAsync).toHaveBeenCalled());
    expect(setMedia).not.toHaveBeenCalled();
  });
});
