export interface User {
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
}

export const mockUser: User = {
  name: 'Pauline Myers',
  email: 'pauline.myers@example.com',
  avatar: '/images/avatars/female-1.png',
  status: 'online',
};
