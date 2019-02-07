let api_key = "";
let base_uri = "https://api.themoviedb.org/3/";

function report_error(error_str: string) {
	document.getElementById('output_table').innerHTML = 'Error:' + error_str
}

function execute(request_url : string, args : any) {
	return new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		request.open('GET', base_uri + request_url + '?api_key=' + api_key + (Object.keys(args).length === 0 ? '' : '&') + 
			Object.keys(args).map(function(k) {
				return encodeURIComponent(k) + "=" + encodeURIComponent(args[k]);
			}).join('&') , true);
		request.onload = function () { 
				var data = JSON.parse(this.response);
				if (request.status >= 200 && request.status < 400) {
					resolve (data);
				}
				else {
					reject (data);
				}
			}
		request.send();
	});
}

function check_director() {
	let director_name_input = (<HTMLInputElement>document.getElementById('director_name_input')).value;
	execute ("search/person", {"query" : director_name_input})
		.then ((response:any) => { 
			let director_id = response.results[0].id;
			// console.log (response.results[0].name);
			return execute ('person/' + director_id + '/movie_credits', {})
		})
		.then ((response:any) => { 
			let id_set = new Set<number> ()
			for (let d of response.crew)
				id_set.add (d.id);
			return Promise.all ([...id_set].map (movie_id => execute (theMovieDb.movies.getCredits, {"id" : movie_id})));
		}).then ((result_array:Array<any>)=> {
			var cast_id_to_movie_ids : { [key:string]:Set<number>; } = {};
			for (let result of result_array) {
				for (let cast_data of result["cast"])
					cast_id_to_movie_ids[cast_data["id"]].add (result["id"]);
			}
		}
		);
}
