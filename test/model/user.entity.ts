import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany, JoinTable, UpdateDateColumn, } from 'typeorm';
import { Photos } from './photos.entity';
import { ColumnNumericTransformer } from './utils/transformer';

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

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'update_date_time',
  })
  updateDateTime: Date;

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

  @Column('numeric', {
    nullable: false,
    name: 'point',
  })
  point: number;

  @Column('numeric', {
    nullable: false,
    name: 'follower',
  })
  follower: number;

  @Column('numeric', {
    nullable: false,
    name: 'following',
  })
  following: number;

  @ManyToMany(() => Photos, { cascade: true })
  @JoinTable()
  photos?: Photos[];
}
