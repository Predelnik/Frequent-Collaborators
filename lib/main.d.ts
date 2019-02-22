declare const api_key = "7a92a35fa5474d448234162762968104";
declare const base_uri = "https://api.themoviedb.org/3/";
declare function report_error(error_str: string): void;
declare function sleep(ms: number): Promise<{}>;
declare class ApiLimitReached extends Error {
}
declare function execute(request_url: string, args: any, additional_data?: any, retry_count?: number): any;
declare class ActorDescription {
    readonly id: number;
    readonly name: string;
    constructor(id: number, name: string);
}
declare class MovieDescription {
    readonly id: number;
    readonly name: string;
    readonly release_date: Date;
    constructor(id: number, name: string, release_date: Date);
}
interface IdObjectDescription {
    id: number;
}
declare class IdObjectSet<T extends IdObjectDescription> {
    id_set: Set<number>;
    descriptions: T[];
    add(description: T): void;
    size(): number;
}
declare class MovieSet extends IdObjectSet<MovieDescription> {
}
declare class ActorSet extends IdObjectSet<ActorDescription> {
}
declare function check_director(): void;
