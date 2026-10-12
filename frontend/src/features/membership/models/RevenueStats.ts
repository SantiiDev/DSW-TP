// Modelo de las métricas del dashboard de administración: ventas de la membresía
// Pro y usuarios por plan.
//
// Sale de GET /api/payments/stats (solo ADMIN). Como la membresía es un pago
// único, no hay ingresos recurrentes: todo lo que se mide son ventas.
import { formatArs } from './Membership';

/** Rol de una cuenta, igual que USERS.rol del backend. */
export type UserRoleName = 'FREE' | 'PRO' | 'ADMIN';

/** Forma cruda con la que viajan las métricas en la API (snake_case). */
export type RevenueStatsApiResponse = {
  year: number;
  available_years: number[];
  revenue: {
    total_all_time: number;
    total_year: number;
    sales_year: number;
    average_ticket: number;
  };
  monthly: { month: number; revenue: number; sales: number }[];
  users: {
    total: number;
    by_role: { rol: UserRoleName; count: number }[];
    pro_paid: number;
    pro_assigned: number;
    conversion: number;
  };
  recent_sales: {
    id_transaction: number;
    amount: number;
    payment_date: string;
    username: string | null;
    plan: string | null;
  }[];
};

/** Cómo se llama cada rol en la pantalla: el valor crudo no se muestra nunca. */
export const ROLE_LABELS: Record<UserRoleName, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  ADMIN: 'Admin',
};

export type MonthlyRevenue = { month: number; revenue: number; sales: number };

export type UsersByRole = { role: UserRoleName; count: number };

/** Una venta de la lista "Últimas ventas". */
export class RecentSale {
  constructor(
    public readonly id: number,
    public readonly amount: number,
    public readonly date: Date,
    public readonly username: string | null,
    public readonly planName: string | null
  ) {}

  get amountLabel(): string {
    return formatArs(this.amount);
  }
}

export class RevenueStats {
  constructor(
    public readonly year: number,
    public readonly availableYears: number[],
    public readonly totalAllTime: number,
    public readonly totalYear: number,
    public readonly salesYear: number,
    public readonly averageTicket: number,
    public readonly monthly: MonthlyRevenue[],
    public readonly totalUsers: number,
    public readonly usersByRole: UsersByRole[],
    public readonly proPaid: number,
    public readonly proAssigned: number,
    /** Porcentaje (0 a 100) de usuarios no admin que compraron Pro. */
    public readonly conversion: number,
    public readonly recentSales: RecentSale[]
  ) {}

  /** ¿Hubo alguna venta en el año elegido? Decide si se dibuja la curva o el vacío. */
  get hasSalesThisYear(): boolean {
    return this.salesYear > 0;
  }

  /** ¿Se vendió alguna vez? Sin ninguna, "Últimas ventas" no tiene nada que listar. */
  get hasAnySale(): boolean {
    return this.recentSales.length > 0;
  }
}
