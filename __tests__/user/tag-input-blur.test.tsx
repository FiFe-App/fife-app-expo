/**
 * The plain commit-on-blur path, which the suggestion guard must not have broken:
 * blurring the field with something typed in it still adds that as a tag. This is how a
 * tag that is not in the dictionary yet gets created at all.
 *
 * It lives in its own file because firing a "blur" at react-native-paper's TextInput
 * leaves this renderer unable to see the next test's tree — see the note in
 * tag-input-suggestions.test.tsx.
 */
import { fireEvent, waitFor } from "@testing-library/react-native";

import TagInput from "@/components/TagInput";
import { __resetSupabase, supabase } from "@/test-utils/mocks/supabase";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

beforeEach(() => {
  __resetSupabase();
});

it("commits a typed tag on blur when no suggestion was pressed", async () => {
  supabase.rpc.mockResolvedValue({ data: [], error: null });
  const onChange = jest.fn();

  const view = await renderWithProviders(
    <TagInput value={[]} onChange={onChange} suggest />,
  );
  fireEvent.press(view.getByText("Új kulcsszó"));
  const input = await view.findByPlaceholderText("Új kulcsszó…");
  fireEvent.changeText(input, "sajátcímke");
  // The draft state has to land before the blur, or the blur would read an empty field
  // and the assertion below would pass for the wrong reason.
  await waitFor(() =>
    expect(view.getByPlaceholderText("Új kulcsszó…").props.value).toBe("sajátcímke"),
  );
  fireEvent(input, "blur");

  expect(onChange).toHaveBeenCalledWith(["sajátcímke"]);
});
