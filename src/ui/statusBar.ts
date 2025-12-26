import { START_TIMER_COMMAND } from "../constants";
import { ExtensionState } from "../state";

export const createStatusBar = (state: ExtensionState) => {
	state.statusBar.show()
}