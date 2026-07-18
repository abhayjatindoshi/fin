/**
 * Briefing service — public surface.
 *
 * Composes the monthly briefing Home renders (§11, §15): rolls the selected
 * fiscal year's transactions into per-category spends, runs the calibration +
 * attention engines through a live `CalibrationData` port, and projects the
 * result into a `BriefingView`. The pure rollup + projection helpers are
 * exported for testing; Home consumes only the `BriefingView` via the service.
 */

export { BriefingService } from "./briefing-service"
export { rollUp, categoryOf, formatMonthKey } from "./rollup"
export type { TagMeta, RollupTransaction, BriefingRollup } from "./rollup"
export { buildBriefing } from "./compose"
export type { BuildBriefingInput, TagDisplay } from "./compose"
