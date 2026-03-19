import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/components/ui/avatar';
import { mockUser } from './ProfileAccountData';

/**
 * ProfileHeroWidget
 * A large, prominent profile card for the top of the sidebar.
 */
export const ProfileHeroWidget: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  if (collapsed) {
    return (
      <div className="flex justify-center p-2">
        <Avatar className="size-10 border-2 border-primary/20 bg-sidebar-surface">
          <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
          <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center p-6 space-y-4">
      <div className="relative">
        <Avatar className="size-24 border-4 border-sidebar-surface shadow-xl ring-2 ring-primary/10">
          <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
          <AvatarFallback className="text-2xl">{mockUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-1 right-1 size-5 rounded-full border-4 border-sidebar-background bg-emerald-500" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-lg text-sidebar-foreground">{mockUser.name}</h3>
        <p className="text-sm text-sidebar-muted truncate max-w-[200px]">{mockUser.email}</p>
      </div>
    </div>
  );
};
