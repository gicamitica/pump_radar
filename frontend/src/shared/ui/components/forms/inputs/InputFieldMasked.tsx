// Create a masked version of the shadcn Input component

import { Input } from "@/shadcn/components/ui/input";
import { IMaskMixin } from "react-imask";

// We use React.ComponentProps<typeof Input> to get the props of the Input component
export const InputFieldMasked = IMaskMixin(
  ({ inputRef, ...props }: React.ComponentProps<typeof Input> & { inputRef: React.Ref<HTMLInputElement> }) => {
    return <Input {...props} ref={inputRef} />;
  }
);