declare let api_key: string;
declare let base_uri: string;
declare function report_error(error_str: string): void;
declare function sleep(ms: any): Promise<{}>;
declare function execute(request_url: string, args: any, retry_count?: number): Promise<{}>;
declare class ActorDescription {
    id: number;
    name: string;
    constructor(id: number, name: string);
}
declare function check_director(): void;
