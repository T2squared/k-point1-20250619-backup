import {
  users,
  transactions,
  departments,
  dailyLimits,
  coachAnalysis,
  systemConfig,
  departmentAdjustments,
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
  type DepartmentAdjustment,
  type InsertDepartmentAdjustment,
} from "@shared/schema";
import { db } from "./db";
import { eq, ne, and, desc, sql, gte, lte, sum, count, isNotNull } from "drizzle-orm";

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
  
  // Superadmin operations for user management
  updateUserName(userId: string, firstName: string, lastName: string, updatedBy: string): Promise<User>;
  
  // Department adjustment operations (superadmin only)
  adjustDepartmentPoints(department: string, adjustmentAmount: number, reason: string, adjustedBy: string): Promise<void>;
  getDepartmentAdjustments(department?: string): Promise<DepartmentAdjustment[]>;
  
  // Team distribution operations (admin/superadmin only)
  distributePointsToTeam(department: string, totalPoints: number, reason: string, distributedBy: string): Promise<void>;
  
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
      .where(and(
        eq(users.isActive, true),
        ne(users.role, 'superadmin'), // SuperAdminを除外
        isNotNull(users.department),
        ne(users.department, ''),
        ne(users.department, 'SuperAdmin') // SuperAdmin部門を除外
      ))
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
    try {
      // システム設定から目標流通量を取得
      const [targetConfig] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, 'total_circulation_target'))
        .limit(1);
      
      if (targetConfig) {
        const targetCirculation = Number(targetConfig.value) || 0;
        console.log("Target circulation from config:", targetCirculation);
        return targetCirculation;
      }
      
      // 設定がない場合は実際の残高の合計を返す（SuperAdminを除外）
      const [result] = await db
        .select({ total: sum(users.pointBalance) })
        .from(users)
        .where(and(
          eq(users.isActive, true),
          ne(users.role, 'superadmin') // SuperAdminを流通量から除外
        ));
      
      const actualCirculation = Number(result?.total) || 0;
      console.log("Actual circulation from balances:", actualCirculation);
      return actualCirculation;
    } catch (error) {
      console.error("Error in getTotalCirculation:", error);
      // エラーの場合は実際の残高の合計を返す
      const [result] = await db
        .select({ total: sum(users.pointBalance) })
        .from(users)
        .where(eq(users.isActive, true));
      
      return Number(result?.total) || 0;
    }
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
    
    // アクティブ部署からSuperAdminと空文字列を除外
    const [deptCount] = await db
      .select({ count: sql<number>`count(distinct ${users.department})` })
      .from(users)
      .where(and(
        eq(users.isActive, true),
        ne(users.department, ''),
        ne(users.department, 'SuperAdmin'),
        ne(users.department, '未設定')
      ));
    
    console.log('Active departments debug - count:', deptCount?.count);
    
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
  
  async setSystemCirculation(amount: number, updatedBy: string): Promise<void> {
    try {
      console.log(`Setting system circulation to ${amount} by ${updatedBy}`);
      
      if (amount < 0) {
        throw new Error("Circulation amount cannot be negative");
      }
      
      // システム設定をデータベースに保存
      try {
        await db.insert(systemConfig).values({
          key: 'total_circulation_target',
          value: amount.toString(),
          updatedBy: updatedBy,
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: systemConfig.key,
          set: { 
            value: amount.toString(), 
            updatedBy: updatedBy, 
            updatedAt: new Date() 
          }
        });
        console.log("Database insert/update successful");
      } catch (dbError) {
        console.error("Database operation failed:", dbError);
        throw new Error(`Failed to save circulation setting: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
      }
      
      console.log(`System circulation successfully set to ${amount} by ${updatedBy} - saved to database`);
    } catch (error) {
      console.error("Error in setSystemCirculation:", error);
      throw error;
    }
  }

  async setSuperadminBalance(userId: string, balance: number, updatedBy: string): Promise<void> {
    await db.update(users)
      .set({ pointBalance: balance })
      .where(eq(users.id, userId));
    
    console.log(`Balance for user ${userId} set to ${balance} by superadmin ${updatedBy}`);
  }

  async updateUserName(userId: string, firstName: string, lastName: string, updatedBy: string): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ 
        firstName: firstName,
        lastName: lastName,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    console.log(`User name for ${userId} updated to ${firstName} ${lastName} by superadmin ${updatedBy}`);
    return updatedUser;
  }

  // Department adjustment operations (superadmin only)
  async adjustDepartmentPoints(department: string, adjustmentAmount: number, reason: string, adjustedBy: string): Promise<void> {
    console.log(`Starting department adjustment: ${adjustmentAmount} points for ${department} by ${adjustedBy}`);

    // Record the adjustment only - no actual distribution to users
    await db.insert(departmentAdjustments).values({
      department,
      adjustmentAmount,
      reason,
      adjustedBy,
      createdAt: new Date()
    });

    console.log(`Department adjustment recorded: ${adjustmentAmount} points adjustment for ${department}`);
  }

  async getDepartmentAdjustments(department?: string): Promise<DepartmentAdjustment[]> {
    const query = db
      .select()
      .from(departmentAdjustments)
      .orderBy(desc(departmentAdjustments.createdAt));

    if (department) {
      return await query.where(eq(departmentAdjustments.department, department));
    }
    
    return await query;
  }

  async distributePointsToTeam(department: string, totalPoints: number, reason: string, distributedBy: string): Promise<void> {
    console.log(`Starting team distribution: ${totalPoints} points to ${department} by ${distributedBy}`);

    // Get all active users in the department (excluding superadmin)
    const departmentUsers = await db
      .select()
      .from(users)
      .where(and(
        eq(users.department, department),
        eq(users.isActive, true),
        ne(users.role, 'superadmin')
      ));

    if (departmentUsers.length === 0) {
      throw new Error(`No active users found in department: ${department}`);
    }

    // Calculate points per user (distribute evenly)
    const pointsPerUser = Math.floor(totalPoints / departmentUsers.length);
    const remainder = totalPoints % departmentUsers.length;

    console.log(`Distributing ${pointsPerUser} points to each of ${departmentUsers.length} users, remainder: ${remainder}`);

    // Update each user's balance and create transactions
    for (let i = 0; i < departmentUsers.length; i++) {
      const user = departmentUsers[i];
      const extraPoint = i < remainder ? 1 : 0; // Distribute remainder to first few users
      const distributionAmount = pointsPerUser + extraPoint;
      const newBalance = user.pointBalance + distributionAmount;

      // Update user balance
      await db
        .update(users)
        .set({ 
          pointBalance: newBalance,
          updatedAt: new Date() 
        })
        .where(eq(users.id, user.id));

      // Create transaction record
      await db.insert(transactions).values({
        senderId: distributedBy,
        receiverId: user.id,
        points: distributionAmount,
        message: reason,
        createdAt: new Date()
      });

      console.log(`Distributed ${distributionAmount} points to user ${user.id}, new balance: ${newBalance}`);
    }

    console.log(`Team distribution completed: ${totalPoints} points distributed to ${department}`);
  }
}

export const storage = new DatabaseStorage();
