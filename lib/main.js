let api_key = "7a92a35fa5474d448234162762968104";
let base_uri = "https://api.themoviedb.org/3/";
function report_error(error_str) {
    document.getElementById('output_table').innerHTML = 'Error:' + error_str;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function execute(request_url, args, additional_data = {}, retry_count = 3) {
    return new Promise((resolve, reject) => {
        var request = new XMLHttpRequest();
        request.open('GET', base_uri + request_url + '?api_key=' + api_key + (Object.keys(args).length === 0 ? '' : '&') +
            Object.keys(args).map(k => {
                return encodeURIComponent(k) + "=" + encodeURIComponent(args[k]);
            }).join('&'), true);
        request.onload = function () {
            if (request.status == 429 && retry_count > 0) {
                return sleep(20000).then(() => execute(request_url, args, additional_data, retry_count - 1));
            }
            var data = JSON.parse(this.response);
            if (request.status >= 200 && request.status < 400) {
                resolve(Object.assign({}, data, additional_data));
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
class MovieDescription {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}
class IdObjectSet {
    constructor() {
        this.id_set = new Set();
        this.descriptions = new Array();
    }
    add(description) {
        if (this.id_set.has(description.id))
            return;
        this.id_set.add(description.id);
        this.descriptions.push(description);
    }
}
class MovieSet extends IdObjectSet {
}
class ActorSet extends IdObjectSet {
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
        let movie_description_set = new MovieSet();
        for (let d of response.crew)
            movie_description_set.add(new MovieDescription(d.id, d.title));
        return Promise.all(movie_description_set.descriptions.map(movie_description => execute('movie/' + movie_description.id + '/credits', { "id": movie_description.id }, { 'movie_title': movie_description.name })));
    }).then((result_array) => {
        let cast_id_to_movie_descriptions = {};
        let actor_set = new ActorSet();
        console.log(result_array);
        for (let result of result_array) {
            for (let cast_data of result["cast"]) {
                let cast_id = cast_data["id"];
                if (!(cast_id in cast_id_to_movie_descriptions))
                    cast_id_to_movie_descriptions[cast_id] = new MovieSet();
                let movie_id = result["id"];
                let movie_set = cast_id_to_movie_descriptions[cast_id];
                movie_set.add(new MovieDescription(movie_id, result["movie_title"]));
                actor_set.add(new ActorDescription(cast_id, cast_data["name"]));
            }
        }
        actor_set.descriptions.sort((desc_lhs, desc_rhs) => cast_id_to_movie_descriptions[desc_rhs.id].descriptions.length - cast_id_to_movie_descriptions[desc_lhs.id].descriptions.length);
        for (let i = 0; i < Math.min(10, actor_set.descriptions.length); ++i) {
            console.log(actor_set.descriptions[i].name + ' - ' + cast_id_to_movie_descriptions[actor_set.descriptions[i].id].descriptions.map(description => description.name).join(', ') + ' movies');
        }
    });
}
//# sourceMappingURL=main.js.map