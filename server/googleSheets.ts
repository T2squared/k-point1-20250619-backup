import { google } from 'googleapis';
import { storage } from './storage';

interface GoogleSheetsConfig {
  serviceAccountEmail: string;
  privateKey: string;
  sheetId: string;
}

class GoogleSheetsService {
  private auth: any;
  private sheets: any;
  private config: GoogleSheetsConfig;

  constructor() {
    this.config = {
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      //privateKey: (process.env.GOOGLE_PRIVATE_KEY_PKCS1 || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      sheetId: process.env.GOOGLE_SHEET_ID || '',
    };

    if (!this.config.serviceAccountEmail || !this.config.privateKey || !this.config.sheetId) {
      console.warn('Google Sheets integration not configured. Please set environment variables.');
      return;
    }

    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      console.log('Initializing Google Sheets auth...');
      console.log('Service Account Email:', this.config.serviceAccountEmail);
      console.log('Private Key Length:', this.config.privateKey.length);
      console.log('Private Key Start:', this.config.privateKey.substring(0, 50));
      console.log('Sheet ID:', this.config.sheetId);
      
      // Test if the private key is properly formatted
      if (!this.config.privateKey.includes('BEGIN') || !this.config.privateKey.includes('END')) {
        console.error('Private key appears to be malformed - missing BEGIN/END markers');
        return;
      }
      
      this.auth = new google.auth.JWT(
        this.config.serviceAccountEmail,
        undefined,
        this.config.privateKey,
        ['https://www.googleapis.com/auth/spreadsheets']
      );

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('Google Sheets auth initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Sheets auth:', error);
    }
  }

  async exportTransactionHistory(): Promise<void> {
    if (!this.sheets) {
      throw new Error('Google Sheets not configured');
    }

    try {
      console.log('Starting transaction history export...');
      const transactions = await storage.getTransactionHistory(1000, 0);
      console.log(`Retrieved ${transactions.length} transactions`);
      
      const headers = [
        '送信者ID',
        '送信者名',
        '送信者部署',
        '受信者ID', 
        '受信者名',
        '受信者部署',
        'ポイント数',
        'メッセージ',
        'タイムスタンプ'
      ];

      const rows = transactions.map(tx => [
        tx.sender.id,
        `${tx.sender.lastName} ${tx.sender.firstName}`,
        tx.sender.department,
        tx.receiver.id,
        `${tx.receiver.lastName} ${tx.receiver.firstName}`,
        tx.receiver.department,
        tx.points,
        tx.message || '',
        tx.createdAt?.toISOString() || ''
      ]);

      const values = [headers, ...rows];
      console.log('Prepared data for export, attempting to write to Google Sheets...');

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.sheetId,
        range: '送付履歴!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values,
        },
      });

      console.log('Transaction history exported to Google Sheets');
    } catch (error) {
      console.error('Failed to export transaction history:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async exportUserBalances(): Promise<void> {
    if (!this.sheets) {
      throw new Error('Google Sheets not configured');
    }

    try {
      console.log('Starting user balances export...');
      console.log('Testing JWT authentication...');
      
      // Test authentication first
      await this.auth.authorize();
      console.log('JWT authentication successful');
      
      const users = await storage.getUsersWithStats();
      console.log(`Retrieved ${users.length} users`);
      
      const headers = [
        'ユーザーID',
        '氏名',
        '部署',
        '残高',
        '今月受信ポイント',
        '最終更新日'
      ];

      const rows = users.map(user => [
        user.id,
        `${user.lastName} ${user.firstName}`,
        user.department,
        user.pointBalance,
        user.monthlyReceived,
        user.updatedAt?.toISOString() || ''
      ]);

      const values = [headers, ...rows];
      console.log('Prepared user data for export, attempting to write to Google Sheets...');

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.sheetId,
        range: '残高一覧!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values,
        },
      });

      console.log('User balances exported to Google Sheets');
    } catch (error) {
      console.error('Failed to export user balances:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async importUsers(): Promise<{ imported: number; updated: number }> {
    if (!this.sheets) {
      throw new Error('Google Sheets not configured');
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.sheetId,
        range: 'ユーザー一括インポート!A2:F1000', // Skip header row
      });

      const rows = response.data.values || [];
      let imported = 0;
      let updated = 0;

      for (const row of rows) {
        if (row.length < 5) continue; // Skip incomplete rows

        const [userId, firstName, lastName, department, initialBalance, role] = row;
        
        if (!userId || !firstName || !lastName) continue;

        // Check if department exists, create if not
        let dept = await storage.getDepartmentByName(department);
        if (!dept) {
          dept = await storage.createDepartment({ name: department });
        }

        // Check if user exists
        const existingUser = await storage.getUser(userId);
        const isUpdate = !!existingUser;

        // Calculate balance based on remaining circulation
        const totalCirculation = await storage.getTotalCirculation();
        const remainingCirculation = 1000 - totalCirculation;
        const balance = isUpdate 
          ? existingUser.pointBalance
          : Math.min(Number(initialBalance) || 20, remainingCirculation);

        await storage.upsertUser({
          id: userId,
          firstName,
          lastName,
          department,
          pointBalance: balance,
          role: role || 'user',
          email: `${userId}@company.com`, // Placeholder email
          isActive: true,
          updatedAt: new Date(),
        });

        if (isUpdate) {
          updated++;
        } else {
          imported++;
        }
      }

      return { imported, updated };
    } catch (error) {
      console.error('Failed to import users:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
