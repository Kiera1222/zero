export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  image?: string;
  condition: string;
  latitude: number;
  longitude: number;
  userId: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
} 