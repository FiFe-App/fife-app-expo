import { Linking } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";

import ToDoList from "@/components/ToDoList";
import { addTask, setTaskReminder } from "@/redux/reducers/userReducer";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";
import { inputByLabel } from "@/test-utils/paper";
import {
  cancelTaskReminder,
  scheduleTaskReminder,
} from "@/lib/notifications/scheduleTaskReminder";

// The module talks to the OS notification scheduler; only the calls matter here.
jest.mock("@/lib/notifications/scheduleTaskReminder", () => ({
  ...jest.requireActual("@/lib/notifications/scheduleTaskReminder"),
  scheduleTaskReminder: jest.fn(async () => "scheduled"),
  cancelTaskReminder: jest.fn(async () => {}),
}));

const setup = async () => {
  const store = createTestStore();
  store.dispatch(addTask({ id: "t1", title: "Adóbevallás", checked: false }));
  await renderWithProviders(<ToDoList />, { store });
  return store;
};

describe("ToDoList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  it("opens the task in a modal when its row is pressed, without ticking it", async () => {
    const store = await setup();

    await fireEvent.press(screen.getByLabelText("Adóbevallás"));

    expect(screen.getByText("Emlékeztető")).toBeTruthy();
    expect(store.getState().user.tasks![0].checked).toBe(false);
  });

  it("ticks the task off from the icon", async () => {
    const store = await setup();

    await fireEvent.press(screen.getByLabelText("Kipipálás"));

    expect(store.getState().user.tasks![0].checked).toBe(true);
  });

  it("searches Google for the task's name", async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText("Adóbevallás"));

    await fireEvent.press(screen.getByText("Keress rá"));

    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://www.google.com/search?q=Ad%C3%B3bevall%C3%A1s",
    );
  });

  it("adds subtasks and shows their progress on the row", async () => {
    const store = await setup();
    await fireEvent.press(screen.getByLabelText("Adóbevallás"));

    const input = inputByLabel("Mi lenne az első kicsi lépés?");
    await fireEvent.changeText(input, "Belépés az ügyfélkapuba");
    await fireEvent(input, "submitEditing");

    expect(store.getState().user.tasks![0].subtasks).toHaveLength(1);
    await fireEvent.press(screen.getByLabelText("Belépés az ügyfélkapuba"));
    expect(store.getState().user.tasks![0].checked).toBe(true);
  });

  it("sets a reminder and schedules it", async () => {
    const store = await setup();
    await fireEvent.press(screen.getByLabelText("Adóbevallás"));

    await fireEvent.press(screen.getByText("Holnap reggel"));

    expect(store.getState().user.tasks![0].remindAt).toBeTruthy();
    expect(scheduleTaskReminder).toHaveBeenCalledWith("t1", "Adóbevallás", expect.any(Date));
  });

  it("marks the chosen reminder chip and cancels it from the chip's x", async () => {
    const store = await setup();
    await fireEvent.press(screen.getByLabelText("Adóbevallás"));
    await fireEvent.press(screen.getByText("Holnap reggel"));
    expect(store.getState().user.tasks![0].remindPreset).toBe("tomorrow");

    await fireEvent.press(screen.getByLabelText("Holnap reggel emlékeztető törlése"));

    expect(store.getState().user.tasks![0].remindAt).toBeUndefined();
    expect(cancelTaskReminder).toHaveBeenCalledWith("t1");
    expect(screen.queryByLabelText("Holnap reggel emlékeztető törlése")).toBeNull();
  });

  it("shows only the chosen reminder chip, and all the options again once it is cancelled", async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText("Adóbevallás"));
    await fireEvent.press(screen.getByText("1 óra múlva"));

    expect(screen.queryByText("Holnap reggel")).toBeNull();

    await fireEvent.press(screen.getByLabelText("1 óra múlva emlékeztető törlése"));

    expect(screen.getByText("Holnap reggel")).toBeTruthy();
  });

  it("edits the title only on request, like the mantra", async () => {
    const store = await setup();
    await fireEvent.press(screen.getByLabelText("Adóbevallás"));
    expect(screen.queryByLabelText("Cím mentése")).toBeNull();

    await fireEvent.press(screen.getByLabelText("Cím szerkesztése"));
    await fireEvent.changeText(inputByLabel("Mit szeretnél elvégezni?"), "Adó");
    await fireEvent.press(screen.getByLabelText("Cím mentése"));

    expect(store.getState().user.tasks![0].title).toBe("Adó");
    expect(screen.queryByLabelText("Cím mentése")).toBeNull();
  });

  it("deletes the task only after confirmation, and cancels its reminder", async () => {
    const store = await setup();
    await fireEvent.press(screen.getByLabelText("Adóbevallás"));

    await fireEvent.press(screen.getByText("Feladat törlése"));
    expect(store.getState().user.tasks).toHaveLength(1);

    await fireEvent.press(screen.getByText("Törlés"));
    expect(store.getState().user.tasks).toHaveLength(0);
    expect(cancelTaskReminder).toHaveBeenCalledWith("t1");
  });

  it("drops a reminder whose time has passed when the list is shown", async () => {
    const store = createTestStore();
    store.dispatch(addTask({ id: "t1", title: "Adóbevallás", checked: false }));
    store.dispatch(addTask({ id: "t2", title: "Fogorvos", checked: false }));
    store.dispatch(
      setTaskReminder({ id: "t1", remindAt: new Date(Date.now() - 60_000).toISOString() }),
    );
    const later = new Date(Date.now() + 3_600_000).toISOString();
    store.dispatch(setTaskReminder({ id: "t2", remindAt: later }));

    await renderWithProviders(<ToDoList />, { store });

    const [first, second] = store.getState().user.tasks!;
    expect(first.remindAt).toBeUndefined();
    expect(second.remindAt).toBe(later);
  });

  it("drops the reminder when its time arrives while the list is open", async () => {
    jest.useFakeTimers();
    try {
      const store = createTestStore();
      store.dispatch(addTask({ id: "t1", title: "Adóbevallás", checked: false }));
      store.dispatch(
        setTaskReminder({ id: "t1", remindAt: new Date(Date.now() + 5_000).toISOString() }),
      );
      await renderWithProviders(<ToDoList />, { store });
      expect(store.getState().user.tasks![0].remindAt).toBeDefined();

      await act(async () => {
        jest.advanceTimersByTime(6_000);
      });

      expect(store.getState().user.tasks![0].remindAt).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });
});
