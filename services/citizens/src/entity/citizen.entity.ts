import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { USER_STATUS } from "./status.enum";

@Entity()
export class Citizen {
    @PrimaryColumn({
        type: 'bigint'
        , unique: true
    })
    id: number;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({
        unique: true
    })
    email: string;

    @Column({
        default: USER_STATUS.created
    })
    status: string;
}
