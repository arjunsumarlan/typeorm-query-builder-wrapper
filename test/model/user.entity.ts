import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany, JoinTable, } from 'typeorm';
import { Photos } from './photos.entity';

@Entity('ptc_users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'create_date_time',
  })
  createDateTime: Date;

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

  @ManyToMany(() => Photos, { cascade: true })
  @JoinTable()
  photos?: Photos[];
}
