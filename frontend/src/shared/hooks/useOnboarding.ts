import { usePersistentState } from './usePersistentState';

/**
 * useOnboarding - A specialized hook for managing feature discovery and onboarding states.
 * It uses persistent storage to ensure a user only sees a tip or guide once.
 * 
 * @param featureId The unique identifier for the feature discovery (e.g., 'chat:media:pills')
 * @returns [isVisible, markAsSeen, reset]
 */
export function useOnboarding(featureId: string) {
  const key = `onboarding:${featureId}`;
  
  // Storage holds true if the user HAS SEEN it already.
  // Initial value is false (brand new user).
  const [hasSeen, setHasSeen] = usePersistentState<boolean>(key, false);

  const isVisible = !hasSeen;

  const markAsSeen = () => {
    setHasSeen(true);
  };

  const reset = () => {
    setHasSeen(false);
  };

  return {
    isVisible,
    markAsSeen,
    reset
  };
}
