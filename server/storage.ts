import {
  users,
  transactions,
  departments,
  dailyLimits,
  coachAnalysis,
  type User,
  type UpsertUser,
  type InsertTransaction,
  type Transaction,
  type TransactionWithUsers,
  type Department,
  type InsertDepartment,
  type DailyLimit,
  type UserWithStats,
  type CoachAnalysis,
  type InsertCoachAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, sum } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // K-Point specific operations
  getAllUsers(): Promise<User[]>;
  getUsersWithStats(): Promise<UserWithStats[]>;
  updateUserBalance(userId: string, newBalance: number): Promise<void>;
  updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionHistory(limit?: number, offset?: number): Promise<TransactionWithUsers[]>;
  getUserTransactions(userId: string): Promise<TransactionWithUsers[]>;
  getRecentTransactions(limit: number): Promise<TransactionWithUsers[]>;
  
  // Daily limits
  getDailyLimit(userId: string, date: string): Promise<DailyLimit | undefined>;
  updateDailyLimit(userId: string, date: string): Promise<void>;
  
  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartmentByName(name: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  getDepartmentRankings(): Promise<Array<{ name: string; totalPoints: number; memberCount: number }>>;
  
  // Admin operations
  getTotalCirculation(): Promise<number>;
  setSystemCirculation(amount: number, updatedBy: string): Promise<void>;
  getSystemStats(): Promise<{
    totalUsers: number;
    todayTransactions: number;
    activeDepartments: number;
    totalCirculation: number;
  }>;
  
  // Bulk operations
  bulkUpsertUsers(users: UpsertUser[]): Promise<void>;
  resetQuarterlyPoints(): Promise<void>;
  
  // Superadmin operations for negative points
  setSuperadminBalance(userId: string, balance: number, updatedBy: string): Promise<void>;
  
  // Coach analysis operations
  saveCoachAnalysis(analysis: InsertCoachAnalysis): Promise<CoachAnalysis>;
  getCoachAnalysis(date: string, analysisType: string): Promise<CoachAnalysis | undefined>;
  getTodaysCoachAnalysis(analysisType: string): Promise<CoachAnalysis | undefined>;
  updateCoachAnalysis(id: number, updates: Partial<InsertCoachAnalysis>): Promise<CoachAnalysis>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, username));
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // K-Point specific operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async getUsersWithStats(): Promise<UserWithStats[]> {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const usersData = await db.select().from(users).where(eq(users.isActive, true));
    
    const result: UserWithStats[] = [];
    
    for (const user of usersData) {
      // Get daily sent count
      const [dailyLimit] = await db
        .select()
        .from(dailyLimits)
        .where(and(eq(dailyLimits.userId, user.id), eq(dailyLimits.date, today)));
      
      // Get monthly received points
      const [monthlyReceived] = await db
        .select({ total: sum(transactions.points) })
        .from(transactions)
        .where(and(
          eq(transactions.receiverId, user.id),
          gte(transactions.createdAt, startOfMonth)
        ));
      
      result.push({
        ...user,
        dailySentCount: dailyLimit?.sendCount || 0,
        monthlyReceived: Number(monthlyReceived?.total) || 0,
      });
    }
    
    return result;
  }

  async updateUserBalance(userId: string, newBalance: number): Promise<void> {
    await db
      .update(users)
      .set({ pointBalance: newBalance, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactionHistory(limit = 50, offset = 0): Promise<TransactionWithUsers[]> {
    return await db
      .select({
        id: transactions.id,
        senderId: transactions.senderId,
        receiverId: transactions.receiverId,
        points: transactions.points,
        message: transactions.message,
        createdAt: transactions.createdAt,
        sender: users,
        receiver: {
          id: sql`receiver.id`,
          email: sql`receiver.email`,
          firstName: sql`receiver.first_name`,
          lastName: sql`receiver.last_name`,
          profileImageUrl: sql`receiver.profile_image_url`,
          department: sql`receiver.department`,
          role: sql`receiver.role`,
          pointBalance: sql`receiver.point_balance`,
          isActive: sql`receiver.is_active`,
          createdAt: sql`receiver.created_at`,
          updatedAt: sql`receiver.updated_at`,
        },
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.senderId, users.id))
      .leftJoin(
        sql`${users} as receiver`,
        sql`${transactions.receiverId} = receiver.id`
      )
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset) as TransactionWithUsers[];
  }

  async getUserTransactions(userId: string): Promise<TransactionWithUsers[]> {
    return await db
      .select({
        id: transactions.id,
        senderId: transactions.senderId,
        receiverId: transactions.receiverId,
        points: transactions.points,
        message: transactions.message,
        createdAt: transactions.createdAt,
        sender: users,
        receiver: {
          id: sql`receiver.id`,
          email: sql`receiver.email`,
          firstName: sql`receiver.first_name`,
          lastName: sql`receiver.last_name`,
          profileImageUrl: sql`receiver.profile_image_url`,
          department: sql`receiver.department`,
          role: sql`receiver.role`,
          pointBalance: sql`receiver.point_balance`,
          isActive: sql`receiver.is_active`,
          createdAt: sql`receiver.created_at`,
          updatedAt: sql`receiver.updated_at`,
        },
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.senderId, users.id))
      .leftJoin(
        sql`${users} as receiver`,
        sql`${transactions.receiverId} = receiver.id`
      )
      .where(sql`${transactions.senderId} = ${userId} OR ${transactions.receiverId} = ${userId}`)
      .orderBy(desc(transactions.createdAt)) as TransactionWithUsers[];
  }

  async getRecentTransactions(limit: number): Promise<TransactionWithUsers[]> {
    return await this.getTransactionHistory(limit, 0);
  }

  // Daily limits
  async getDailyLimit(userId: string, date: string): Promise<DailyLimit | undefined> {
    const [limit] = await db
      .select()
      .from(dailyLimits)
      .where(and(eq(dailyLimits.userId, userId), eq(dailyLimits.date, date)));
    return limit;
  }

  async updateDailyLimit(userId: string, date: string): Promise<void> {
    const existing = await this.getDailyLimit(userId, date);
    
    if (existing) {
      await db
        .update(dailyLimits)
        .set({ sendCount: existing.sendCount + 1 })
        .where(eq(dailyLimits.id, existing.id));
    } else {
      await db
        .insert(dailyLimits)
        .values({ userId, date, sendCount: 1 });
    }
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartmentByName(name: string): Promise<Department | undefined> {
    const [dept] = await db
      .select()
      .from(departments)
      .where(eq(departments.name, name));
    return dept;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDept] = await db
      .insert(departments)
      .values(department)
      .returning();
    return newDept;
  }

  async getDepartmentRankings(): Promise<Array<{ name: string; totalPoints: number; memberCount: number }>> {
    const rankings = await db
      .select({
        name: users.department,
        totalPoints: sum(users.pointBalance),
        memberCount: sql<number>`count(*)`,
      })
      .from(users)
      .where(eq(users.isActive, true))
      .groupBy(users.department)
      .orderBy(desc(sum(users.pointBalance)));
    
    return rankings.map(r => ({
      name: r.name,
      totalPoints: Number(r.totalPoints) || 0,
      memberCount: Number(r.memberCount) || 0,
    }));
  }

  // Admin operations
  async getTotalCirculation(): Promise<number> {
    const [result] = await db
      .select({ total: sum(users.pointBalance) })
      .from(users)
      .where(eq(users.isActive, true));
    
    return Number(result?.total) || 0;
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    todayTransactions: number;
    activeDepartments: number;
    totalCirculation: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));
    
    const [todayTxCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(gte(transactions.createdAt, today));
    
    const [deptCount] = await db
      .select({ count: sql<number>`count(distinct ${users.department})` })
      .from(users)
      .where(eq(users.isActive, true));
    
    const totalCirculation = await this.getTotalCirculation();
    
    return {
      totalUsers: Number(userCount?.count) || 0,
      todayTransactions: Number(todayTxCount?.count) || 0,
      activeDepartments: Number(deptCount?.count) || 0,
      totalCirculation,
    };
  }

  // Bulk operations
  async bulkUpsertUsers(usersData: UpsertUser[]): Promise<void> {
    for (const userData of usersData) {
      await this.upsertUser(userData);
    }
  }

  async resetQuarterlyPoints(): Promise<void> {
    // Reset all users to 20 points
    await db
      .update(users)
      .set({ pointBalance: 20, updatedAt: new Date() })
      .where(eq(users.isActive, true));
  }

  // Coach analysis operations
  async saveCoachAnalysis(analysisData: InsertCoachAnalysis): Promise<CoachAnalysis> {
    const [analysis] = await db
      .insert(coachAnalysis)
      .values(analysisData)
      .returning();
    return analysis;
  }

  async getCoachAnalysis(date: string, analysisType: string): Promise<CoachAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(coachAnalysis)
      .where(and(
        eq(coachAnalysis.date, date),
        eq(coachAnalysis.analysisType, analysisType)
      ))
      .orderBy(desc(coachAnalysis.createdAt))
      .limit(1);
    return analysis;
  }

  async getTodaysCoachAnalysis(analysisType: string): Promise<CoachAnalysis | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return this.getCoachAnalysis(today, analysisType);
  }

  async updateCoachAnalysis(id: number, updates: Partial<InsertCoachAnalysis>): Promise<CoachAnalysis> {
    const [analysis] = await db
      .update(coachAnalysis)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coachAnalysis.id, id))
      .returning();
    return analysis;
  }
}

export const storage = new DatabaseStorage();
