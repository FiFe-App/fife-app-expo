/**
 * Picking a suggestion in TagInput.
 *
 * The hazard covered here: the field already commits the draft and closes itself on blur,
 * and pressing a suggestion blurs the field first. Without a guard, the list would be
 * torn down — and the half-typed draft committed as its own tag — before the press
 * landed, so tapping a suggestion would produce the very typo it was there to replace.
 *
 * Ordering note: firing a "blur" at react-native-paper's TextInput leaves this renderer
 * in a state where the *next* test in the same file renders a tree the queries can no
 * longer see. That is a harness quirk, not a component one, so every blur-driven
 * assertion lives in the last test here. Adding a test after it will fail for reasons
 * that have nothing to do with the code under test.
 */
import { fireEvent, waitFor } from "@testing-library/react-native";

import TagInput from "@/components/TagInput";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

beforeEach(() => {
  __resetSupabase();
});

const PLACEHOLDER = "Új kulcsszó…";

type View = Awaited<ReturnType<typeof renderWithProviders>>;

/**
 * Opens the field and types `draft`. Queries come off the render result rather than the
 * global `screen`, which only tracks the most recent render.
 */
const typeInto = async (view: View, draft: string) => {
  fireEvent.press(view.getByText("Új kulcsszó"));
  const input = await view.findByPlaceholderText(PLACEHOLDER);
  fireEvent.changeText(input, draft);
  // The state update is not flushed synchronously here, and a blur fired before it lands
  // would read an empty draft — making a commit-on-blur assertion pass for no reason.
  await waitFor(() =>
    expect(view.getByPlaceholderText(PLACEHOLDER).props.value).toBe(draft),
  );
  return input;
};

describe("TagInput / suggestions", () => {
  it("offers nothing and asks nothing when suggesting is off", async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ name: "kertészet", usage_count: 12 }],
      error: null,
    });

    const view = await renderWithProviders(
      <TagInput value={[]} onChange={jest.fn()} />,
    );
    await typeInto(view, "kert");

    await waitFor(() => expect(view.queryByText("kertészet")).toBeNull());
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("does not offer a tag that is already on the chip row", async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        { name: "kertészet", usage_count: 12 },
        { name: "kerítés", usage_count: 4 },
      ],
      error: null,
    });

    const view = await renderWithProviders(
      <TagInput value={["kertészet"]} onChange={jest.fn()} suggest />,
    );
    await typeInto(view, "ker");

    await view.findByText("kerítés");
    // "kertészet" is on screen as an existing chip, so it must appear exactly once — as
    // that chip, never as a suggestion the field would then refuse as a duplicate.
    expect(view.getAllByText("kertészet")).toHaveLength(1);
  });

  // Keep last — see the ordering note at the top of this file.
  it("lets the suggestion win over the typed draft", async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ name: "kertészet", usage_count: 12 }],
      error: null,
    });
    const onChange = jest.fn();

    const view = await renderWithProviders(
      <TagInput value={[]} onChange={onChange} suggest />,
    );
    const input = await typeInto(view, "kerteszet");

    const suggestion = await view.findByText("kertészet");
    // The real press order on both web and native: press-in, then the blur it causes,
    // then the press itself.
    fireEvent(suggestion, "pressIn");
    fireEvent(input, "blur");
    fireEvent.press(suggestion);

    // Exactly one commit, and it is the dictionary's spelling — the typed draft must not
    // survive as a tag of its own.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["kertészet"]);

  });
});
