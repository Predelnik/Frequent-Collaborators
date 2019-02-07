declare let api_key: string;
declare let base_uri: string;
declare function report_error(error_str: string): void;
declare function execute(request_url: string, args: any): Promise<{}>;
declare function check_director(): void;
