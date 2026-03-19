import { useTranslation } from "react-i18next";
import { GuidedTour, type TourStep } from "@/shared/ui/components/GuidedTour";
import { useTour } from "@/app/providers/useTour";
import type { TourSetId } from "../../../domain/models";

export function SetupTours() {
  const { t } = useTranslation("guidedSetup");
  const { isTourOpen, currentTourId, closeTour, finishTour } = useTour();

  // Tours are focused on elements visible on the current screen (GuidedWorkspaceSetupPage)
  // Note: Our GuidedTour component doesn't support cross-page navigation yet.
  // All target elements must exist on the current screen.
  const tourSteps: Record<TourSetId, TourStep[]> = {
    "invite-users": [
      {
        target: '[data-tour="setup-wizard"]',
        title: t("tours.inviteUsers.steps.wizard.title", "Setup Wizard"),
        content: t(
          "tours.inviteUsers.steps.wizard.content",
          "This wizard guides you through the essential setup steps. Each step can be expanded for more details."
        ),
        position: "right",
      },
      {
        target: '[data-tour="quick-start"]',
        title: t("tours.inviteUsers.steps.quickStart.title", "Quick Start"),
        content: t(
          "tours.inviteUsers.steps.quickStart.content",
          'Use the "Invite User" shortcut here to quickly invite team members without leaving this page.'
        ),
        position: "top",
      },
      {
        target: '[data-tour="readiness-checks"]',
        title: t("tours.inviteUsers.steps.readiness.title", "System Readiness"),
        content: t(
          "tours.inviteUsers.steps.readiness.content",
          'Once you invite users, the "Admin users present" check will be marked as ready.'
        ),
        position: "top",
      },
    ],
    "create-teams": [
      {
        target: '[data-tour="setup-wizard"]',
        title: t("tours.createTeams.steps.wizard.title", "Setup Wizard"),
        content: t(
          "tours.createTeams.steps.wizard.content",
          'Expand the "Create Teams" step to see detailed instructions for organizing your users.'
        ),
        position: "right",
      },
      {
        target: '[data-tour="quick-start"]',
        title: t("tours.createTeams.steps.quickStart.title", "Quick Start"),
        content: t(
          "tours.createTeams.steps.quickStart.content",
          'Click "Create Team" to open the team creation dialog directly from here.'
        ),
        position: "top",
      },
      {
        target: '[data-tour="contextual-preview"]',
        title: t("tours.createTeams.steps.preview.title", "Contextual Preview"),
        content: t(
          "tours.createTeams.steps.preview.content",
          "This area shows helpful information about the currently selected step."
        ),
        position: "left",
      },
    ],
    "configure-email": [
      {
        target: '[data-tour="setup-wizard"]',
        title: t(
          "tours.configureEmail.steps.wizard.title",
          "Email Configuration"
        ),
        content: t(
          "tours.configureEmail.steps.wizard.content",
          'Expand the "Configure Email" step to set up email templates and notifications.'
        ),
        position: "right",
      },
      {
        target: '[data-tour="quick-start"]',
        title: t(
          "tours.configureEmail.steps.quickStart.title",
          "Email Templates"
        ),
        content: t(
          "tours.configureEmail.steps.quickStart.content",
          "Access email templates directly from the Quick Start shortcuts."
        ),
        position: "top",
      },
      {
        target: '[data-tour="readiness-checks"]',
        title: t(
          "tours.configureEmail.steps.readiness.title",
          "Email Provider Status"
        ),
        content: t(
          "tours.configureEmail.steps.readiness.content",
          'Check the "Email provider configured" status to verify your email setup.'
        ),
        position: "top",
      },
    ],
    "explore-apps": [
      {
        target: '[data-tour="setup-progress"]',
        title: t("tours.exploreApps.steps.progress.title", "Your Progress"),
        content: t(
          "tours.exploreApps.steps.progress.content",
          "Track your overall setup progress here. Complete all steps to unlock the full potential of your workspace."
        ),
        position: "bottom",
      },
      {
        target: '[data-tour="setup-wizard"]',
        title: t("tours.exploreApps.steps.wizard.title", "Explore Apps Step"),
        content: t(
          "tours.exploreApps.steps.wizard.content",
          'The "Explore Apps" step introduces you to all available applications in your workspace.'
        ),
        position: "right",
      },
      {
        target: '[data-tour="quick-start"]',
        title: t("tours.exploreApps.steps.quickStart.title", "Quick Access"),
        content: t(
          "tours.exploreApps.steps.quickStart.content",
          "Use these shortcuts to quickly access common features and settings."
        ),
        position: "top",
      },
    ],
  };

  // Only render if a setup tour is open
  const isSetupTourOpen =
    isTourOpen && currentTourId && currentTourId in tourSteps;

  if (!isSetupTourOpen) return null;

  const steps = tourSteps[currentTourId as TourSetId];

  return (
    <GuidedTour
      steps={steps}
      isOpen={isSetupTourOpen}
      onClose={closeTour}
      onFinish={finishTour}
    />
  );
}
