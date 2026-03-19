import { useState } from "react";

type FocusState = Record<string, unknown>;

type SetFocusOptions = {
  replace?: boolean; // default true
};

export function useFocus<T extends FocusState = FocusState>() {
  const [focus, setFocusState] = useState<T>({} as T);

  const setFocus = (partial: Partial<T>, options?: SetFocusOptions) => {
    setFocusState((prev) =>
      options?.replace === false ? { ...prev, ...partial } : { ...partial } as T
    );
  };

  const clearFocus = () => setFocusState({} as T);

  const hasFocus = Object.keys(focus).length > 0;

  return {
    focus,
    setFocus,
    clearFocus,
    hasFocus,
  };
}
