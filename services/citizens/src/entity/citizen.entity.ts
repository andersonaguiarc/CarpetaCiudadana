import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Citizen {
    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({
        unique: true
    })
    email: string;
}
