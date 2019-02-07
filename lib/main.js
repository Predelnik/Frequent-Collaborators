let api_key = "7a92a35fa5474d448234162762968104";
let base_uri = "https://api.themoviedb.org/3/";
function report_error(error_str) {
    document.getElementById('output_table').innerHTML = 'Error:' + error_str;
}
function execute(request_url, args) {
    return new Promise((resolve, reject) => {
        var request = new XMLHttpRequest();
        request.open('GET', base_uri + request_url + '?api_key=' + api_key + (Object.keys(args).length === 0 ? '' : '&') +
            Object.keys(args).map(function (k) {
                return encodeURIComponent(k) + "=" + encodeURIComponent(args[k]);
            }).join('&'), true);
        request.onload = function () {
            var data = JSON.parse(this.response);
            if (request.status >= 200 && request.status < 400) {
                resolve(data);
            }
            else {
                reject(data);
            }
        };
        request.send();
    });
}
function check_director() {
    let director_name_input = document.getElementById('director_name_input').value;
    execute("search/person", { "query": director_name_input })
        .then((response) => {
        let director_id = response.results[0].id;
        console.log(response.results[0].name);
        return execute('person/' + director_id + '/movie_credits', {});
    });
}
//# sourceMappingURL=main.js.map