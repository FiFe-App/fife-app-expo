/**
 * How far the Én/Mi switch (components/navigation/ModeSwitch.tsx) reaches up
 * above the bottom bar. Every screen that shows the bar keeps at least this
 * much room under its content — the last list item, a floating card, the
 * message input — so nothing ends up hidden behind the switch.
 *
 * Change it together with the switch's position (its `bottom` offset and
 * height) if that ever moves.
 */
export const MODE_SWITCH_CLEARANCE = 40;
