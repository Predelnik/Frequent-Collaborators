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
    constructor(id, name, release_date) {
        this.id = id;
        this.name = name;
        this.release_date = release_date;
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
    size() {
        return this.descriptions.length;
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
        document.getElementById('director_name').innerHTML = response.results[0].name;
        let director_id = response.results[0].id;
        return execute('person/' + director_id + '/movie_credits', {});
    })
        .then((response) => {
        let movie_description_set = new MovieSet();
        for (let d of response.crew) {
            if (d.job != 'Director')
                continue;
            movie_description_set.add(new MovieDescription(d.id, d.title, new Date(d.release_date)));
        }
        return Promise.all(movie_description_set.descriptions.map(movie_description => execute('movie/' + movie_description.id, { "id": movie_description.id, "append_to_response": "credits" }, { 'movie_description': movie_description })));
    }).then((result_array) => {
        let cast_id_to_movie_descriptions = {};
        let actor_set = new ActorSet();
        let movie_set = new MovieSet();
        for (let result of result_array) {
            for (let cast_data of result["credits"]["cast"]) {
                let cast_id = cast_data["id"];
                if (!(cast_id in cast_id_to_movie_descriptions))
                    cast_id_to_movie_descriptions[cast_id] = new MovieSet();
                let movie_id = result["id"];
                let actor_movie_set = cast_id_to_movie_descriptions[cast_id];
                let movie_description = result["movie_description"];
                actor_movie_set.add(movie_description);
                actor_set.add(new ActorDescription(cast_id, cast_data["name"]));
                movie_set.add(movie_description);
            }
        }
        actor_set.descriptions.sort((lhs, rhs) => cast_id_to_movie_descriptions[rhs.id].descriptions.length - cast_id_to_movie_descriptions[lhs.id].descriptions.length);
        movie_set.descriptions.sort((lhs, rhs) => lhs.release_date < rhs.release_date ? -1 : 1);
        let table_html = "<tr><th></th>" + movie_set.descriptions.map((description) => "<th>" + description.name + " (" + description.release_date.getFullYear() + ")" + "</th>").join("") + "<th>Total</th></tr>";
        for (let i = 0; i < Math.min(10, actor_set.descriptions.length); ++i) {
            let actor_description = actor_set.descriptions[i];
            table_html += "<tr>";
            table_html += "<td>" + (i + 1) + '. ' + actor_description.name + "</td>";
            for (let movie_description of movie_set.descriptions) {
                table_html += "<td>";
                if (cast_id_to_movie_descriptions[actor_description.id].id_set.has(movie_description.id))
                    table_html += "&#10003;";
                table_html += "</td>";
            }
            table_html += "<td>" + cast_id_to_movie_descriptions[actor_description.id].size() + "</td>";
            table_html += "</tr>";
        }
        let output_table_html = document.getElementById('output_table');
        output_table_html.innerHTML = table_html;
        output_table_html.style.width = movie_set.size() * 100 + 'px';
    });
}
//# sourceMappingURL=main.js.map