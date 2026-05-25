import { Get, Controller } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async check() {
    let dbStatus = 'connected';
    let dbError: string | null = null;
    let userCount = -1;
    let columns: any = null;
    try {
      await this.dataSource.query('SELECT 1');
      const result = await this.dataSource.query('SELECT COUNT(*) as count FROM "users"');
      userCount = parseInt(result[0]?.count || '0', 10);
      const colResult = await this.dataSource.query(
        'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
        ['users'],
      );
      columns = colResult.map((r: any) => r.column_name);
    } catch (e: any) {
      dbStatus = 'disconnected';
      dbError = e?.message || String(e);
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbStatus,
      dbError,
      userCount,
      columns,
    };
  }
}
