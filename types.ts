
export type Product = {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  weight: number;
  description: string;
  tags: string[];
  images: string[];
  thumbnails: string[]; 
  supplier?: string;
  uploadedBy?: string;
  isHidden: boolean;
  privateNotes?: string;
  createdAt: string;
  dateTaken?: string;
  meta: {
    cameraModel?: string;
    deviceManufacturer?: string;
    location?: string;
    soldTo?: string; // ID of the buyer
    soldDate?: string;
    orderId?: string;
  };
};

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type UserRole = 'customer' | 'contributor' | 'admin';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  location?: string; // This can serve as pincode/city
  pincode?: string;
  address?: string; // Full address editable by admin
  lastLogin?: string;
  createdAt?: string;
  isVerified?: boolean;       // B2B Approval Status
  accessExpiresAt?: string;   // Date when catalog access is revoked
};

export interface StaffAccount {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'contributor';
  isActive: boolean;
  name: string;
  createdAt: string;
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export interface GeneratedDesign {
  id: string;
  imageUrl: string;
  prompt: string;
  aspectRatio: AspectRatio;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  isPrivate: boolean;
}

export interface CategoryConfig {
  id: string;
  name: string;
  subCategories: string[];
  isPrivate: boolean;
}

export interface AppConfig {
  suppliers: Supplier[];
  categories: CategoryConfig[];
  linkExpiryHours: number;
  whatsappNumber?: string;
  whatsappPhoneId?: string;
  whatsappToken?: string;
}

export interface AnalyticsEvent {
  id: string;
  type: 'inquiry' | 'screenshot' | 'view' | 'like' | 'dislike' | 'download' | 'login' | 'sold' | 'long_press' | 'b2b_order';
  productId?: string;
  productTitle?: string;
  category?: string;
  weight?: number;
  userId: string;
  userName: string;
  userPhone?: string;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    pincode?: string;
  };
  deviceName: string;
  timestamp: string;
  imageIndex?: number;
  duration?: number; // Time spent in seconds
  meta?: any; // Detailed device stats or Order Details
}

export interface ProductSuggestion {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhone: string;
  suggestion: string;
  createdAt: string;
}

export interface SharedLink {
  id: string;
  targetId: string;
  type: 'product' | 'category';
  token: string;
  expiresAt: string;
}

export interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'analyzing' | 'saving' | 'complete' | 'error';
  supplier: string;
  category: string;
  subCategory: string;
  weight: number;
  device: string;
  manufacturer?: string;
  productTitle?: string;
  error?: string;
}

// --- ORDER MANAGEMENT TYPES ---

export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'cancelled';

export type DeliveryMode = 'hand_to_hand' | 'vpp' | 'logistics';

export interface DeliveryDetails {
  mode: DeliveryMode;
  courierName?: string;
  trackingNumber?: string;
  dispatchedBy?: string; // Staff name
  dispatchedAt?: string;
  notes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[]; // Snapshot of items at time of order
  totalItems: number;
  totalWeight: number;
  status: OrderStatus;
  deliveryDetails?: DeliveryDetails;
  createdAt: string;
  updatedAt: string;
}
