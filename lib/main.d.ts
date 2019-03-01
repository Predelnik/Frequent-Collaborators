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
    remove(id: number): void;
}
declare class MovieSet extends IdObjectSet<MovieDescription> {
}
declare class ActorSet extends IdObjectSet<ActorDescription> {
}
declare var current_movie_set: MovieSet;
declare var current_actor_set: ActorSet;
declare var raw_results: Array<any>;
declare function clear_table(): void;
declare function update_clipboard(new_data: string): void;
declare function generate_cast_id_to_movie_description(): {
    [key: number]: MovieSet;
};
declare function sort_actor_set(cast_id_to_movie_descriptions: {
    [key: number]: MovieSet;
}): void;
declare function copy_to_clipboard_as_html(): void;
declare function copy_to_clipboard_as_tsv(): void;
declare function rebuild_table(): void;
declare function remove_movie(id: number): void;
declare function check_director(): void;
