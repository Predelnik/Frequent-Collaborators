declare let api_key: string;
declare let base_uri: string;
declare function report_error(error_str: string): void;
declare function sleep(ms: any): Promise<{}>;
declare function execute(request_url: string, args: any, additional_data?: any, retry_count?: number): Promise<{}>;
declare class ActorDescription {
    id: number;
    name: string;
    constructor(id: number, name: string);
}
declare class MovieDescription {
    id: number;
    name: string;
    release_date: Date;
    constructor(id: number, name: string, release_date: Date);
}
interface IdObjectDescription {
    id: number;
}
declare class IdObjectSet<T extends IdObjectDescription> {
    id_set: Set<number>;
    descriptions: T[];
    add(description: T): void;
}
declare class MovieSet extends IdObjectSet<MovieDescription> {
}
declare class ActorSet extends IdObjectSet<ActorDescription> {
}
declare function check_director(): void;
