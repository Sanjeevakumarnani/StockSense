export type User = {
  id: number;
  name: string;
  email: string;
  role: 'manager' | 'staff';
};

export type DashboardKpis = {
  total_products_in_stock: number;
  low_stock_items: number;
  pending_receipts: number;
  pending_deliveries: number;
  scheduled_transfers: number;
};

export type DailyChartItem = {
  date: string;
  stock_in: number;
  stock_out: number;
  net_change: number;
};

export type TopProductItem = {
  name: string;
  volume: number;
};

export type Movement = {
  id: number;
  product_id: number;
  product_name: string;
  operation_type: string;
  reference_type: string;
  reference_id: number;
  quantity: number;
  created_at: string;
};

export type DashboardData = {
  kpis: DashboardKpis;
  chart_data: DailyChartItem[];
  top_products: TopProductItem[];
  summary: {
    net_units_this_period: number;
  };
  recent_movements: Movement[];
};

export type ReceiptItem = {
  id?: number;
  product_id: number;
  product_name?: string;
  expected_quantity: number;
  received_quantity: number;
};

export type Receipt = {
  id: number;
  supplier_id: number | null;
  supplier_name?: string;
  destination_location_id: number;
  destination_location_name?: string;
  status: 'draft' | 'done' | 'canceled';
  created_by: number;
  created_at: string;
  validated_at: string | null;
  items: ReceiptItem[];
};

export type DeliveryItem = {
  id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
};

export type Delivery = {
  id: number;
  source_location_id: number;
  source_location_name?: string;
  status: 'draft' | 'done' | 'canceled';
  created_by: number;
  created_at: string;
  validated_at: string | null;
  items: DeliveryItem[];
};

export type TransferItem = {
  id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
};

export type Transfer = {
  id: number;
  source_location_id: number;
  source_location_name?: string;
  destination_location_id: number;
  destination_location_name?: string;
  status: 'draft' | 'done' | 'canceled';
  created_by: number;
  created_at: string;
  validated_at: string | null;
  items: TransferItem[];
};

export type StockAdjustment = {
  id: number;
  product_id: number;
  product_name?: string;
  location_id: number;
  location_name?: string;
  created_by: number;
  recorded_quantity: number;
  physical_quantity: number;
  difference: number;
  reason: string;
  created_at: string;
};

export type LedgerEntry = {
  id: number;
  product_id: number;
  product_name: string;
  source_location_name?: string;
  destination_location_name?: string;
  reference_type: string;
  reference_id: number;
  operation_type: string;
  quantity: number;
  previous_stock: number;
  updated_stock: number;
  created_at: string;
};
