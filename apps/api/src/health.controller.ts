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
        'SELECT column_name, data_type, table_schema FROM information_schema.columns WHERE table_name = $1 ORDER BY table_schema, ordinal_position',
        ['users'],
      );
      const migrationsResult = await this.dataSource.query(
        'SELECT name FROM "migrations" ORDER BY name'
      );
      columns = {
        users: colResult.map((r: any) => `${r.table_schema}.${r.column_name}`),
        migrations: migrationsResult.map((r: any) => r.name),
      };
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
