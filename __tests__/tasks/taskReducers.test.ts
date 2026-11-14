import { createTestStore } from "@/test-utils/renderWithProviders";
import {
  addSubtask,
  clearExpiredTaskReminders,
  addTask,
  deleteSubtask,
  deleteTask,
  setTaskReminder,
  snoozeTask,
  toggleSubtask,
  toggleTask,
  updateTaskTitle,
} from "@/redux/reducers/userReducer";

const seed = () => {
  const store = createTestStore();
  store.dispatch(addTask({ id: "t1", title: "Adóbevallás", checked: false }));
  return store;
};
const task = (store: ReturnType<typeof seed>) => store.getState().user.tasks![0];

describe("task reducers", () => {
  it("renames a task but never to an empty title", () => {
    const store = seed();
    store.dispatch(updateTaskTitle({ id: "t1", title: "  Számla  " }));
    expect(task(store).title).toBe("Számla");

    store.dispatch(updateTaskTitle({ id: "t1", title: "   " }));
    expect(task(store).title).toBe("Számla");
  });

  it("deletes a task", () => {
    const store = seed();
    store.dispatch(deleteTask("t1"));
    expect(store.getState().user.tasks).toEqual([]);
  });

  it("works on state saved before tasks existed", () => {
    const store = createTestStore();
    expect(store.getState().user.tasks).toBeUndefined();
    store.dispatch(deleteTask("nope"));
    store.dispatch(toggleTask("nope"));
    expect(store.getState().user.tasks).toEqual([]);
  });

  it("checks the task when its last subtask is done and reopens it with any", () => {
    const store = seed();
    store.dispatch(addSubtask({ taskId: "t1", subtask: { id: "a", title: "Belépés", checked: false } }));
    store.dispatch(addSubtask({ taskId: "t1", subtask: { id: "b", title: "Kitöltés", checked: false } }));

    store.dispatch(toggleSubtask({ taskId: "t1", subtaskId: "a" }));
    expect(task(store).checked).toBe(false);

    store.dispatch(toggleSubtask({ taskId: "t1", subtaskId: "b" }));
    expect(task(store).checked).toBe(true);

    store.dispatch(toggleSubtask({ taskId: "t1", subtaskId: "a" }));
    expect(task(store).checked).toBe(false);
  });

  it("reopens a finished task when a new subtask is added", () => {
    const store = seed();
    store.dispatch(toggleTask("t1"));
    store.dispatch(addSubtask({ taskId: "t1", subtask: { id: "a", title: "Még ez", checked: false } }));
    expect(task(store).checked).toBe(false);
  });

  it("removes a subtask", () => {
    const store = seed();
    store.dispatch(addSubtask({ taskId: "t1", subtask: { id: "a", title: "Belépés", checked: false } }));
    store.dispatch(deleteSubtask({ taskId: "t1", subtaskId: "a" }));
    expect(task(store).subtasks).toEqual([]);
  });

  it("sets, snoozes and clears a reminder, counting the snoozes", () => {
    const store = seed();
    store.dispatch(
      setTaskReminder({ id: "t1", remindAt: "2026-11-01T09:00:00.000Z", preset: "tomorrow" }),
    );
    expect(task(store).remindAt).toBe("2026-11-01T09:00:00.000Z");
    expect(task(store).remindPreset).toBe("tomorrow");
    expect(task(store).snoozeCount).toBeUndefined();

    store.dispatch(snoozeTask({ id: "t1", remindAt: "2026-11-02T09:00:00.000Z" }));
    store.dispatch(snoozeTask({ id: "t1", remindAt: "2026-11-03T09:00:00.000Z" }));
    expect(task(store).remindAt).toBe("2026-11-03T09:00:00.000Z");
    expect(task(store).snoozeCount).toBe(2);

    store.dispatch(setTaskReminder({ id: "t1", remindAt: null }));
    expect(task(store)).not.toHaveProperty("remindAt");
    expect(task(store)).not.toHaveProperty("remindPreset");
    // Clearing a reminder is not forgetting how often it was put off.
    expect(task(store).snoozeCount).toBe(2);
  });

  it("clears only the reminders whose time has passed, keeping the snooze count", () => {
    const store = seed();
    store.dispatch(addTask({ id: "t2", title: "Fogorvos", checked: false }));
    store.dispatch(
      setTaskReminder({ id: "t1", remindAt: "2026-11-01T09:00:00.000Z", preset: "tomorrow" }),
    );
    store.dispatch(snoozeTask({ id: "t1", remindAt: "2026-11-01T09:00:00.000Z" }));
    store.dispatch(setTaskReminder({ id: "t2", remindAt: "2026-11-03T09:00:00.000Z" }));

    store.dispatch(clearExpiredTaskReminders("2026-11-02T00:00:00.000Z"));

    const [first, second] = store.getState().user.tasks!;
    expect(first).not.toHaveProperty("remindAt");
    expect(first).not.toHaveProperty("remindPreset");
    expect(first.snoozeCount).toBe(1);
    expect(second.remindAt).toBe("2026-11-03T09:00:00.000Z");
  });

  it("leaves the tasks array alone when nothing has expired", () => {
    const store = seed();
    store.dispatch(setTaskReminder({ id: "t1", remindAt: "2026-11-01T09:00:00.000Z" }));
    const before = store.getState().user.tasks;

    store.dispatch(clearExpiredTaskReminders("2026-10-31T00:00:00.000Z"));

    expect(store.getState().user.tasks).toBe(before);
  });
});
