import { screen, within } from "@testing-library/react-native";
import type { TestInstance } from "test-renderer";

const PAPER_INPUT_TEST_ID = /^text-input-(outlined|flat)$/;

/**
 * Finds a `react-native-paper` `TextInput` by the label the user reads.
 *
 * Paper renders the label as a sibling `Text` rather than wiring it to the
 * input's accessibility label, so `getByLabelText` cannot see it. Walk up from
 * the label to the nearest ancestor that also contains the input element.
 */
export const inputByLabel = (label: string): TestInstance => {
  const labelNode = screen.getAllByText(label, { includeHiddenElements: true })[0];

  let node: TestInstance | null = labelNode.parent;
  while (node) {
    const input = within(node).queryByTestId(PAPER_INPUT_TEST_ID, {
      includeHiddenElements: true,
    });
    if (input) return input;
    node = node.parent;
  }

  throw new Error(`No react-native-paper TextInput is labelled "${label}"`);
};
