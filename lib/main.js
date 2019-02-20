const api_key = "7a92a35fa5474d448234162762968104";
const base_uri = "https://api.themoviedb.org/3/";
function report_error(error_str) {
    document.getElementById('output_table').innerHTML = 'Error:' + error_str;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function execute(request_url, args, additional_data = {}, retry_count = 3) {
    const language = document.getElementById('language_select').value;
    return new Promise((resolve, reject) => {
        var request = new XMLHttpRequest();
        request.open('GET', base_uri + request_url + '?api_key=' + api_key + '&language=' + language + '&' + (Object.keys(args).length === 0 ? '' : '&') +
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
    const director_name_input = document.getElementById('director_name_input').value;
    execute("search/person", { "query": director_name_input })
        .then((response) => {
        document.getElementById('director_name').innerHTML = response.results[0].name;
        const director_id = response.results[0].id;
        return execute('person/' + director_id + '/movie_credits', {}, { "director_id": director_id });
    })
        .then((response) => {
        const movie_description_set = new MovieSet();
        for (const d of response.crew) {
            if (d.release_date == '')
                continue;
            if (d.job != 'Director')
                continue;
            movie_description_set.add(new MovieDescription(d.id, d.title, new Date(d.release_date)));
        }
        return Promise.all(movie_description_set.descriptions.map(movie_description => execute('movie/' + movie_description.id, { "id": movie_description.id, "append_to_response": "credits" }, { 'movie_description': movie_description, 'director_id': response.director_id })));
    }).then((result_array) => {
        const cast_id_to_movie_descriptions = {};
        const actor_set = new ActorSet();
        const movie_set = new MovieSet();
        const exclude_cameos = document.getElementById('exclude_cameos_checkbox').checked;
        for (const result of result_array) {
            for (const cast_data of result["credits"]["cast"]) {
                const cast_id = cast_data["id"];
                if (exclude_cameos && result.director_id == cast_id)
                    continue;
                if (!(cast_id in cast_id_to_movie_descriptions))
                    cast_id_to_movie_descriptions[cast_id] = new MovieSet();
                const movie_id = result["id"];
                const actor_movie_set = cast_id_to_movie_descriptions[cast_id];
                const movie_description = result["movie_description"];
                actor_movie_set.add(movie_description);
                actor_set.add(new ActorDescription(cast_id, cast_data["name"]));
                movie_set.add(movie_description);
            }
        }
        actor_set.descriptions.sort((lhs, rhs) => cast_id_to_movie_descriptions[rhs.id].descriptions.length - cast_id_to_movie_descriptions[lhs.id].descriptions.length);
        movie_set.descriptions.sort((lhs, rhs) => lhs.release_date < rhs.release_date ? -1 : 1);
        let table_html = "<tr><th class=\"table-vertical-header\"></th>" + movie_set.descriptions.map((description) => "<th>" + description.name + "</th>").join("") + "<th>Total</th></tr>";
        const top_n_to_show = document.getElementById('top_n_edit').valueAsNumber;
        const actor_count = Math.min(top_n_to_show, actor_set.descriptions.length);
        for (let i = 0; i < actor_count; ++i) {
            const actor_description = actor_set.descriptions[i];
            table_html += "<tr>";
            table_html += "<td class=\"table-vertical-header\">" + actor_description.name + "</td>";
            for (const movie_description of movie_set.descriptions) {
                table_html += "<td>";
                if (cast_id_to_movie_descriptions[actor_description.id].id_set.has(movie_description.id))
                    table_html += "&#10003;";
                table_html += "</td>";
            }
            table_html += "<td>" + cast_id_to_movie_descriptions[actor_description.id].size() + "</td>";
            table_html += "</tr>";
        }
        const output_table_html = document.getElementById('output_table');
        output_table_html.innerHTML = table_html;
        output_table_html.style.width = movie_set.size() * 120 + 'px';
    });
}
//# sourceMappingURL=main.js.map