import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, } from 'typeorm';

@Entity('ptc_photos')
export class Photos extends BaseEntity {
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
    name: 'filename',
  })
  fileName: string;

  @Column('character varying', {
    nullable: false,
    length: 255,
    name: 'url',
  })
  url: string;
}
