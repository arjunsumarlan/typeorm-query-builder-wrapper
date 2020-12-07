import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, JoinColumn, } from 'typeorm';
import { User } from './user.entity';

@Entity('ptc_branch')
export class Branch extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  userId: string;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'create_date_time',
  })
  createDateTime: Date;

  @Column('character varying', {
    nullable: false,
    length: 255,
    name: 'branch_name',
  })
  branchName: string;

  @Column('numeric', {
    nullable: false,
    name: 'branch_code',
  })
  branchCode: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}
