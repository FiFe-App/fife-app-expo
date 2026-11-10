import { NAV_DOCK_RISE } from "@/components/navigation/NavBarShape";

/**
 * How far the Én/Mi switch (components/navigation/ModeSwitch.tsx) reaches up
 * above the bottom bar. Every screen that shows the bar keeps at least this
 * much room under its content — the last list item, a floating card, the
 * message input — so nothing ends up hidden behind the switch.
 *
 * It is the dock's rise above the bar (components/navigation/NavBarShape.tsx)
 * plus a little breathing room, so it follows the dock if that ever changes.
 */
export const MODE_SWITCH_CLEARANCE = NAV_DOCK_RISE + 5;
