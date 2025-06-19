import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Handle bcrypt format (starts with $2a$ or $2b$)
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
    return await bcrypt.compare(supplied, stored);
  }
  
  // Handle scrypt format (contains a dot)
  if (stored.includes('.')) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }
  
  // Fallback: try direct comparison for simple passwords
  return supplied === stored;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'default-session-secret-for-dev',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // HTTP接続でも動作するようにfalseに設定
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username', // IDフィールド
        passwordField: 'password'
      },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user) {
            return done(null, false, { message: 'ユーザーが見つかりません' });
          }
          
          if (!user.password) {
            return done(null, false, { message: 'パスワードが設定されていません' });
          }

          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: 'パスワードが正しくありません' });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // ログイン
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "サーバーエラーが発生しました" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "ログインに失敗しました" });
        }
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          role: user.role,
          pointBalance: user.pointBalance,
          isActive: user.isActive
        });
      });
    })(req, res, next);
  });

  // ログアウト
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((sessionErr) => {
        if (sessionErr) return next(sessionErr);
        res.clearCookie('connect.sid');
        res.json({ message: "ログアウトしました" });
      });
    });
  });

  // GET版のログアウト（直接アクセス用）
  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((sessionErr) => {
        if (sessionErr) return next(sessionErr);
        res.clearCookie('connect.sid');
        res.redirect('/');
      });
    });
  });

  // 現在のユーザー情報取得
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      department: req.user.department,
      role: req.user.role,
      pointBalance: req.user.pointBalance,
      isActive: req.user.isActive
    });
  });

  // パスワード変更
  app.put("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "現在のパスワードと新しいパスワードが必要です" });
    }

    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !user.password) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      const isValidPassword = await comparePasswords(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "現在のパスワードが正しくありません" });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedNewPassword);

      res.json({ message: "パスワードを変更しました" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "パスワード変更に失敗しました" });
    }
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export { hashPassword };