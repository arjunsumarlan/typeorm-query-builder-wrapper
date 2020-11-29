import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, } from 'typeorm';

@Entity('ptc_users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'create_date_time',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createDateTime: Date;

  @Column({ type: 'uuid', name: 'create_user_id' })
  createUserId: string;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'update_date_time',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateDateTime: Date;

  @Column({ type: 'uuid', name: 'update_user_id' })
  updateUserId: string;

  @Column('character varying', {
    nullable: false,
    length: 255,
    name: 'name',
  })
  name: string;

  @Column('character varying', {
    nullable: false,
    length: 255,
    name: 'username',
  })
  username: string;

  @Column('character varying', {
    nullable: false,
    length: 500,
    name: 'password',
    select: false,
  })
  password: string;

  @Column('character varying', {
    nullable: true,
    length: 255,
    name: 'email',
  })
  email: string | null;
}
