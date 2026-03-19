import { useTranslation } from "react-i18next";
import { GuidedTour, type TourStep } from "@/shared/ui/components/GuidedTour";
import { useTour } from "@/app/providers/useTour";

export const POWER_TIPS_TOUR_ID = "power-tips-tour";

export function PowerTipsTour() {
  const { t } = useTranslation("activityHub");
  const { isTourOpen, currentTourId, closeTour, finishTour } = useTour();

  const steps: TourStep[] = [
    {
      target: '[data-tour="command-hero"]',
      title: t("powerTips.steps.command.title", "Command Center"),
      content: t(
        "powerTips.steps.command.content",
        "Use the command center to quickly search, navigate, or take actions. Press ⌘K to open from anywhere."
      ),
      position: "bottom",
    },
    {
      target: '[data-tour="todays-focus"]',
      title: t("powerTips.steps.focus.title", "Today's Focus"),
      content: t(
        "powerTips.steps.focus.content",
        "See your most important tasks and pending items. High priority items appear first."
      ),
      position: "right",
    },
    {
      target: '[data-tour="activity-stream"]',
      title: t("powerTips.steps.activity.title", "Activity Insights"),
      content: t(
        "powerTips.steps.activity.content",
        "Track recent actions in your workspace. User actions are highlighted for quick scanning."
      ),
      position: "left",
    },
    {
      target: '[data-tour="utility-rail"]',
      title: t("powerTips.steps.utility.title", "Utility Rail"),
      content: t(
        "powerTips.steps.utility.content",
        "Quick access to system stats, recently used modules, and keyboard shortcuts."
      ),
      position: "left",
    },
  ];

  // Only render if this specific tour is open
  const isThisTourOpen = isTourOpen && currentTourId === POWER_TIPS_TOUR_ID;

  return (
    <GuidedTour
      steps={steps}
      isOpen={isThisTourOpen}
      onClose={closeTour}
      onFinish={finishTour}
    />
  );
}
