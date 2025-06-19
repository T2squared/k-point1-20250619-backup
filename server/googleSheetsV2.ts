import { google } from 'googleapis';

interface GoogleSheetsConfig {
  serviceAccountEmail: string;
  privateKey: string;
  sheetId: string;
}

class GoogleSheetsServiceV2 {
  private auth: any;
  private sheets: any;
  private config: GoogleSheetsConfig;

  constructor() {
    this.config = {
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      privateKey: process.env.GOOGLE_PRIVATE_KEY!,
      sheetId: process.env.GOOGLE_SHEET_ID!,
    };

    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      // Clean and format the private key properly
      let privateKey = this.config.privateKey;
      
      // Remove any quotes and escape sequences
      privateKey = privateKey.replace(/^"|"$/g, '');
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // Ensure proper formatting
      if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Invalid private key format');
      }

      this.auth = new google.auth.JWT(
        this.config.serviceAccountEmail,
        undefined,
        privateKey,
        ['https://www.googleapis.com/auth/spreadsheets']
      );

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      console.log('Google Sheets V2 authentication initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Sheets V2 authentication:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.sheetId,
      });
      console.log('Google Sheets V2 connection test successful');
      return true;
    } catch (error) {
      console.error('Google Sheets V2 connection test failed:', error);
      return false;
    }
  }

  async exportTransactionHistory(transactions: any[]): Promise<void> {
    try {
      console.log('Starting Google Sheets V2 transaction export...');
      
      const headers = [
        '送信者ID',
        '送信者名',
        '送信者部署',
        '受信者ID',
        '受信者名',
        '受信者部署',
        'ポイント数',
        'メッセージ',
        '送信日時'
      ];

      const rows = transactions.map(tx => [
        tx.sender.id,
        `${tx.sender.lastName} ${tx.sender.firstName}`,
        tx.sender.department || '',
        tx.receiver.id,
        `${tx.receiver.lastName} ${tx.receiver.firstName}`,
        tx.receiver.department || '',
        tx.points,
        tx.message || '',
        new Date(tx.createdAt).toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      ]);

      const values = [headers, ...rows];

      // Clear existing data first
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.sheetId,
        range: '送付履歴!A:I',
      });

      // Insert new data
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.sheetId,
        range: '送付履歴!A1',
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      console.log(`Google Sheets V2: Exported ${transactions.length} transactions successfully`);
    } catch (error) {
      console.error('Google Sheets V2 transaction export failed:', error);
      throw error;
    }
  }

  async exportUserBalances(users: any[]): Promise<void> {
    try {
      console.log('Starting Google Sheets V2 user balances export...');
      
      const headers = [
        'ユーザーID',
        '氏名',
        '部署',
        '現在の残高',
        '今月受信ポイント',
        '今日送信数',
        '最終更新日'
      ];

      const rows = users.map(user => [
        user.id,
        `${user.lastName} ${user.firstName}`,
        user.department || '',
        user.pointBalance,
        user.monthlyReceived || 0,
        user.dailySentCount || 0,
        new Date(user.updatedAt || user.createdAt).toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      ]);

      const values = [headers, ...rows];

      // Clear existing data first
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.sheetId,
        range: '残高一覧!A:G',
      });

      // Insert new data
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.sheetId,
        range: '残高一覧!A1',
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      console.log(`Google Sheets V2: Exported ${users.length} user balances successfully`);
    } catch (error) {
      console.error('Google Sheets V2 user balances export failed:', error);
      throw error;
    }
  }

  async createWorksheets(): Promise<void> {
    try {
      console.log('Creating/updating Google Sheets V2 worksheets...');
      
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.sheetId,
      });

      const existingSheets = spreadsheet.data.sheets.map((sheet: any) => sheet.properties.title);
      
      const requiredSheets = ['送付履歴', '残高一覧'];
      
      for (const sheetName of requiredSheets) {
        if (!existingSheets.includes(sheetName)) {
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.config.sheetId,
            requestBody: {
              requests: [{
                addSheet: {
                  properties: {
                    title: sheetName,
                  }
                }
              }]
            }
          });
          console.log(`Created worksheet: ${sheetName}`);
        }
      }
    } catch (error) {
      console.error('Failed to create Google Sheets V2 worksheets:', error);
      throw error;
    }
  }

  async setupSpreadsheet(): Promise<void> {
    try {
      // Test connection first
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to Google Sheets');
      }

      // Create required worksheets
      await this.createWorksheets();
      
      console.log('Google Sheets V2 setup completed successfully');
    } catch (error) {
      console.error('Google Sheets V2 setup failed:', error);
      throw error;
    }
  }
}

export const googleSheetsServiceV2 = new GoogleSheetsServiceV2();