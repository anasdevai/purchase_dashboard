export type RepairCategory =
  | 'Display'
  | 'Battery'
  | 'WaterDamage'
  | 'Software'
  | 'LogicBoard'
  | 'Camera'
  | 'ChargingPort'
  | 'Keyboard'
  | 'Other';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Difficult' | 'Expert';

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceType {
  id: string;
  name: string;
  brandId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brand?: {
    id: string;
    name: string;
  };
}

export interface Model {
  id: string;
  name: string;
  deviceTypeId: string;
  brandId: string;
  generation?: string | null;
  storageOptions: string[];
  colorOptions: string[];
  releaseYear?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brand?: {
    id: string;
    name: string;
  };
  deviceType?: {
    id: string;
    name: string;
  };
}

export interface RepairType {
  id: string;
  name: string;
  category: RepairCategory;
  standardPrice?: number | null;
  duration?: number | null;
  difficulty?: DifficultyLevel | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceList {
  id: string;
  modelId: string;
  repairTypeId: string;
  price: number;
  duration?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  model?: {
    id: string;
    name: string;
    brand: {
      id: string;
      name: string;
    };
    deviceType: {
      id: string;
      name: string;
    };
  };
  repairType?: {
    id: string;
    name: string;
    category: RepairCategory;
  };
}
