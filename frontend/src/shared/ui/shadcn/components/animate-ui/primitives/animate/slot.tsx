'use client';

import * as React from 'react';
import { motion, isMotionComponent, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/shadcn/lib/utils';

type AnyProps = Record<string, unknown>;

type DOMMotionProps<T extends HTMLElement = HTMLElement> = Omit<
  HTMLMotionProps<keyof HTMLElementTagNameMap>,
  'ref'
> & { ref?: React.Ref<T> };

type WithAsChild<Base extends object> =
  | (Base & { asChild: true; children: React.ReactElement })
  | (Base & { asChild?: false | undefined });

type SlotProps<T extends HTMLElement = HTMLElement> = {
  children?: any;
} & DOMMotionProps<T>;

function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as React.RefObject<T | null>).current = node;
      }
    });
  };
}

function mergeProps<T extends HTMLElement>(
  childProps: AnyProps,
  slotProps: DOMMotionProps<T>,
): AnyProps {
  const merged: AnyProps = { ...childProps, ...slotProps };

  if (childProps.className || slotProps.className) {
    merged.className = cn(
      childProps.className as string,
      slotProps.className as string,
    );
  }

  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style as React.CSSProperties),
      ...(slotProps.style as React.CSSProperties),
    };
  }

  return merged;
}

// Cache for motion components to avoid recreating during render
const motionComponentCache = new Map<any, React.ElementType>();

function getOrCreateMotionComponent(type: React.ElementType, isAlreadyMotion: boolean): React.ElementType {
  if (isAlreadyMotion) return type;
  
  let cached = motionComponentCache.get(type);
  if (!cached) {
    cached = motion.create(type);
    motionComponentCache.set(type, cached);
  }
  return cached;
}

/* eslint-disable react-hooks/static-components -- Dynamic motion component creation is intentional and cached */
function Slot<T extends HTMLElement = HTMLElement>({
  children,
  ref,
  ...props
}: SlotProps<T>) {
  if (!React.isValidElement(children)) return null;

  const isAlreadyMotion =
    typeof children.type === 'object' &&
    children.type !== null &&
    isMotionComponent(children.type);

  const Base = getOrCreateMotionComponent(children.type as React.ElementType, isAlreadyMotion);

  const { ref: childRef, ...childProps } = children.props as Record<string, unknown>;

  const mergedProps = mergeProps(childProps, props);

  return (
    <Base {...mergedProps} ref={mergeRefs(childRef as React.Ref<T>, ref)} />
  );
}
/* eslint-enable react-hooks/static-components */

export {
  Slot,
  type SlotProps,
  type WithAsChild,
  type DOMMotionProps,
  type AnyProps,
};
