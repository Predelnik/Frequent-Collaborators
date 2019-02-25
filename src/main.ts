const api_key = "";
const base_uri = "https://api.themoviedb.org/3/";

function report_error(error_str: string) {
	document.getElementById('output_table').innerHTML = 'Error:' + error_str
}

function sleep(ms : number) {
   return new Promise(resolve => setTimeout(resolve, ms));
}

class ApiLimitReached extends Error {
}

function execute(request_url : string, args : any, additional_data : any = {}, retry_count = 3) {
	const language = (document.getElementById ('language_select') as HTMLSelectElement).value;
	return new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		request.open('GET', base_uri + request_url + '?api_key=' + api_key + '&language=' + language + '&' + (Object.keys(args).length === 0 ? '' : '&') + 
			Object.keys(args).map(k => {
				return encodeURIComponent(k) + "=" + encodeURIComponent(args[k]);
			}).join('&') , true);
		request.onload = function () { 
				if (request.status == 429 && retry_count > 0) {
					return reject (new ApiLimitReached ());
				}
				var data = JSON.parse(this.response);
				if (request.status >= 200 && request.status < 400) {
					resolve ({...data, ...additional_data});
				}
				else {
					reject (data);
				}
			}
		request.send();
	}).catch ((error : ApiLimitReached) => {
		console.log ('Retrying')
		const sleep_time = 10000;
		if (retry_count > 0)
			return sleep (sleep_time).then (()=>execute (request_url, args, additional_data, retry_count - 1))
		else
			throw error;
	});
}

class ActorDescription {
	constructor(public readonly id: number, public readonly name: string) { }
}

class MovieDescription {
	constructor(public readonly id: number, public readonly name: string, public readonly release_date: Date) { }
}

interface IdObjectDescription {
    id: number;
}

class IdObjectSet<T extends IdObjectDescription> {
	id_set = new Set<number> ();
	descriptions = new Array<T>();
	add (description : T) {
		if (this.id_set.has (description.id))
			return;

		this.id_set.add (description.id);
		this.descriptions.push (description);
	}
	size() {
		return this.descriptions.length;
	}
	remove(id : number) {
		if (!this.id_set.has (id))
			return;
		
		this.id_set.delete (id);
		let location : number|undefined;
		for (let i = 0; i < this.descriptions.length; ++i) {
			if (this.descriptions[i].id == id)
				location = i;
		}
		if (location != null)
			this.descriptions.splice (location, 1);
	}
}

class MovieSet extends IdObjectSet<MovieDescription> {}
class ActorSet extends IdObjectSet<ActorDescription> {}

var current_movie_set : MovieSet = null;
var current_actor_set : ActorSet = null;
var raw_results : Array<any> = null;

function clear_table() {
	const output_table_html = document.getElementById('output_table');
	output_table_html.innerHTML = '';
}

function rebuild_table() {
	const cast_id_to_movie_descriptions : { [key:number]:MovieSet; } = {};
	const exclude_cameos = (document.getElementById ('exclude_cameos_checkbox') as HTMLInputElement).checked;
			for (const result of raw_results) {
				for (const cast_data of result["credits"]["cast"]) {
					const cast_id : number = cast_data["id"];

					if (!(cast_id in cast_id_to_movie_descriptions))
						cast_id_to_movie_descriptions[cast_id] = new MovieSet ();

					if (!current_actor_set.id_set.has (cast_id))
						continue;

					if (exclude_cameos && result.director_id == cast_id)
						continue;

					const movie_id = result["id"]
					if (!current_movie_set.id_set.has (movie_id))
						continue;
					const actor_movie_set = cast_id_to_movie_descriptions[cast_id];
					const movie_description = result["movie_description"];
					actor_movie_set.add (movie_description);
				}
			}

	current_actor_set.descriptions.sort ((lhs, rhs : ActorDescription) => cast_id_to_movie_descriptions[rhs.id].descriptions.length - cast_id_to_movie_descriptions[lhs.id].descriptions.length);
	current_movie_set.descriptions.sort ((lhs, rhs : MovieDescription) => lhs.release_date < rhs.release_date ? -1 : 1);

	let table_html : string = "<tr><th class=\"table-vertical-header\"></th>" + current_movie_set.descriptions.map ((description : MovieDescription) => '<th>' + description.name 
		+ '<img class="close-button" title="Remove Movie as Irrelevant" src="img/delete.svg" onclick=remove_movie(' + description.id + ')></img></th>').join("") + "<th>Total</th></tr>";
	const top_n_to_show = (document.getElementById ('top_n_edit') as HTMLInputElement).valueAsNumber;
	const actor_count = Math.min (top_n_to_show, current_actor_set.descriptions.length);
	for (let i = 0; i < actor_count; ++i) {
		const actor_description = current_actor_set.descriptions[i];
		table_html += "<tr>";
		table_html += "<td class=\"table-vertical-header\">" + actor_description.name + "</td>";
		for (const movie_description of current_movie_set.descriptions)
		{
			table_html += "<td>";
			if (cast_id_to_movie_descriptions[actor_description.id].id_set.has (movie_description.id))
				table_html += "&#10003;";
			table_html += "</td>";
		}
		table_html += "<td>" + cast_id_to_movie_descriptions[actor_description.id].size ()+ "</td>";
		table_html += "</tr>";
	}
	const output_table_html = document.getElementById('output_table');
	output_table_html.innerHTML = table_html;
	const section_size = 120;
	output_table_html.style.width = current_movie_set.size() * section_size + 'px';
}

function remove_movie(id : number) {
	current_movie_set.remove (id);
	rebuild_table ();
}

function check_director() {
	clear_table ();
	const loading_bar_html = document.getElementById('loading_bar');
	loading_bar_html.innerHTML = '<img src="img/ajax-loader.gif"></img>';
	const director_name_input = (<HTMLInputElement>document.getElementById('director_name_input')).value;
	execute ("search/person", {"query" : director_name_input})
		.then ((response:any) => {
			const director_name_html = document.getElementById('director_name');
			if (response.results.length == 0) {
				director_name_html.innerHTML = 'Person Not Found';
				throw new Error ('Person not Found');
			}
			director_name_html.innerHTML = response.results[0].name;
			const director_id = response.results[0].id;
			return execute ('person/' + director_id + '/movie_credits', {}, {"director_id" : director_id})
		})
		.then ((response:any) => { 
			const movie_description_set = new MovieSet ();
			for (const d of response.crew) {
				if (d.release_date == '')
					continue;
				if (d.job != 'Director')
					continue;
				movie_description_set.add (new MovieDescription (d.id, d.title, new Date (d.release_date)));
			}
			return Promise.all (movie_description_set.descriptions.map (movie_description => execute ('movie/' + movie_description.id, {"id" : movie_description.id, "append_to_response": "credits"}, {'movie_description' : movie_description, 'director_id' : response.director_id})));
		}).then ((result_array:Array<any>)=> {
			raw_results = result_array;
			current_actor_set = new ActorSet ();
			current_movie_set = new MovieSet ();
			for (const result of raw_results) {
				for (const cast_data of result["credits"]["cast"]) {
					const cast_id : number = cast_data["id"];
					const movie_description = result["movie_description"];
					current_actor_set.add (new ActorDescription (cast_id, cast_data["name"]));
					current_movie_set.add (movie_description);
				}
			}
			
			rebuild_table ();
		}
		)
		.catch (error => { console.log(error); })
		.finally (()=>{
			const loading_bar_html = document.getElementById('loading_bar');
			loading_bar_html.innerHTML = '';
		});
}
