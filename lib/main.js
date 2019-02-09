let api_key = "7a92a35fa5474d448234162762968104";
let base_uri = "https://api.themoviedb.org/3/";
function report_error(error_str) {
    document.getElementById('output_table').innerHTML = 'Error:' + error_str;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function execute(request_url, args, retry_count = 3) {
    return new Promise((resolve, reject) => {
        var request = new XMLHttpRequest();
        request.open('GET', base_uri + request_url + '?api_key=' + api_key + (Object.keys(args).length === 0 ? '' : '&') +
            Object.keys(args).map(k => {
                return encodeURIComponent(k) + "=" + encodeURIComponent(args[k]);
            }).join('&'), true);
        request.onload = function () {
            if (request.status == 429 && retry_count > 0) {
                return sleep(20000).then(() => execute(request_url, args, retry_count - 1));
            }
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
class ActorDescription {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}
function check_director() {
    let director_name_input = document.getElementById('director_name_input').value;
    execute("search/person", { "query": director_name_input })
        .then((response) => {
        let director_id = response.results[0].id;
        console.log('Found director name: ' + response.results[0].name);
        return execute('person/' + director_id + '/movie_credits', {});
    })
        .then((response) => {
        let id_set = new Set();
        for (let d of response.crew)
            id_set.add(d.id);
        return Promise.all([...id_set].map(movie_id => execute('movie/' + movie_id + '/credits', { "id": movie_id })));
    }).then((result_array) => {
        let cast_id_to_movie_ids = {};
        let descriptions = [];
        for (let result of result_array) {
            for (let cast_data of result["cast"]) {
                let cast_id = cast_data["id"];
                if (cast_id in cast_id_to_movie_ids)
                    cast_id_to_movie_ids[cast_id].add(result["id"]);
                else {
                    descriptions.push(new ActorDescription(cast_id, cast_data["name"]));
                    cast_id_to_movie_ids[cast_id] = new Set([result["id"]]);
                }
            }
        }
        descriptions.sort((desc_lhs, desc_rhs) => cast_id_to_movie_ids[desc_rhs.id].size - cast_id_to_movie_ids[desc_lhs.id].size);
        for (let i = 0; i < Math.min(10, descriptions.length); ++i) {
            console.log(descriptions[i].name + ' - ' + cast_id_to_movie_ids[descriptions[i].id].size + ' movies');
        }
    });
}
//# sourceMappingURL=main.js.map